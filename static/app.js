const apiKeyInput = document.querySelector("#apiKey");
const workspace = document.querySelector("#workspace");
const controls = document.querySelector(".controls");
const micTab = document.querySelector("#micTab");
const cameraTab = document.querySelector("#cameraTab");
const regionSelect = document.querySelector("#region");
const sourceLanguageSelect = document.querySelector("#sourceLanguage");
const targetLanguageSelect = document.querySelector("#targetLanguage");
const audioEnabledInput = document.querySelector("#audioEnabled");
const audioToggleText = document.querySelector("#audioToggleText");
const voiceSelect = document.querySelector("#voice");
const voiceCloneModeSelect = document.querySelector("#voiceCloneMode");
const cameraPanel = document.querySelector("#cameraPanel");
const cameraPreview = document.querySelector("#cameraPreview");
const cameraSubtitle = document.querySelector("#cameraSubtitle");
const cameraDeviceSelect = document.querySelector("#cameraDevice");
const visualContextEnabledInput = document.querySelector("#visualContextEnabled");
const frameRateSelect = document.querySelector("#frameRate");
const cameraControls = document.querySelectorAll(".camera-control");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const clearButton = document.querySelector("#clearButton");
const forgetKeyButton = document.querySelector("#forgetKeyButton");
const apiKeyHelpButton = document.querySelector("#apiKeyHelpButton");
const sourceText = document.querySelector("#sourceText");
const translationText = document.querySelector("#translationText");
const audioRecord = document.querySelector("#audioRecord");
const audioRecordPlayer = document.querySelector("#audioRecordPlayer");
const audioRecordDetails = document.querySelector("#audioRecordDetails");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const levelBar = document.querySelector("#levelBar");
const metrics = document.querySelector("#metrics");

const INPUT_SAMPLE_RATE = 16000;
const FRAME_SAMPLES = 1600;
const OUTPUT_SAMPLE_RATE = 24000;
const CAMERA_FRAME_WIDTH = 640;
const CAMERA_SUBTITLE_MAX_CHARS = 96;
const API_KEY_URLS = {
  mainland:
    "https://bailian.console.aliyun.com/cn-beijing?tab=model&source_channel=livetranslatedemo#/api-key",
  intl:
    "https://modelstudio.console.alibabacloud.com/ap-southeast-1?tab=globalset&source_channel=livetranslatedemointl#/efm/api_key",
};

const LANGUAGES = [
  ["zh", "Chinese"],
  ["en", "English"],
  ["ar", "Arabic"],
  ["de", "German"],
  ["fr", "French"],
  ["es", "Spanish"],
  ["pt", "Portuguese"],
  ["id", "Indonesian"],
  ["it", "Italian"],
  ["ko", "Korean"],
  ["ru", "Russian"],
  ["th", "Thai"],
  ["vi", "Vietnamese"],
  ["ja", "Japanese"],
  ["tr", "Turkish"],
  ["hi", "Hindi"],
  ["ms", "Malay"],
  ["nl", "Dutch"],
  ["ur", "Urdu"],
  ["nb", "Norwegian"],
  ["sv", "Swedish"],
  ["da", "Danish"],
  ["he", "Hebrew"],
  ["fi", "Finnish"],
  ["pl", "Polish"],
  ["is", "Icelandic"],
  ["cs", "Czech"],
  ["fil", "Filipino"],
  ["fa", "Persian"],
  ["yue", "Cantonese"],
  ["el", "Greek"],
  ["af", "Afrikaans"],
  ["ast", "Asturian"],
  ["be", "Belarusian"],
  ["bg", "Bulgarian"],
  ["bn", "Bengali"],
  ["bs", "Bosnian"],
  ["ca", "Catalan"],
  ["ceb", "Cebuano"],
  ["et", "Estonian"],
  ["gl", "Galician"],
  ["gu", "Gujarati"],
  ["hr", "Croatian"],
  ["hu", "Hungarian"],
  ["jv", "Javanese"],
  ["kk", "Kazakh"],
  ["kn", "Kannada"],
  ["ky", "Kyrgyz"],
  ["lv", "Latvian"],
  ["mk", "Macedonian"],
  ["ml", "Malayalam"],
  ["mr", "Marathi"],
  ["pa", "Punjabi"],
  ["ro", "Romanian"],
  ["sk", "Slovak"],
  ["sl", "Slovenian"],
  ["sw", "Swahili"],
  ["tg", "Tajik"],
  ["az", "Azerbaijani"],
  ["uk", "Ukrainian"],
];

