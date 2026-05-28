import asyncio
import base64
import json
import os
import time
import uuid
from typing import Any

import websockets
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


APP_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(APP_DIR, "static")

MODEL = "qwen3.5-livetranslate-flash-realtime"
WS_URLS = {
    "intl": f"wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model={MODEL}",
    "mainland": f"wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model={MODEL}",
}

LANGUAGES = {
    "zh",
    "en",
    "ar",
    "de",
    "fr",
    "es",
    "pt",
    "id",
    "it",
    "ko",
    "ru",
    "th",
    "vi",
    "ja",
    "tr",
    "hi",
    "ms",
    "nl",
    "ur",
    "nb",
    "sv",
    "da",
    "he",
    "fi",
    "pl",
    "is",
    "cs",
    "fil",
    "fa",
    "yue",
    "el",
    "af",
    "ast",
    "be",
    "bg",
    "bn",
    "bs",
    "ca",
    "ceb",
    "et",
    "gl",
    "gu",
    "hr",
    "hu",
    "jv",
    "kk",
    "kn",
    "ky",
    "lv",
    "mk",
    "ml",
    "mr",
    "pa",
    "ro",
    "sk",
    "sl",
    "sw",
    "tg",
    "az",
    "uk",
}

AUDIO_LANGUAGES = {
    "zh",
    "en",
    "ar",
    "de",
    "fr",
    "es",
    "pt",
    "id",
    "it",
    "ko",
    "ru",
    "th",
    "vi",
    "ja",
    "tr",
    "hi",
    "ms",
    "nl",
    "ur",
    "nb",
    "sv",
    "da",
    "he",
    "fi",
    "pl",
    "is",
    "cs",
    "fil",
    "fa",
}

PRESET_VOICES = {
    "Tina",
    "Cindy",
    "Liora Mira",
    "Sunnybobi",
    "Raymond",
    "Ethan",
    "Theo Calm",
    "Serena",
    "Harvey",
    "Maia",
    "Evan",
    "Qiao",
    "Momo",
    "Wil",
    "Angel",
    "Li Cassian",
    "Mia",
    "Joyner",
    "Gold",
    "Katerina",
    "Ryan",
    "Jennifer",
    "Aiden",
    "Mione",
    "Sunny",
    "Dylan",
    "Eric",
    "Peter",
    "Joseph Chen",
    "Marcus",
    "Li",
    "Kiki",
    "Rocky",
    "Sohee",
    "Lenn",
    "Ono Anna",
    "Sonrisa",
    "Bodega",
    "Emilien",
    "Andre",
    "Radio Gol",
    "Alek",
    "Rizky",
    "Roya",
    "Arda",
    "Hana",
    "Dolce",
    "Jakub",
    "Griet",
    "Eliška",
    "Marina",
    "Siiri",
    "Ingrid",
    "Sigga",
    "Bea",
    "Chloe",
}
VOICE_CLONE_MODES = {"off", "once", "always"}
REQUEST_ID_KEYS = {
    "request_id",
    "requestId",
    "requestID",
    "requestid",
    "request-id",
    "x-requestid",
    "x-request-id",
    "x-acs-requestid",
    "x-acs-request-id",
    "x-dashscope-requestid",
    "x-dashscope-request-id",
    "dashscope-requestid",
    "dashscope-request-id",
}

