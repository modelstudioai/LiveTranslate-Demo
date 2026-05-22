# Qwen3.5 LiveTranslate Demo

[中文说明](README.zh-CN.md)

A standalone browser demo for `qwen3.5-livetranslate-flash-realtime`.

The app captures microphone audio in the browser, relays it through a local FastAPI WebSocket proxy, and streams realtime translation results back to the page. Camera mode can also send JPEG frames as visual context for the model.

## Features

- Microphone mode for realtime speech translation.
- Camera mode for audio plus visual context via `input_image_buffer.append`.
- 16 kHz mono PCM16 browser audio input.
- Source transcript and translated text panels with scrollable history.
- Optional translated audio playback and retained audio record after Stop.
- 24 kHz PCM audio playback in the browser.
- Automatic source language mode.
- 60 target languages supported by Qwen3.5 LiveTranslate.
- Region selector for Chinese mainland and Singapore/Intl endpoints.
- API key entry in the browser with local `localStorage` persistence.
- Session token usage display when returned by the service.

## Requirements

- Python 3.10+
- A DashScope / Model Studio API key with access to `qwen3.5-livetranslate-flash-realtime`
- A modern browser with microphone permission
- Camera permission if using Camera mode

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

## Run

```bash
python3 -m uvicorn server:app --host 127.0.0.1 --port 8010
```

Open:

```text
http://127.0.0.1:8010
```

Enter your API key in the page. The key is stored in browser `localStorage` and is sent only to the local backend as the first WebSocket config message. The app does not require an API key environment variable for normal browser use.

Use the clear button in the API key field to remove the locally stored key.

## Create an API Key

Use the `?` button next to the API key field, or open the matching console directly:

- Chinese mainland: <https://bailian.console.aliyun.com/cn-beijing?tab=model&source_channel=livetranslatedemo#/api-key>
- Singapore / Intl: <https://modelstudio.console.alibabacloud.com/ap-southeast-1?tab=globalset&source_channel=livetranslatedemointl#/efm/api_key>

Make sure the selected Region in the demo matches the site where the API key was created.

## Region Endpoints

- Chinese mainland: `wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-livetranslate-flash-realtime`
- Singapore / Intl: `wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-livetranslate-flash-realtime`

## Language and Audio Support

Qwen3.5 LiveTranslate supports 60 languages. Some target languages support text plus audio output, while others support text only.

Audio-capable target languages:

```text
zh, en, ar, de, fr, es, pt, id, it, ko, ru, th, vi, ja, tr, hi,
ms, nl, ur, nb, sv, da, he, fi, pl, is, cs, fil, fa
```

Text-only target languages:

```text
yue, el, af, ast, be, bg, bn, bs, ca, ceb, et, gl, gu, hr, hu, jv,
kk, kn, ky, lv, mk, ml, mr, pa, ro, sk, sl, sw, tg, az, uk
```

When a text-only target language is selected, the UI automatically disables voice output and the backend requests `modalities: ["text"]`.

## Access Check Script

`check_access.py` can verify that a key can connect to the realtime model without opening the browser.

```bash
export DASHSCOPE_API_KEY="your_api_key"
python3 check_access.py mainland
python3 check_access.py intl
```

## Project Structure

```text
.
├── README.md
├── requirements.txt
├── server.py
├── check_access.py
└── static
    ├── index.html
    ├── app.js
    ├── styles.css
    └── github-qr.svg
```

## License

Add a license before publishing the repository. Apache-2.0 or MIT are common choices for demos.