const AUDIO_LANGUAGES = new Set([
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
]);

const VOICES = [
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
];

let socket = null;
let captureContext = null;
let playbackContext = null;
let mediaStream = null;
let sourceNode = null;
let processorNode = null;
let activeMode = "mic";
let cameraFrameTimer = null;
let cameraCanvas = null;
let pendingSamples = [];
let nextPlaybackTime = 0;
let translatedAudioChunks = [];
let translatedAudioSampleRate = OUTPUT_SAMPLE_RATE;
let translatedAudioUrl = "";
let sessionStartedAt = 0;
let imageFramesSent = 0;
let imageFramesForwarded = 0;

let sourceHistory = [];
let sourceDraft = "";
let lastSourceFinal = "";
let lastSourcePartial = "";
let translationHistory = [];
let translationDraft = "";
let lastTranslationFinal = "";
let lastTranslationPartial = "";
let sessionInfoText = "Model: qwen3.5-livetranslate-flash-realtime";
let sessionTokenUsage = {
  input_tokens: 0,
  output_tokens: 0,
  total_tokens: 0,
};
let lastRequestId = "";
let lastTraceId = "";

const storedApiKey = localStorage.getItem("dashscope_api_key");
if (storedApiKey) apiKeyInput.value = storedApiKey;

function isSourceConfigHeaderEnabled() {
  return new URLSearchParams(window.location.search).get("source_header") !== "0";
}

function isMinimalSessionEnabled() {
  return new URLSearchParams(window.location.search).get("minimal_session") === "1";
}

function isVoiceConfigEnabled() {
  return new URLSearchParams(window.location.search).get("voice_config") !== "0";
}

function isVoiceCloneConfigEnabled() {
  return new URLSearchParams(window.location.search).get("voice_clone_config") !== "0";
}

function populateControls() {
  const auto = document.createElement("option");
  auto.value = "auto";
  auto.textContent = "Auto";
  sourceLanguageSelect.appendChild(auto);

  for (const [code, label] of LANGUAGES) {
    const sourceOption = document.createElement("option");
    sourceOption.value = code;
    sourceOption.textContent = label;
    sourceLanguageSelect.appendChild(sourceOption);

    const targetOption = document.createElement("option");
    targetOption.value = code;
    targetOption.textContent = label;
    targetLanguageSelect.appendChild(targetOption);
  }

  for (const voice of VOICES) {
    const option = document.createElement("option");
    option.value = voice;
    option.textContent = voice;
    voiceSelect.appendChild(option);
  }

  sourceLanguageSelect.value = "auto";
  targetLanguageSelect.value = "en";
  voiceSelect.value = "Tina";
}

async function populateCameraDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter((device) => device.kind === "videoinput");
  const currentValue = cameraDeviceSelect.value;
  cameraDeviceSelect.textContent = "";

  const autoOption = document.createElement("option");
  autoOption.value = "";
  autoOption.textContent = "Default camera";
  cameraDeviceSelect.appendChild(autoOption);

  cameras.forEach((camera, index) => {
    const option = document.createElement("option");
    option.value = camera.deviceId;
    option.textContent = camera.label || `Camera ${index + 1}`;
    cameraDeviceSelect.appendChild(option);
  });

  cameraDeviceSelect.value = [...cameraDeviceSelect.options].some(
    (option) => option.value === currentValue,
  )
    ? currentValue
    : "";
}

function setMode(mode) {
  if (socket) stop();
  activeMode = mode;
  const cameraMode = mode === "camera";
  workspace.classList.toggle("camera-mode", cameraMode);
  controls.classList.toggle("camera-mode", cameraMode);
  cameraPanel.hidden = !cameraMode;
  micTab.classList.toggle("active", !cameraMode);
  cameraTab.classList.toggle("active", cameraMode);
  cameraControls.forEach((control) => {
    control.hidden = !cameraMode;
  });
  if (cameraMode && !socket) {
    visualContextEnabledInput.checked = true;
  }
  resetPlayback();
  resetTextState(
    cameraMode ? "Press Start and speak while showing context to the camera." : "Press Start and speak into the microphone.",
    "Translation will appear here.",
  );
  renderCameraSubtitle();
  if (cameraMode) {
    populateCameraDevices().catch(() => {
      metrics.textContent = "Camera list unavailable until permission is granted.";
    });
  }
  renderMetrics();
}