app = FastAPI(title="Qwen3.5 LiveTranslate Demo")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path == "/" or request.url.path.startswith("/static/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
    return response


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


def event_id(prefix: str) -> str:
    return f"{prefix}_{int(time.time() * 1000)}"


def parse_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def clean_base64_data(value: Any) -> str:
    data = str(value or "").strip()
    if "," in data and data.startswith("data:"):
        return data.split(",", 1)[1]
    return data


def build_source_config_header(details: dict[str, Any]) -> str:
    input_mode = str(details.get("input_mode") or "mic")
    tab_tag = "camera" if input_mode == "camera" else "microphone"
    visual_tag = "visual_context_on" if details.get("visual_context") else "visual_context_off"
    trace_id = str(details.get("trace_id") or "")
    return json.dumps(
        {
            "channel": "livetranslatetool",
            "tags": {
                "t1": tab_tag,
                "t2": visual_tag,
                "trace_id": trace_id,
            },
        },
        separators=(",", ":"),
    )


def should_send_source_config_header(config: dict[str, Any]) -> bool:
    return parse_bool(config.get("source_config_enabled"), True)


def should_use_minimal_session(config: dict[str, Any]) -> bool:
    return parse_bool(config.get("minimal_session"), False)


def should_send_voice_config(config: dict[str, Any]) -> bool:
    return parse_bool(config.get("voice_config_enabled"), True)


def should_send_voice_clone_config(config: dict[str, Any]) -> bool:
    return parse_bool(config.get("voice_clone_config_enabled"), True)


def normalize_request_id_key(key: Any) -> str:
    return "".join(char for char in str(key).lower() if char.isalnum())


NORMALIZED_REQUEST_ID_KEYS = {normalize_request_id_key(key) for key in REQUEST_ID_KEYS}


def find_request_id(value: Any) -> str:
    if isinstance(value, dict):
        for key, item in value.items():
            if normalize_request_id_key(key) in NORMALIZED_REQUEST_ID_KEYS:
                request_id = str(item or "").strip()
                if request_id:
                    return request_id
        for item in value.values():
            request_id = find_request_id(item)
            if request_id:
                return request_id
    elif isinstance(value, list):
        for item in value:
            request_id = find_request_id(item)
            if request_id:
                return request_id
    return ""


def get_header_value(headers: Any, key: str) -> str:
    if not headers:
        return ""
    for candidate in {key, key.lower(), key.upper()}:
        try:
            value = headers.get(candidate)
        except AttributeError:
            value = None
        if value:
            return str(value).strip()
    normalized_key = normalize_request_id_key(key)
    for iterator_name in ("items", "raw_items"):
        iterator = getattr(headers, iterator_name, None)
        if not iterator:
            continue
        try:
            for header_key, value in iterator():
                if normalize_request_id_key(header_key) == normalized_key and value:
                    return str(value).strip()
        except (TypeError, ValueError):
            pass
    try:
        for header_key, value in headers:
            if normalize_request_id_key(header_key) == normalized_key and value:
                return str(value).strip()
    except (TypeError, ValueError):
        pass
    return ""


def extract_upstream_request_id(upstream: Any) -> str:
    for attr in ("response", "response_headers"):
        response = getattr(upstream, attr, None)
        headers = getattr(response, "headers", response)
        for key in REQUEST_ID_KEYS:
            request_id = get_header_value(headers, key)
            if request_id:
                return request_id
    return ""


async def safe_send_json(websocket: WebSocket, payload: dict[str, Any]) -> None:
    try:
        await websocket.send_json(payload)
    except RuntimeError:
        pass


async def read_config(websocket: WebSocket) -> dict[str, Any]:
    message = await websocket.receive_text()
    try:
        config = json.loads(message)
    except json.JSONDecodeError as exc:
        raise ValueError("The first WebSocket message must be JSON config.") from exc
    if not isinstance(config, dict) or config.get("type") != "config":
        raise ValueError("The first WebSocket message must have type=config.")
    return config


def normalize_event(event: dict[str, Any]) -> dict[str, Any]:
    event_type = event.get("type", "unknown")
    payload: dict[str, Any] = {"type": "model_event", "event_type": event_type}
    request_id = find_request_id(event)
    if request_id:
        payload["request_id"] = request_id

    if event_type in {"session.created", "session.updated"}:
        payload["status"] = "connected"
    elif event_type == "conversation.item.input_audio_transcription.text":
        payload["source_partial"] = event.get("stash") or event.get("delta") or event.get("text") or ""
    elif event_type == "conversation.item.input_audio_transcription.completed":
        payload["source_final"] = event.get("transcript") or event.get("text") or ""
    elif event_type == "response.created":
        payload["status"] = "translating"
        payload["response_started"] = True
    elif event_type == "response.audio.delta":
        audio_b64 = event.get("delta") or ""
        if audio_b64:
            audio_data = base64.b64decode(audio_b64)
            return {
                "type": "model_audio",
                "audio": base64.b64encode(audio_data).decode("ascii"),
                "sample_rate": 24000,
                "format": "pcm",
            }
    elif event_type == "response.text.done":
        payload["translation_final"] = event.get("text") or ""
    elif event_type == "response.audio_transcript.text":
        payload["translation_partial"] = event.get("delta") or event.get("text") or ""
    elif event_type == "response.audio_transcript.done":
        payload["translation_final"] = event.get("transcript") or event.get("text") or ""
    elif event_type == "response.done":
        payload["status"] = "listening"
        payload["response_done"] = True
        payload["usage"] = event.get("response", {}).get("usage")
    elif event_type == "response.audio.done":
        payload["audio_done"] = True
    elif event_type == "error":
        payload["message"] = event.get("message") or event.get("error") or str(event)

    return payload


def build_session(config: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    source_language = str(config.get("source_language", "auto")).strip()
    target_language = str(config.get("target_language", "en")).strip()
    region = str(config.get("region", "mainland")).strip()
    voice = str(config.get("voice", "Tina")).strip()
    voice_clone_mode = str(config.get("voice_clone_mode", "off")).strip()
    input_mode = str(config.get("input_mode", "mic")).strip()
    visual_context = parse_bool(config.get("visual_context"), input_mode == "camera")
    audio_requested = parse_bool(config.get("audio_enabled"), True)
    minimal_session = should_use_minimal_session(config)
    voice_config_enabled = should_send_voice_config(config)
    voice_clone_config_enabled = should_send_voice_clone_config(config)

    if region not in WS_URLS:
        raise ValueError(f"Unsupported region: {region}")
    if input_mode not in {"mic", "camera"}:
        raise ValueError(f"Unsupported input mode: {input_mode}")
    if source_language != "auto" and source_language not in LANGUAGES:
        raise ValueError(f"Unsupported source language: {source_language}")
    if target_language not in LANGUAGES:
        raise ValueError(f"Unsupported target language: {target_language}")
    if voice_clone_mode not in VOICE_CLONE_MODES:
        raise ValueError(f"Unsupported voice clone mode: {voice_clone_mode}")

    audio_enabled = audio_requested and target_language in AUDIO_LANGUAGES
    using_clone = audio_enabled and voice_clone_mode != "off" and voice_clone_config_enabled
    if audio_enabled and not using_clone and voice not in PRESET_VOICES:
        raise ValueError(f"Unsupported preset voice: {voice}")

    session: dict[str, Any] = {
        "modalities": ["text", "audio"] if audio_enabled else ["text"],
        "input_audio_format": "pcm",
        "output_audio_format": "pcm",
        "translation": {"language": target_language},
    }

    if not minimal_session:
        input_transcription: dict[str, Any] = {"model": "qwen3-asr-flash-realtime"}
        if source_language != "auto":
            input_transcription["language"] = source_language
        session["input_audio_transcription"] = input_transcription

    if audio_enabled and not minimal_session and voice_config_enabled:
        if using_clone:
            session["voice"] = "default"
            session["enable_voice_clone"] = True
            session["voice_clone_options"] = {"frequency": voice_clone_mode}
        else:
            session["voice"] = voice

    details = {
        "region": region,
        "source_language": source_language,
        "target_language": target_language,
        "audio_enabled": audio_enabled,
        "voice": session.get("voice"),
        "voice_clone_mode": voice_clone_mode if using_clone else "off",
        "input_mode": input_mode,
        "visual_context": visual_context,
        "minimal_session": minimal_session,
        "voice_config_enabled": voice_config_enabled,
        "voice_clone_config_enabled": voice_clone_config_enabled,
    }
    return session, details


@app.websocket("/ws/livetranslate")
async def livetranslate(websocket: WebSocket) -> None:
    await websocket.accept()
    upstream = None
    image_frame_count = 0

    try:
        config = await read_config(websocket)
        api_key = str(config.get("api_key", "")).strip()
        if not api_key:
            raise ValueError("Enter a DashScope API key before starting.")

        session, details = build_session(config)
        details["trace_id"] = f"lt_{int(time.time())}_{uuid.uuid4().hex[:8]}"
        source_config_header = build_source_config_header(details)
        source_config_enabled = should_send_source_config_header(config)
        upstream_headers = {"Authorization": f"Bearer {api_key}"}
        if source_config_enabled:
            upstream_headers["X-DashScope-Source-Config"] = source_config_header
        upstream = await websockets.connect(
            WS_URLS[details["region"]],
            additional_headers=upstream_headers,
        )
        request_id = extract_upstream_request_id(upstream)
        print(
            f"DashScope realtime connected request_id={request_id or 'unavailable'} "
            f"trace_id={details['trace_id']} "
            f"source_config_enabled={source_config_enabled} source_config={source_config_header}",
            flush=True,
        )
        await upstream.send(
            json.dumps(
                {
                    "event_id": event_id("session"),
                    "type": "session.update",
                    "session": session,
                },
                ensure_ascii=False,
            )
        )
        await websocket.send_json(
            {
                "type": "server_ready",
                "model": MODEL,
                "sample_rate": 16000,
                "frame_ms": 100,
                "request_id": request_id,
                "trace_id": details["trace_id"],
                "source_config_enabled": source_config_enabled,
                "source_config": source_config_header if source_config_enabled else "",
                **details,
            }
        )

        async def browser_to_model() -> None:
            nonlocal image_frame_count
            while True:
                message = await websocket.receive()
                if "bytes" in message:
                    audio = message["bytes"]
                    if audio:
                        await upstream.send(
                            json.dumps(
                                {
                                    "event_id": event_id("audio"),
                                    "type": "input_audio_buffer.append",
                                    "audio": base64.b64encode(audio).decode("ascii"),
                                }
                            )
                        )
                elif "text" in message and message["text"] == "stop":
                    break
                elif "text" in message:
                    try:
                        control = json.loads(message["text"])
                    except json.JSONDecodeError:
                        continue

                    if control.get("type") == "image_frame":
                        image = clean_base64_data(control.get("image"))
                        if image:
                            image_frame_count += 1
                            await upstream.send(
                                json.dumps(
                                    {
                                        "event_id": event_id("image"),
                                        "type": "input_image_buffer.append",
                                        "image": image,
                                    }
                                )
                            )
                            await safe_send_json(
                                websocket,
                                {
                                    "type": "image_frame_ack",
                                    "count": image_frame_count,
                                },
                            )
                elif message.get("type") == "websocket.disconnect":
                    break

        async def model_to_browser() -> None:
            try:
                async for raw in upstream:
                    try:
                        event = json.loads(raw)
                    except json.JSONDecodeError:
                        await safe_send_json(
                            websocket,
                            {"type": "server_error", "message": f"Non-JSON upstream message: {raw}"},
                        )
                        continue
                    await safe_send_json(websocket, normalize_event(event))
            except websockets.exceptions.ConnectionClosed as exc:
                reason = str(getattr(exc, "reason", "") or exc)
                await safe_send_json(
                    websocket,
                    {
                        "type": "server_error",
                        "message": f"DashScope closed the realtime connection: {reason}",
                    },
                )

        done, pending = await asyncio.wait(
            {
                asyncio.create_task(browser_to_model()),
                asyncio.create_task(model_to_browser()),
            },
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
        for task in done:
            task.result()

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        message = str(exc)
        header_note = ""
        if "source_config_enabled" in locals():
            header_note = (
                f" Source header: {'enabled' if source_config_enabled else 'disabled'}."
            )
        if "HTTP 401" in message:
            message = (
                "DashScope rejected the WebSocket connection with HTTP 401. "
                "Check that the API key is valid for the selected region, or clear the stored key "
                "with 'Forget key' and paste the correct key again."
                + header_note
            )
        elif "Access denied" in message or "1007" in message:
            message = (
                "DashScope closed the realtime connection with 'Access denied'. "
                "The key is syntactically valid, but it likely does not have permission for "
                "qwen3.5-livetranslate-flash-realtime in the selected region. Try the other Region "
                "option, verify the key belongs to the same DashScope/Bailian site, or request model access."
                + header_note
            )
        await safe_send_json(websocket, {"type": "server_error", "message": message})
    finally:
        if upstream:
            await upstream.close()
