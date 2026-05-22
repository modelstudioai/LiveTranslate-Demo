import asyncio
import json
import os
import sys

import websockets


MODEL = "qwen3.5-livetranslate-flash-realtime"
URLS = {
    "mainland": f"wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model={MODEL}",
    "intl": f"wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model={MODEL}",
}


async def main() -> int:
    api_key = os.getenv("DASHSCOPE_API_KEY", "").strip()
    if not api_key:
        print("DASHSCOPE_API_KEY is not set.")
        return 2
    region = sys.argv[1] if len(sys.argv) > 1 else "mainland"
    if region not in URLS:
        print("Usage: python3 check_access.py [mainland|intl]")
        return 2

    try:
        async with websockets.connect(
            URLS[region],
            additional_headers={"Authorization": f"Bearer {api_key}"},
        ) as ws:
            print(f"Connected to {MODEL} ({region}).")
            await ws.send(
                json.dumps(
                    {
                        "event_id": "access_check",
                        "type": "session.update",
                        "session": {
                            "modalities": ["text"],
                            "input_audio_format": "pcm",
                            "output_audio_format": "pcm",
                            "input_audio_transcription": {
                                "model": "qwen3-asr-flash-realtime"
                            },
                            "translation": {"language": "en"},
                        },
                    }
                )
            )

            for _ in range(3):
                raw = await asyncio.wait_for(ws.recv(), timeout=8)
                event = json.loads(raw)
                print(json.dumps(event, ensure_ascii=False, indent=2))
                if event.get("type") in {"session.created", "session.updated"}:
                    print("Access check passed.")
                    return 0
                if event.get("type") == "error":
                    print("Access check failed.")
                    return 1

            print("Connected, but no session confirmation was received.")
            return 1
    except Exception as exc:
        print(f"Access check failed: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