function setStatus(label, state = "idle") {
  statusText.textContent = label;
  statusDot.className = "status-dot";
  if (state === "active") statusDot.classList.add("active");
  if (state === "warn") statusDot.classList.add("warn");
  if (state === "error") statusDot.classList.add("error");
}

function syncVoiceControls() {
  const supportsAudio = AUDIO_LANGUAGES.has(targetLanguageSelect.value);
  audioEnabledInput.disabled = !supportsAudio;
  if (!supportsAudio) audioEnabledInput.checked = false;

  const audioEnabled = supportsAudio && audioEnabledInput.checked;
  voiceSelect.disabled = !audioEnabled || voiceCloneModeSelect.value !== "off";
  voiceCloneModeSelect.disabled = !audioEnabled;
  voiceSelect.closest("label").classList.toggle("is-muted", !audioEnabled);
  voiceCloneModeSelect.closest("label").classList.toggle("is-muted", !audioEnabled);
  audioToggleText.textContent = !supportsAudio ? "Text only" : audioEnabled ? "On" : "Off";

  if (!supportsAudio) {
    sessionInfoText = "Selected target is text-only.";
  } else if (audioEnabled && voiceCloneModeSelect.value !== "off") {
    sessionInfoText =
      voiceCloneModeSelect.value === "once"
        ? "Voice clone once: speak clearly for a few seconds before judging the voice."
        : "Voice clone each response: speakers must take separate turns with a pause.";
  } else {
    sessionInfoText = audioEnabled ? `Voice: ${voiceSelect.value}.` : "Text-only mode.";
  }
  renderMetrics();
}

function renderMetrics() {
  const total = sessionTokenUsage.total_tokens || 0;
  const input = sessionTokenUsage.input_tokens || 0;
  const output = sessionTokenUsage.output_tokens || 0;
  const requestText = lastRequestId ? ` · Request: ${lastRequestId}` : "";
  const traceText = lastTraceId ? ` · Trace: ${lastTraceId}` : "";
  const imageText =
    activeMode === "camera" ? ` · Image frames: ${imageFramesForwarded}/${imageFramesSent}` : "";
  metrics.textContent = `${sessionInfoText}${imageText} · Session tokens: ${total} (in ${input} / out ${output})${requestText}${traceText}`;
}

function resetSessionUsage() {
  sessionTokenUsage = {
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
  };
  lastRequestId = "";
  lastTraceId = "";
  imageFramesSent = 0;
  imageFramesForwarded = 0;
  renderMetrics();
}

function addUsage(usage) {
  if (!usage || typeof usage !== "object") return;
  sessionTokenUsage.input_tokens += Number(usage.input_tokens || 0);
  sessionTokenUsage.output_tokens += Number(usage.output_tokens || 0);
  sessionTokenUsage.total_tokens += Number(usage.total_tokens || 0);
  renderMetrics();
}

function captureRequestId(requestId) {
  const next = String(requestId || "").trim();
  if (!next) return;
  lastRequestId = next;
  renderMetrics();
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function historyText(history, separator = " ") {
  return history.filter(Boolean).join(separator).trim();
}

function stripKnownSourcePrefix(text) {
  const prefixes = [
    historyText(sourceHistory, " "),
    historyText(sourceHistory, ""),
    lastSourceFinal,
    sourceHistory[sourceHistory.length - 1] || "",
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) return text.slice(prefix.length).trim();
  }
  return text;
}

function alreadyHasFinal(history, text) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return true;
  const normalizedHistory = normalizeText(historyText(history, " "));
  if (normalizedHistory === normalizedText) return true;
  if (normalizedText.length > 12 && normalizedHistory.includes(normalizedText)) return true;
  return history.some((item) => normalizeText(item) === normalizedText);
}

function stripKnownTranslationPrefix(text) {
  const prefixes = [
    historyText(translationHistory, " "),
    historyText(translationHistory, ""),
    lastTranslationFinal,
    translationHistory[translationHistory.length - 1] || "",
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) return text.slice(prefix.length).trim();
  }
  return text;
}

