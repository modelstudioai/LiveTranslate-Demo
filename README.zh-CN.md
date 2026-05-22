# Qwen3.5 LiveTranslate Demo

[English](README.md)

这是一个基于 `qwen3.5-livetranslate-flash-realtime` 的本地浏览器 Demo。页面会采集浏览器麦克风音频，经由本地 FastAPI WebSocket 后端代理到 DashScope / Model Studio 实时翻译接口，并把源语言转写、翻译文本和翻译语音实时展示在浏览器中。Camera 模式还可以从摄像头采集画面帧，作为视觉上下文发送给模型。

## 模型简介

Qwen3.5-LiveTranslate-Flash 是 Qwen 家族最新的同声传译模型，基于 Qwen3.5-Omni 构建。它提供实时、多模态翻译能力，不仅能够听懂并翻译语音，还能看见并理解视觉上下文，从而产出更准确的译文。

与前代 Qwen3-LiveTranslate 相比，Qwen3.5-LiveTranslate-Flash 在语言覆盖范围、翻译延迟、声音克隆和术语处理等方面均有明显升级，适用于跨国会议、直播本地化、在线课堂、商务谈判、技术发布会等场景。

主要能力包括：

- 多语种覆盖升级：能听懂的语种从 18 种扩展到 60 种，会说的语种从 10 种扩展到 29 种，覆盖更多国家与区域的语言互译组合。
- 超低延迟：通过可读单元（Readable Unit）实时翻译技术，在保证译文可读性与语义一致性的同时实现更激进的流式输出。首字延迟可低至 2.5 秒，字均延迟可低至 2.8 秒。
- 实时音色克隆：同传过程中可复刻说话人的音色特征，让译文语音在不同语言间保持“同一个人”的声音质感与表现力。
- 热词增强：支持通过热词能力提升人名、地名、品牌名、产品型号、行业术语等专有词汇的识别和翻译准确性。
- 视觉增强：可结合摄像头或视频帧中的画面信息，帮助模型理解口型、动作、文字和现场上下文，改善嘈杂环境或一词多义场景下的翻译效果。

## 功能特性

- Microphone 模式：直接使用浏览器麦克风进行实时语音翻译。
- Camera 模式：同时发送麦克风音频和摄像头画面帧，展示视觉上下文增强翻译。
- 浏览器端采集 16 kHz mono PCM16 音频。
- 源语言转写和翻译文本双栏展示，支持滚动历史。
- 支持翻译语音实时播放，并在 Stop 后保留本轮翻译音频记录。
- 浏览器播放模型返回的 24 kHz PCM 音频。
- 默认支持源语言自动识别。
- 支持 Qwen3.5 LiveTranslate 的 60 个目标语种。
- 支持中国大陆站点和新加坡 / 国际站点切换。
- API Key 在页面中输入并保存到浏览器 `localStorage`。
- 当服务返回 token usage 时，页面会展示本轮会话 token 消耗。

## 环境要求

- Python 3.10+
- 已开通 `qwen3.5-livetranslate-flash-realtime` 权限的 DashScope / Model Studio API Key
- 支持麦克风权限的现代浏览器
- 如需使用 Camera 模式，需要浏览器摄像头权限

## 安装

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

## 运行

```bash
python3 -m uvicorn server:app --host 127.0.0.1 --port 8010
```

打开浏览器访问：

```text
http://127.0.0.1:8010
```

在页面中输入 DashScope / Model Studio API Key。正常浏览器使用不需要配置环境变量，API Key 会保存在浏览器 `localStorage` 中，并只会作为首条 WebSocket config 消息发送给本地后端。

如需移除本地保存的 API Key，可以点击输入框右侧的清除按钮。

## 创建 API Key

可以点击页面 API key 字段旁边的 `?` 按钮，也可以直接打开对应控制台：

- 中国大陆：<https://bailian.console.aliyun.com/cn-beijing?tab=model&source_channel=livetranslatedemo#/api-key>
- 新加坡 / 国际站：<https://modelstudio.console.alibabacloud.com/ap-southeast-1?tab=globalset&source_channel=livetranslatedemointl#/efm/api_key>

请确保 Demo 中选择的 Region 与 API Key 所属站点一致。

## Region Endpoint

- 中国大陆：`wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-livetranslate-flash-realtime`
- 新加坡 / 国际站：`wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-livetranslate-flash-realtime`

## 语种与音频输出支持

Qwen3.5 LiveTranslate 支持 60 种语言互译。部分目标语种支持“文本 + 音频”输出，部分目标语种仅支持文本输出。

支持音频输出的目标语种：

```text
zh, en, ar, de, fr, es, pt, id, it, ko, ru, th, vi, ja, tr, hi,
ms, nl, ur, nb, sv, da, he, fi, pl, is, cs, fil, fa
```

仅支持文本输出的目标语种：

```text
yue, el, af, ast, be, bg, bn, bs, ca, ceb, et, gl, gu, hr, hu, jv,
kk, kn, ky, lv, mk, ml, mr, pa, ro, sk, sl, sw, tg, az, uk
```

当选择仅文本语种作为目标语言时，页面会自动关闭 Voice output，并且后端会请求 `modalities: ["text"]`。

## 权限检查脚本

`check_access.py` 可以在不打开浏览器的情况下验证 API Key 是否能连接实时翻译模型。

```bash
export DASHSCOPE_API_KEY="your_api_key"
python3 check_access.py mainland
python3 check_access.py intl
```

## 项目结构

```text
.
├── README.md
├── README.zh-CN.md
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

发布仓库前请补充 License。Demo 项目通常可以选择 Apache-2.0 或 MIT。