function makeLine(text, className = "line") {
  const line = document.createElement("span");
  line.className = className;
  line.textContent = text;
  return line;
}

function renderPanel(container, history, draft, placeholder) {
  container.textContent = "";
  container.classList.toggle("placeholder", !history.length && !draft);
  for (const item of history) {
    container.appendChild(makeLine(item));
  }
  if (draft) {
    container.appendChild(makeLine(draft, "line draft"));
  }
  if (!history.length && !draft) {
    container.textContent = placeholder;
  }
  container.scrollTop = container.scrollHeight;
}

function renderSource() {
  renderPanel(sourceText, sourceHistory, sourceDraft, "Source transcript will appear here.");
}

function renderTranslation() {
  renderPanel(translationText, translationHistory, translationDraft, "Translation will appear here.");
  renderCameraSubtitle();
}

function renderCameraSubtitle() {
  if (!cameraSubtitle) return;
  const subtitle = compactSubtitle(
    translationDraft || translationHistory[translationHistory.length - 1] || "",
  );
  cameraSubtitle.classList.toggle("placeholder", !subtitle);
  cameraSubtitle.textContent = subtitle || "Translated subtitles will appear here.";
}

function compactSubtitle(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= CAMERA_SUBTITLE_MAX_CHARS) return normalized;

  const sentences = normalized
    .split(/(?<=[.!?。！？])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const lastSentence = sentences[sentences.length - 1] || normalized;
  if (lastSentence.length <= CAMERA_SUBTITLE_MAX_CHARS) return lastSentence;
  return lastSentence.slice(-CAMERA_SUBTITLE_MAX_CHARS).trim();
}

function updateDraft(kind, text) {
  const next = text.trim();
  if (!next) return;

  if (kind === "source") {
    if (next === lastSourcePartial) return;
    const draft = stripKnownSourcePrefix(next);
    sourceDraft = draft || next;
    lastSourcePartial = next;
    renderSource();
    return;
  }

  if (next === lastTranslationPartial) return;
  const current = translationDraft;
  const normalizedNext = normalizeText(next);
  const normalizedCurrent = normalizeText(current);
  const normalizedFinal = normalizeText(lastTranslationFinal);
  if (normalizedFinal && normalizedNext.startsWith(normalizedFinal)) {
    translationDraft = next.slice(lastTranslationFinal.length).trim();
  } else if (!current || normalizedNext.startsWith(normalizedCurrent)) {
    translationDraft = next;
  } else if (!normalizedCurrent.includes(normalizedNext)) {
    translationDraft = `${current}${next}`;
  }
  lastTranslationPartial = next;
  renderTranslation();
}

function commitFinal(kind, text) {
  const finalText = text.trim();
  if (!finalText) return;

  if (kind === "source") {
    if (finalText === lastSourceFinal || alreadyHasFinal(sourceHistory, finalText)) {
      sourceDraft = "";
      lastSourcePartial = "";
      renderSource();
      return;
    }

    const suffix = stripKnownSourcePrefix(finalText);
    const finalSegment = suffix || finalText;
    if (!alreadyHasFinal(sourceHistory, finalSegment)) sourceHistory.push(finalSegment);

    lastSourceFinal = finalSegment;
    sourceDraft = "";
    lastSourcePartial = "";
    renderSource();
    return;
  }

  if (finalText === lastTranslationFinal) return;
  if (alreadyHasFinal(translationHistory, finalText)) {
    translationDraft = "";
    lastTranslationPartial = "";
    renderTranslation();
    return;
  }

  const suffix = stripKnownTranslationPrefix(finalText);
  const finalSegment = suffix || finalText;
  if (!alreadyHasFinal(translationHistory, finalSegment)) translationHistory.push(finalSegment);

  lastTranslationFinal = finalSegment;
  translationDraft = "";
  lastTranslationPartial = "";
  renderTranslation();
}

function resetTextState(sourceMessage = "Source transcript will appear here.", translationMessage = "Translation will appear here.") {
  sourceHistory = [];
  sourceDraft = "";
  lastSourceFinal = "";
  lastSourcePartial = "";
  translationHistory = [];
  translationDraft = "";
  lastTranslationFinal = "";
  lastTranslationPartial = "";
  sourceText.textContent = sourceMessage;
  translationText.textContent = translationMessage;
  sourceText.classList.add("placeholder");
  translationText.classList.add("placeholder");
}

function base64ToBytes(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pcm16ToFloat32(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const samples = new Float32Array(bytes.byteLength / 2);
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return samples;
}

function resetPlayback() {
  if (playbackContext) playbackContext.close();
  playbackContext = null;
  nextPlaybackTime = 0;
}

function resetAudioRecord() {
  translatedAudioChunks = [];
  translatedAudioSampleRate = OUTPUT_SAMPLE_RATE;
  sessionStartedAt = Date.now();
  if (translatedAudioUrl) URL.revokeObjectURL(translatedAudioUrl);
  translatedAudioUrl = "";
  if (audioRecordPlayer) {
    audioRecordPlayer.removeAttribute("src");
    audioRecordPlayer.load();
  }
  if (audioRecord) audioRecord.hidden = true;
  if (audioRecordDetails) audioRecordDetails.textContent = "Available after Stop";
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}

function createWavBlob(chunks, sampleRate) {
  const dataLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  const bytes = new Uint8Array(buffer);
  let offset = 44;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function finalizeAudioRecord() {
  if (!translatedAudioChunks.length || !audioRecord || !audioRecordPlayer) return;
  if (translatedAudioUrl) URL.revokeObjectURL(translatedAudioUrl);
  translatedAudioUrl = URL.createObjectURL(
    createWavBlob(translatedAudioChunks, translatedAudioSampleRate),
  );
  audioRecordPlayer.src = translatedAudioUrl;
  const seconds = Math.round(
    translatedAudioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0) /
      (translatedAudioSampleRate * 2),
  );
  const elapsed = sessionStartedAt ? Math.max(0, Math.round((Date.now() - sessionStartedAt) / 1000)) : 0;
  if (audioRecordDetails) {
    audioRecordDetails.textContent = `${translatedAudioSampleRate / 1000} kHz PCM · ${seconds}s audio · ${elapsed}s session`;
  }
  audioRecord.hidden = false;
}

function stopCameraFrames() {
  if (cameraFrameTimer) window.clearInterval(cameraFrameTimer);
  cameraFrameTimer = null;
}

function captureCameraFrame() {
  if (
    activeMode !== "camera" ||
    !visualContextEnabledInput.checked ||
    !socket ||
    socket.readyState !== WebSocket.OPEN ||
    !cameraPreview.videoWidth ||
    !cameraPreview.videoHeight
  ) {
    return;
  }

  if (!cameraCanvas) cameraCanvas = document.createElement("canvas");
  const ratio = cameraPreview.videoHeight / cameraPreview.videoWidth;
  cameraCanvas.width = CAMERA_FRAME_WIDTH;
  cameraCanvas.height = Math.round(CAMERA_FRAME_WIDTH * ratio);
  const context = cameraCanvas.getContext("2d");
  context.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
  const image = cameraCanvas.toDataURL("image/jpeg", 0.72).split(",")[1];
  socket.send(JSON.stringify({ type: "image_frame", image }));
  imageFramesSent += 1;
  renderMetrics();
}

function startCameraFrames() {
  stopCameraFrames();
  if (activeMode !== "camera" || !visualContextEnabledInput.checked) return;
  const fps = Math.max(1, Math.min(2, Number(frameRateSelect.value) || 1));
  cameraFrameTimer = window.setInterval(captureCameraFrame, 1000 / fps);
  captureCameraFrame();
}

async function playPcm(base64Audio, sampleRate = OUTPUT_SAMPLE_RATE) {
  translatedAudioSampleRate = sampleRate;
  translatedAudioChunks.push(base64ToBytes(base64Audio));
  if (!audioEnabledInput.checked) return;
  if (!playbackContext) {
    playbackContext = new AudioContext({ sampleRate });
    nextPlaybackTime = playbackContext.currentTime;
  }
  if (playbackContext.state === "suspended") await playbackContext.resume();

  const samples = pcm16ToFloat32(base64ToBytes(base64Audio));
  const buffer = playbackContext.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);
  const source = playbackContext.createBufferSource();
  source.buffer = buffer;
  source.connect(playbackContext.destination);
  const startAt = Math.max(playbackContext.currentTime + 0.02, nextPlaybackTime);
  source.start(startAt);
  nextPlaybackTime = startAt + buffer.duration;
}

function downsample(input, inputRate) {
  if (inputRate === INPUT_SAMPLE_RATE) return input;
  const ratio = inputRate / INPUT_SAMPLE_RATE;
  const length = Math.floor(input.length / ratio);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += input[j];
    output[i] = sum / Math.max(1, end - start);
  }
  return output;
}

function floatToPcm16(samples) {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return buffer;
}

function updateLevel(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  levelBar.style.width = `${Math.min(100, Math.round(Math.sqrt(sum / samples.length) * 360))}%`;
}

function flushFrames() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  while (pendingSamples.length >= FRAME_SAMPLES) {
    const frame = pendingSamples.slice(0, FRAME_SAMPLES);
    pendingSamples = pendingSamples.slice(FRAME_SAMPLES);
    socket.send(floatToPcm16(frame));
  }
}

async function startCapture() {
  const cameraMode = activeMode === "camera";
  const video =
    cameraMode && cameraDeviceSelect.value
      ? { deviceId: { exact: cameraDeviceSelect.value } }
      : cameraMode;

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video,
  });

  if (cameraMode) {
    cameraPreview.srcObject = mediaStream;
    await cameraPreview.play();
    populateCameraDevices().catch(() => {});
    startCameraFrames();
  }

  captureContext = new AudioContext();
  sourceNode = captureContext.createMediaStreamSource(mediaStream);
  processorNode = captureContext.createScriptProcessor(4096, 1, 1);
  processorNode.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    const resampled = downsample(input, captureContext.sampleRate);
    updateLevel(resampled);
    pendingSamples.push(...resampled);
    flushFrames();
  };
  sourceNode.connect(processorNode);
  processorNode.connect(captureContext.destination);
}

function stopCapture() {
  stopCameraFrames();
  if (processorNode) processorNode.disconnect();
  if (sourceNode) sourceNode.disconnect();
  if (captureContext) captureContext.close();
  if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
  cameraPreview.srcObject = null;
  processorNode = null;
  sourceNode = null;
  captureContext = null;
  mediaStream = null;
  pendingSamples = [];
  levelBar.style.width = "0%";
}

function handleServerMessage(event) {
  const data = JSON.parse(event.data);

  if (data.type === "server_ready") {
    setStatus("Listening", "active");
    captureRequestId(data.request_id);
    lastTraceId = String(data.trace_id || "").trim();
    const contextLabel = data.input_mode === "camera" && data.visual_context ? " · visual context" : "";
    const voiceLabel =
      data.audio_enabled && data.voice_config_enabled
        ? ` · voice ${data.voice_clone_mode === "off" ? data.voice : `clone ${data.voice_clone_mode}`}`
        : data.audio_enabled
          ? " · default voice"
          : " · text only";
    sessionInfoText = data.audio_enabled
      ? `${data.source_language} -> ${data.target_language}${contextLabel}${voiceLabel}`
      : `${data.source_language} -> ${data.target_language}${contextLabel}${voiceLabel}`;
    renderMetrics();
    return;
  }

  if (data.type === "model_audio") {
    playPcm(data.audio, data.sample_rate).catch((error) => {
      setStatus("Audio failed", "error");
      sessionInfoText = error.message;
      renderMetrics();
    });
    return;
  }

  if (data.type === "image_frame_ack") {
    imageFramesForwarded = Math.max(imageFramesForwarded, Number(data.count || 0));
    renderMetrics();
    return;
  }

  if (data.type === "server_error" || data.type === "config_error") {
    setStatus("Error", "error");
    sessionInfoText = data.message || "Error";
    renderMetrics();
    return;
  }

  if (data.type !== "model_event") return;
  captureRequestId(data.request_id);
  if (data.status === "connected") setStatus("Connected", "active");
  if (data.status === "translating") setStatus("Translating", "warn");
  if (data.status === "listening") setStatus("Listening", "active");
  if (data.response_started) {
    translationDraft = "";
    lastTranslationPartial = "";
    renderTranslation();
  }
  if (data.response_done) {
    if (translationDraft) commitFinal("translation", translationDraft);
  }
  if (data.source_partial) updateDraft("source", data.source_partial);
  if (data.source_final) commitFinal("source", data.source_final);
  if (data.translation_partial) updateDraft("translation", data.translation_partial);
  if (data.translation_final) commitFinal("translation", data.translation_final);
  if (data.usage) addUsage(data.usage);
  if (data.event_type === "error") {
    setStatus("Model error", "error");
    sessionInfoText = data.message || "Model error";
    renderMetrics();
  }
}

async function start() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    setStatus("API key required", "error");
    apiKeyInput.focus();
    return;
  }
  localStorage.setItem("dashscope_api_key", apiKey);
  resetSessionUsage();
  resetAudioRecord();
  resetTextState(
    activeMode === "camera" ? "Waiting for camera and microphone permission..." : "Waiting for microphone permission...",
    "Waiting for translation...",
  );
  setStatus("Starting", "warn");
  startButton.disabled = true;
  stopButton.disabled = false;

  socket = new WebSocket(`ws://${window.location.host}/ws/livetranslate`);
  socket.binaryType = "arraybuffer";
  socket.addEventListener("message", handleServerMessage);
  socket.addEventListener("close", () => {
    stopCapture();
    resetPlayback();
    finalizeAudioRecord();
    socket = null;
    setStatus("Stopped");
    startButton.disabled = false;
    stopButton.disabled = true;
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.send(
    JSON.stringify({
      type: "config",
      api_key: apiKey,
      region: regionSelect.value,
      source_language: sourceLanguageSelect.value,
      target_language: targetLanguageSelect.value,
      audio_enabled: audioEnabledInput.checked,
      voice: voiceSelect.value,
      voice_clone_mode: voiceCloneModeSelect.value,
      input_mode: activeMode,
      visual_context: activeMode === "camera" && visualContextEnabledInput.checked,
      source_config_enabled: isSourceConfigHeaderEnabled(),
      minimal_session: isMinimalSessionEnabled(),
      voice_config_enabled: isVoiceConfigEnabled(),
      voice_clone_config_enabled: isVoiceCloneConfigEnabled(),
    }),
  );
  await startCapture();
  renderSource();
  renderTranslation();
}

function stop() {
  stopButton.disabled = true;
  setStatus("Stopping", "warn");
  stopCapture();
  resetPlayback();
  if (socket && socket.readyState === WebSocket.OPEN) socket.send("stop");
  if (socket) socket.close();
}

startButton.addEventListener("click", () => {
  start().catch((error) => {
    setStatus("Start failed", "error");
    sessionInfoText = error.message;
    renderMetrics();
    stopCapture();
    resetPlayback();
    startButton.disabled = false;
    stopButton.disabled = true;
    if (socket) socket.close();
  });
});
stopButton.addEventListener("click", stop);
clearButton.addEventListener("click", () => {
  resetTextState("Source transcript cleared.", "Translation cleared.");
  resetSessionUsage();
  resetAudioRecord();
  resetPlayback();
  renderCameraSubtitle();
});
forgetKeyButton.addEventListener("click", () => {
  localStorage.removeItem("dashscope_api_key");
  apiKeyInput.value = "";
  apiKeyInput.focus();
  setStatus("Key cleared");
  sessionInfoText = "API key cleared.";
  renderMetrics();
});
apiKeyHelpButton.addEventListener("click", () => {
  const url = API_KEY_URLS[regionSelect.value] || API_KEY_URLS.mainland;
  window.open(url, "_blank", "noopener,noreferrer");
});
targetLanguageSelect.addEventListener("change", syncVoiceControls);
audioEnabledInput.addEventListener("change", syncVoiceControls);
voiceSelect.addEventListener("change", syncVoiceControls);
voiceCloneModeSelect.addEventListener("change", syncVoiceControls);
micTab.addEventListener("click", () => setMode("mic"));
cameraTab.addEventListener("click", () => setMode("camera"));
visualContextEnabledInput.addEventListener("change", () => {
  if (socket && activeMode === "camera") startCameraFrames();
});
frameRateSelect.addEventListener("change", () => {
  if (socket && activeMode === "camera") startCameraFrames();
});

populateControls();
setMode("mic");
syncVoiceControls();
renderMetrics();
