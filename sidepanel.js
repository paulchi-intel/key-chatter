// sidepanel.js - Key Chatter single-panel chat UI

const STORAGE_KEYS = {
  selectedApiKey: "selectedApiKey",
  selectedModel: "selectedModel",
  language: "language",
  messages: "messages",
  pageContent: "pageContent",
  savedPrompts: "savedPrompts",
  panelMode: "panelMode"
};

const DEFAULT_MODEL = "gpt-4.1-mini";
const RUNTIME_MESSAGE_TIMEOUT_MS = 30000;
const ALLOWED_ANTHROPIC_MODEL_PREFIXES = [];

const TRANSLATIONS = {
  "zh-TW": {
    clear: "清除",
    "load-page": "載入網頁",
    "load-clipboard": "載入剪貼簿",
    "status-ready": "準備就緒",
    "status-loading-page": "載入網頁中...",
    "status-loading-clipboard": "載入剪貼簿中...",
    "status-page-loaded": "網頁已載入",
    "status-clipboard-loaded": "剪貼簿已載入",
    "status-loading-models": "載入模型中...",
    "status-models-loaded": "已載入 {count} 個模型",
    "status-sending": "發送中...",
    "status-error": "發生錯誤",
    send: "發送",
    "empty-title": "開始對話",
    "empty-text": "可以直接開始對話，或是點擊「載入網頁」或「載入剪貼簿」來載入內容後提問。",
    "input-placeholder": "輸入您的問題...",
    "system-page-loaded": "已載入網頁內容",
    "system-clipboard-loaded": "已載入剪貼簿內容",
    "quick-question-title": "快速提問",
    "template-concise": "簡潔摘要",
    "template-engineering": "工程摘要",
    "template-questions": "建議 3 個深入問題",
    "saved-prompts": "常用提示詞",
    "saved-prompts-title": "常用提示詞管理",
    "manage-prompts": "管理",
    "add-prompt": "新增提示詞",
    "empty-prompts": "還沒有常用提示詞，請在下方新增",
    "empty-saved-prompts": "點擊「管理」來新增常用提示詞",
    "new-prompt-placeholder": "輸入新的常用提示詞...",
    "error-api-key-prefix": "API key 格式無效，請輸入 pak_ 開頭（ExpertGPT）或 GNAI Key",
    "error-no-tab": "找不到當前分頁",
    "error-load-page": "載入網頁失敗：",
    "error-load-clipboard": "載入剪貼簿失敗：",
    "error-clipboard-empty": "剪貼簿是空的",
    "error-empty-message": "請輸入問題",
    "error-send": "發送失敗：",
    "error-model-restricted": "此模型目前受限，請改用可用模型（例如 claude-haiku-4-5）。",
    "error-load-models": "載入模型失敗：",
    "error-init": "初始化失敗：",
    "lang-set": "語言已切換：{lang}",
    "apikey-modal-title": "設定 API Key",
    "apikey-modal-hint": "請輸入 API Key（ExpertGPT 以 pak_ 開頭，或直接輸入 GNAI Key）",
    "apikey-cancel": "取消",
    "apikey-confirm": "確認",
    "apikey-updated": "API key 已更新",
    "apikey-required": "請先設定 API key",
    "model-restricted-tag": "受限",
    "panel-mode-to-popup": "切換至彈窗",
    "panel-mode-to-sidepanel": "切換至側欄",
    "panel-mode-switched-popup": "已切換至彈窗模式，下次點擊圖示將開啟彈窗",
    "panel-mode-switched-sidepanel": "已切換至側欄模式",
    "save-session": "💾 儲存對話",
    "status-session-saved": "對話已儲存",
    "status-session-empty": "沒有對話可儲存",
    "confirm-save-before-clear": "對話尚未儲存，是否要先儲存？",
    "system-youtube-transcript-loaded": "已載入 YouTube 字幕",
    "status-youtube-transcript-loaded": "YouTube 字幕已載入",
    "status-youtube-no-transcript": "此影片未提供字幕，已改載入頁面文字",
    "transcript-show": "▶ 顯示字幕",
    "transcript-hide": "▼ 隱藏字幕",
    "dialog-yes": "是",
    "dialog-no": "否",
    "dialog-cancel": "取消",
    "clipboard-tab-label": "剪貼簿內容",
    "empty-tab-label": "empty"
  },
  "zh-CN": {
    clear: "清除",
    "load-page": "载入网页",
    "load-clipboard": "载入剪贴板",
    "status-ready": "准备就绪",
    "status-loading-page": "载入网页中...",
    "status-loading-clipboard": "载入剪贴板中...",
    "status-page-loaded": "网页已载入",
    "status-clipboard-loaded": "剪贴板已载入",
    "status-loading-models": "载入模型中...",
    "status-models-loaded": "已载入 {count} 个模型",
    "status-sending": "发送中...",
    "status-error": "发生错误",
    send: "发送",
    "empty-title": "开始对话",
    "empty-text": "可以直接开始对话，或是点击「载入网页」或「载入剪贴板」来载入内容后提问。",
    "input-placeholder": "输入您的问题...",
    "system-page-loaded": "已载入网页内容",
    "system-clipboard-loaded": "已载入剪贴板内容",
    "quick-question-title": "快速提问",
    "template-concise": "简洁摘要",
    "template-engineering": "工程摘要",
    "template-questions": "建议 3 个深入问题",
    "saved-prompts": "常用提示词",
    "saved-prompts-title": "常用提示词管理",
    "manage-prompts": "管理",
    "add-prompt": "新增提示词",
    "empty-prompts": "还没有常用提示词，请在下方新增",
    "empty-saved-prompts": "点击「管理」来新增常用提示词",
    "new-prompt-placeholder": "输入新的常用提示词...",
    "error-api-key-prefix": "API key 格式无效，请输入 pak_ 开头（ExpertGPT）或 GNAI Key",
    "error-no-tab": "找不到当前标签页",
    "error-load-page": "载入网页失败：",
    "error-load-clipboard": "载入剪贴板失败：",
    "error-clipboard-empty": "剪贴板是空的",
    "error-empty-message": "请输入问题",
    "error-send": "发送失败：",
    "error-model-restricted": "此模型目前受限，请改用可用模型（例如 claude-haiku-4-5）。",
    "error-load-models": "载入模型失败：",
    "error-init": "初始化失败：",
    "lang-set": "语言已切换：{lang}",
    "apikey-modal-title": "设置 API Key",
    "apikey-modal-hint": "请输入 API Key（ExpertGPT 以 pak_ 开头，或直接输入 GNAI Key）",
    "apikey-cancel": "取消",
    "apikey-confirm": "确认",
    "apikey-updated": "API key 已更新",
    "apikey-required": "请先设置 API key",
    "model-restricted-tag": "受限",
    "panel-mode-to-popup": "切换至弹窗",
    "panel-mode-to-sidepanel": "切换至侧栏",
    "panel-mode-switched-popup": "已切换至弹窗模式，下次点击图标将开启弹窗",
    "panel-mode-switched-sidepanel": "已切换至侧栏模式",
    "save-session": "💾 储存对话",
    "status-session-saved": "对话已保存",
    "status-session-empty": "没有对话可储存",
    "confirm-save-before-clear": "对话尚未保存，是否要先保存？",
    "system-youtube-transcript-loaded": "已载入 YouTube 字幕",
    "status-youtube-transcript-loaded": "YouTube 字幕已载入",
    "status-youtube-no-transcript": "此影片未提供字幕，已改载入页面文字",
    "transcript-show": "▶ 显示字幕",
    "transcript-hide": "▼ 隐藏字幕",
    "dialog-yes": "是",
    "dialog-no": "否",
    "dialog-cancel": "取消",
    "clipboard-tab-label": "剪贴板内容",
    "empty-tab-label": "empty"
  },
  en: {
    clear: "Clear",
    "load-page": "Load Page",
    "load-clipboard": "Load Clipboard",
    "status-ready": "Ready",
    "status-loading-page": "Loading page...",
    "status-loading-clipboard": "Loading clipboard...",
    "status-page-loaded": "Page loaded",
    "status-clipboard-loaded": "Clipboard loaded",
    "status-loading-models": "Loading models...",
    "status-models-loaded": "Loaded {count} models",
    "status-sending": "Sending...",
    "status-error": "Error occurred",
    send: "Send",
    "empty-title": "Start Conversation",
    "empty-text": "You can start chatting directly, or click \"Load Page\" or \"Load Clipboard\" to load content first.",
    "input-placeholder": "Type your question...",
    "system-page-loaded": "Page content loaded",
    "system-clipboard-loaded": "Clipboard content loaded",
    "quick-question-title": "Quick Questions",
    "template-concise": "Concise Summary",
    "template-engineering": "Engineering Summary",
    "template-questions": "Suggest 3 Deep-Dive Questions",
    "saved-prompts": "Saved Prompts",
    "saved-prompts-title": "Saved Prompts Manager",
    "manage-prompts": "Manage",
    "add-prompt": "Add Prompt",
    "empty-prompts": "No saved prompts yet, add one below",
    "empty-saved-prompts": "Click \"Manage\" to add saved prompts",
    "new-prompt-placeholder": "Enter new prompt...",
    "error-api-key-prefix": "Invalid API key. Enter pak_ key (ExpertGPT) or a GNAI key",
    "error-no-tab": "Cannot find current tab",
    "error-load-page": "Failed to load page: ",
    "error-load-clipboard": "Failed to load clipboard: ",
    "error-clipboard-empty": "Clipboard is empty",
    "error-empty-message": "Please enter a message",
    "error-send": "Failed to send: ",
    "error-model-restricted": "This model is currently restricted. Please select an available model (for example, claude-haiku-4-5).",
    "error-load-models": "Failed to load models: ",
    "error-init": "Initialization failed: ",
    "lang-set": "Language set: {lang}",
    "apikey-modal-title": "Set API Key",
    "apikey-modal-hint": "Enter pak_ key (ExpertGPT) or a GNAI key",
    "apikey-cancel": "Cancel",
    "apikey-confirm": "Confirm",
    "apikey-updated": "API key updated",
    "apikey-required": "Please set your API key first",
    "model-restricted-tag": "Restricted",
    "panel-mode-to-popup": "Switch to Popup",
    "panel-mode-to-sidepanel": "Switch to Side Panel",
    "panel-mode-switched-popup": "Switched to popup mode. Next click on the icon will open a popup.",
    "panel-mode-switched-sidepanel": "Switched to side panel mode.",
    "save-session": "💾 Save Session",
    "status-session-saved": "Session saved",
    "status-session-empty": "No conversation to save",
    "confirm-save-before-clear": "Session not saved. Save before clearing?",
    "system-youtube-transcript-loaded": "YouTube transcript loaded",
    "status-youtube-transcript-loaded": "YouTube transcript loaded",
    "status-youtube-no-transcript": "No transcript available; loaded page text instead",
    "transcript-show": "▶ Show Transcript",
    "transcript-hide": "▼ Hide Transcript",
    "dialog-yes": "Yes",
    "dialog-no": "No",
    "dialog-cancel": "Cancel",
    "clipboard-tab-label": "Clipboard",
    "empty-tab-label": "empty"
  }
};

const UI = {
  headerTitle: document.getElementById("headerTitle"),
  panelModeBtn: document.getElementById("panelModeBtn"),
  clearBtn: document.getElementById("clearBtn"),
  saveSessionBtn: document.getElementById("saveSessionBtn"),
  loadPageBtn: document.getElementById("loadPageBtn"),
  loadClipboardBtn: document.getElementById("loadClipboardBtn"),
  languageSelect: document.getElementById("languageSelect"),
  statusIndicator: document.getElementById("statusIndicator"),
  statusText: document.getElementById("statusText"),
  messagesContainer: document.getElementById("messagesContainer"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  modelSelect: document.getElementById("modelSelect"),
  savedPromptsModal: document.getElementById("savedPromptsModal"),
  savedPromptsList: document.getElementById("savedPromptsList"),
  closeSavedPromptsModal: document.getElementById("closeSavedPromptsModal"),
  newPromptInput: document.getElementById("newPromptInput"),
  addPromptBtn: document.getElementById("addPromptBtn"),
  apiKeyModal: document.getElementById("apiKeyModal"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  apiKeyConfirmBtn: document.getElementById("apiKeyConfirmBtn"),
  apiKeyCancelBtn: document.getElementById("apiKeyCancelBtn"),
  closeApiKeyModal: document.getElementById("closeApiKeyModal"),
  confirmSaveModal: document.getElementById("confirmSaveModal"),
  confirmSaveYesBtn: document.getElementById("confirmSaveYesBtn"),
  confirmSaveNoBtn: document.getElementById("confirmSaveNoBtn"),
  confirmSaveCancelBtn: document.getElementById("confirmSaveCancelBtn")
};

// When running as a popup window, background embeds the source browser windowId
// in the URL (?srcWindowId=N) so we can call sidePanel.open() synchronously
// inside the user-gesture handler (before any await breaks the gesture context).
const POPUP_SRC_WINDOW_ID = (() => {
  const id = parseInt(new URLSearchParams(window.location.search).get("srcWindowId"), 10);
  return isNaN(id) ? null : id;
})();

let tabs = [
  { id: 0, messages: [], pageContent: null, selectedModel: DEFAULT_MODEL, sessionSaved: false }
];

let state = {
  currentLanguage: "zh-TW",
  selectedApiKey: "",
  selectedModel: DEFAULT_MODEL,
  openaiModels: [],
  anthropicModels: [],
  models: [],
  modelQuotas: {},
  messages: [],
  pageContent: null,
  savedPrompts: [],
  panelMode: "sidepanel",
  sessionSaved: false,
  activeTabId: 0,
  nextTabId: 1,
};

function t(key, params = {}) {
  let text = TRANSLATIONS[state.currentLanguage]?.[key] || key;
  Object.keys(params).forEach((paramKey) => {
    text = text.replace(`{${paramKey}}`, params[paramKey]);
  });
  return text;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(md) {
  let html = md || "";

  // 1. Fenced code blocks — escape HTML inside so code shows as-is
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre><code>${esc}</code></pre>`;
  });

  // 2. Inline code — escape HTML inside
  html = html.replace(/`([^`]+)`/g, (_m, code) => {
    const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<code>${esc}</code>`;
  });

  // 3. Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  // 4. Headings (# treated same as ##)
  html = html.replace(/^#{1,2} (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");

  // 5. Ordered list items (mark with attribute to distinguish from ul)
  html = html.replace(/^\d+\. (.+)$/gm, "<li data-ol>$1</li>");

  // 6. Unordered list items
  html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");

  // Group consecutive ordered-list items
  html = html.replace(/(<li data-ol>[\s\S]*?<\/li>\n*)+/g,
    (m) => `<ol>${m.replace(/ data-ol/g, "")}</ol>`);

  // Group consecutive unordered-list items
  html = html.replace(/(<li>[\s\S]*?<\/li>\n*)+/g, (m) => `<ul>${m}</ul>`);

  // 7. Tables
  html = html.replace(/((?:^\|[^\n]*(?:\n|$))+)/gm, (block) => {
    const lines = block.trim().split("\n").filter((l) => l.trim().startsWith("|"));
    if (lines.length < 3) return block;
    const isSep = (l) => /^\|[\s\-:|]+\|/.test(l.trim());
    if (!isSep(lines[1])) return block;
    const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const headers = cells(lines[0]);
    const rows = lines.slice(2).filter((l) => l.trim()).map(cells);
    let tbl = '<div class="table-wrapper"><table><thead><tr>';
    headers.forEach((h) => { tbl += `<th>${h}</th>`; });
    tbl += "</tr></thead><tbody>";
    rows.forEach((r) => {
      tbl += "<tr>";
      r.forEach((c) => { tbl += `<td>${c}</td>`; });
      tbl += "</tr>";
    });
    tbl += "</tbody></table></div>";
    return tbl;
  });

  // 8. Collapse all newlines → single <br>, no paragraph structure
  html = html.replace(/\n+/g, "\n");
  html = html.replace(/\n/g, "<br>");
  // Remove <br> directly adjacent to block elements (they space themselves via CSS margin)
  html = html.replace(/(<br>)+(<\/?(h[23]|li|[uo]l|pre|div)[^>]*>)/gi, "$2");
  html = html.replace(/(<\/?(h[23]|li|[uo]l|pre|div)[^>]*>)(<br>)+/gi, "$1");

  return html;
}

function updateUILanguage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (!key) return;
    const text = t(key);

    if (key === "empty-text") {
      element.innerHTML = text.replace(/\n/g, "<br>");
      return;
    }

    if (element.tagName === "PRE") {
      element.textContent = text;
      return;
    }

    element.textContent = text;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    if (!key) return;
    element.placeholder = t(key);
  });

  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const key = element.getAttribute("data-i18n-title");
    if (!key) return;
    element.title = t(key);
  });

  UI.languageSelect.value = state.currentLanguage;
  updatePanelModeBtn();
}

function setStatus(type, text) {
  UI.statusIndicator.className = `status-indicator ${type}`;
  UI.statusText.textContent = text;
}

async function sendRuntimeMessage(payload) {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({ ok: false, error: `Request timeout after ${RUNTIME_MESSAGE_TIMEOUT_MS}ms` });
    }, RUNTIME_MESSAGE_TIMEOUT_MS);

    chrome.runtime.sendMessage(payload, (response) => {
      clearTimeout(timeoutId);

      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message || "Runtime message failed" });
        return;
      }

      resolve(response || { ok: false, error: "No response from background" });
    });
  });
}

function isValidApiKey(key) {
  if (typeof key !== "string" || !key.trim()) return false;
  if (key.startsWith("pak_")) return key.length > 8;
  return key.length > 0;
}

function isGnaiKey(key) {
  return typeof key === "string" && key.length > 0 && !key.startsWith("pak_");
}

async function setSingleApiKey(key) {
  state.selectedApiKey = key;
  await saveState();
}

function promptForApiKey(force = false) {
  return new Promise((resolve) => {
    UI.apiKeyInput.value = state.selectedApiKey || "";
    UI.apiKeyModal.classList.add("show");
    UI.apiKeyInput.focus();
    UI.apiKeyInput.select();

    function cleanup() {
      UI.apiKeyModal.classList.remove("show");
      UI.apiKeyConfirmBtn.removeEventListener("click", onConfirm);
      UI.apiKeyCancelBtn.removeEventListener("click", onCancel);
      UI.closeApiKeyModal.removeEventListener("click", onCancel);
      UI.apiKeyModal.removeEventListener("click", onBackdrop);
      UI.apiKeyInput.removeEventListener("keydown", onKeydown);
    }

    function onConfirm() {
      const key = UI.apiKeyInput.value.trim();
      if (!isValidApiKey(key)) {
        setStatus("error", t("error-api-key-prefix"));
        cleanup();
        resolve(false);
        return;
      }
      cleanup();
      setSingleApiKey(key).then(() => {
        setStatus("ready", t("apikey-updated"));
        resolve(true);
      });
    }

    function onCancel() {
      cleanup();
      if (force && !state.selectedApiKey) {
        setStatus("error", t("apikey-required"));
      }
      resolve(false);
    }

    function onBackdrop(e) {
      if (e.target === UI.apiKeyModal) onCancel();
    }

    function onKeydown(e) {
      if (e.key === "Enter") onConfirm();
      else if (e.key === "Escape") onCancel();
    }

    UI.apiKeyConfirmBtn.addEventListener("click", onConfirm);
    UI.apiKeyCancelBtn.addEventListener("click", onCancel);
    UI.closeApiKeyModal.addEventListener("click", onCancel);
    UI.apiKeyModal.addEventListener("click", onBackdrop);
    UI.apiKeyInput.addEventListener("keydown", onKeydown);
  });
}

function showConfirmSaveDialog() {
  return new Promise((resolve) => {
    UI.confirmSaveModal.classList.add("show");

    function cleanup() {
      UI.confirmSaveModal.classList.remove("show");
      UI.confirmSaveYesBtn.removeEventListener("click", onYes);
      UI.confirmSaveNoBtn.removeEventListener("click", onNo);
      UI.confirmSaveCancelBtn.removeEventListener("click", onCancel);
      UI.confirmSaveModal.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onKeydown);
    }

    function onYes() { cleanup(); resolve("yes"); }
    function onNo() { cleanup(); resolve("no"); }
    function onCancel() { cleanup(); resolve("cancel"); }
    function onBackdrop(e) { if (e.target === UI.confirmSaveModal) onCancel(); }
    function onKeydown(e) { if (e.key === "Escape") onCancel(); }

    UI.confirmSaveYesBtn.addEventListener("click", onYes);
    UI.confirmSaveNoBtn.addEventListener("click", onNo);
    UI.confirmSaveCancelBtn.addEventListener("click", onCancel);
    UI.confirmSaveModal.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKeydown);
  });
}

async function ensureApiKey(forcePrompt = false) {
  if (isValidApiKey(state.selectedApiKey)) {
    return true;
  }

  if (!forcePrompt) {
    setStatus("error", t("apikey-required"));
    return false;
  }

  return promptForApiKey(true);
}

function _appendTranscriptToggle(node, transcript) {
  const toggle = document.createElement("div");
  toggle.className = "transcript-toggle";
  toggle.textContent = t("transcript-show");
  const panel = document.createElement("div");
  panel.className = "transcript-panel";
  panel.textContent = transcript;
  toggle.addEventListener("click", () => {
    const visible = panel.classList.toggle("visible");
    toggle.textContent = t(visible ? "transcript-hide" : "transcript-show");
  });
  node.appendChild(toggle);
  node.appendChild(panel);
}

async function navigateToUrl(url) {
  try {
    const found = await chrome.tabs.query({ url });
    if (found.length > 0) {
      await chrome.tabs.update(found[0].id, { active: true });
      await chrome.windows.update(found[0].windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url });
    }
  } catch (e) {
    console.error("[KC] navigateToUrl error:", e);
  }
}

function _setPageUrl(element, url) {
  element.textContent = "";
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = url;
    a.addEventListener("click", (e) => { e.preventDefault(); navigateToUrl(url); });
    element.appendChild(a);
  } else {
    element.textContent = url || "";
  }
}

function showPageInfo(title, url, transcript = null) {
  let node = UI.messagesContainer.querySelector(".page-info");
  if (node) {
    node.querySelector(".page-title").textContent = title || "";
    _setPageUrl(node.querySelector(".page-url"), url);
    const oldToggle = node.querySelector(".transcript-toggle");
    const oldPanel  = node.querySelector(".transcript-panel");
    if (oldToggle) oldToggle.remove();
    if (oldPanel)  oldPanel.remove();
    if (transcript) _appendTranscriptToggle(node, transcript);
    return;
  }
  node = document.createElement("div");
  node.className = "page-info";
  node.innerHTML = "<div class=\"page-title\"></div><div class=\"page-url\"></div>";
  node.querySelector(".page-title").textContent = title || "";
  _setPageUrl(node.querySelector(".page-url"), url);
  if (transcript) _appendTranscriptToggle(node, transcript);
  UI.messagesContainer.prepend(node);
}

function hidePageInfo() {
  const node = UI.messagesContainer.querySelector(".page-info");
  if (node) node.remove();
}

function renderEmptyState() {
  UI.messagesContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">💭</div>
      <div class="empty-state-title" data-i18n="empty-title">${t("empty-title")}</div>
      <div class="empty-state-text" data-i18n="empty-text">${t("empty-text").replace(/\n/g, "<br>")}</div>
    </div>
  `;
}

function addMessage(role, content) {
  const emptyState = UI.messagesContainer.querySelector(".empty-state");
  if (emptyState) {
    emptyState.remove();
  }

  const node = document.createElement("div");
  node.className = `message ${role}`;

  if (role === "assistant") {
    node.innerHTML = renderMarkdown(content || "");
  } else {
    node.textContent = content || "";
  }

  UI.messagesContainer.appendChild(node);
  UI.messagesContainer.scrollTop = UI.messagesContainer.scrollHeight;
}

function addSystemMessage(content) {
  const emptyState = UI.messagesContainer.querySelector(".empty-state");
  if (emptyState) {
    emptyState.remove();
  }

  const node = document.createElement("div");
  node.className = "message system";
  node.textContent = content;
  UI.messagesContainer.appendChild(node);
  UI.messagesContainer.scrollTop = UI.messagesContainer.scrollHeight;
}

function renderMessages() {
  UI.messagesContainer.innerHTML = "";

  if (!state.messages.length) {
    if (state.pageContent) {
      // Content loaded but no conversation yet — restore system message + quick questions
      const sysKey = state.pageContent.url === "clipboard://" ? "system-clipboard-loaded" : "system-page-loaded";
      addSystemMessage(t(sysKey));
      showQuickQuestions();
    } else {
      renderEmptyState();
    }
    return;
  }

  state.messages.forEach((message) => {
    addMessage(message.role, message.content);
  });

  if (state.pageContent) {
    showQuickQuestions();
  }
}

function isAnthropicModelRestricted(model) {
  // All Anthropic models are now available
  return false;
}

function getSelectableModels() {
  return state.models.filter((model) => !isAnthropicModelRestricted(model));
}

function renderModelOptions() {
  UI.modelSelect.innerHTML = "";

  if (!state.models.length) {
    const option = document.createElement("option");
    option.value = DEFAULT_MODEL;
    option.textContent = `${DEFAULT_MODEL} (0/0)`;
    UI.modelSelect.appendChild(option);
    UI.modelSelect.value = DEFAULT_MODEL;
    return;
  }

  function appendModelGroup(models, label) {
    if (!models.length) return;

    const header = document.createElement("option");
    header.value = "";
    header.disabled = true;
    header.textContent = `--- ${label} ---`;
    UI.modelSelect.appendChild(header);

    const useGnai = isGnaiKey(state.selectedApiKey || "");
    models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model;
      const isRestricted = isAnthropicModelRestricted(model);
      option.disabled = isRestricted;
      if (useGnai) {
        option.textContent = isRestricted
          ? `${model} [${t("model-restricted-tag")}]`
          : model;
      } else {
        const quota = state.modelQuotas[model] || { used: 0, limit: 0 };
        option.textContent = isRestricted
          ? `${model} (${quota.used}/${quota.limit}) [${t("model-restricted-tag")}]`
          : `${model} (${quota.used}/${quota.limit})`;
      }
      UI.modelSelect.appendChild(option);
    });
  }

  appendModelGroup(state.openaiModels, "OpenAI");
  appendModelGroup(state.anthropicModels, "Anthropic");

  const selectableModels = getSelectableModels();

  if (!state.models.includes(state.selectedModel) || isAnthropicModelRestricted(state.selectedModel)) {
    state.selectedModel = selectableModels[0] || state.models[0];
  }

  UI.modelSelect.value = state.selectedModel;
}

function syncModelQuotasFromQuota(quota) {
  const modelQuotas = quota?.model_quotas || {};
  const mapped = {};

  Object.keys(modelQuotas).forEach((model) => {
    const info = modelQuotas[model] || {};
    mapped[model] = {
      used: Number(info.used ?? 0),
      limit: Number(info.limit ?? 0),
      remaining: Number(info.remaining ?? 0)
    };
  });

  state.modelQuotas = mapped;
  renderModelOptions();
}

async function fetchQuotaFromApi() {
  return sendRuntimeMessage({
    type: "GET_QUOTA",
    apiKey: state.selectedApiKey
  });
}

function incrementModelUsage(model) {
  if (!model) return;

  const current = state.modelQuotas[model] || { used: 0, limit: 0, remaining: 0 };
  const nextUsed = Number(current.used || 0) + 1;
  const nextLimit = Number(current.limit || 0);
  const nextRemaining = Math.max(nextLimit - nextUsed, 0);

  state.modelQuotas[model] = {
    ...current,
    used: nextUsed,
    remaining: nextRemaining
  };

  renderModelOptions();
}

async function saveState() {
  commitActiveTab();
  await chrome.storage.local.set({
    [STORAGE_KEYS.selectedApiKey]: state.selectedApiKey,
    [STORAGE_KEYS.language]: state.currentLanguage,
    [STORAGE_KEYS.savedPrompts]: state.savedPrompts,
    [STORAGE_KEYS.panelMode]: state.panelMode,
    kc_tabs: tabs,
    kc_active_tab_id: state.activeTabId,
    kc_next_tab_id: state.nextTabId,
  });
}

async function initializeState() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.selectedApiKey,
    STORAGE_KEYS.selectedModel,
    STORAGE_KEYS.language,
    STORAGE_KEYS.messages,
    STORAGE_KEYS.pageContent,
    STORAGE_KEYS.savedPrompts,
    STORAGE_KEYS.panelMode,
    "kc_tabs",
    "kc_active_tab_id",
    "kc_next_tab_id",
  ]);

  // Backward compatibility: migrate first valid key from legacy apiKeys[] storage.
  const keys = Array.isArray(stored.apiKeys) ? stored.apiKeys : [];
  const firstStoredKey = keys.find((key) => isValidApiKey(String(key)));
  const selectedKey = stored[STORAGE_KEYS.selectedApiKey];

  state.selectedApiKey = isValidApiKey(selectedKey) ? selectedKey : firstStoredKey || "";
  state.openaiModels = [];
  state.anthropicModels = [];
  state.currentLanguage = stored[STORAGE_KEYS.language] || "zh-TW";
  state.savedPrompts = Array.isArray(stored[STORAGE_KEYS.savedPrompts]) ? stored[STORAGE_KEYS.savedPrompts] : [];
  state.panelMode = stored[STORAGE_KEYS.panelMode] || "sidepanel";
  // URL param is ground truth: no srcWindowId means we're in the sidepanel, not a popup.
  if (POPUP_SRC_WINDOW_ID === null) {
    state.panelMode = "sidepanel";
  } else {
    state.panelMode = "popup";
  }

  // Load tabs or migrate from legacy flat storage
  if (Array.isArray(stored.kc_tabs) && stored.kc_tabs.length > 0) {
    tabs = stored.kc_tabs;
    state.activeTabId = stored.kc_active_tab_id ?? tabs[0].id;
    state.nextTabId   = stored.kc_next_tab_id   ?? tabs.length;
    if (!tabs.find(t => t.id === state.activeTabId)) state.activeTabId = tabs[0].id;
  } else {
    tabs = [{
      id: 0,
      messages:      Array.isArray(stored[STORAGE_KEYS.messages]) ? stored[STORAGE_KEYS.messages] : [],
      pageContent:   stored[STORAGE_KEYS.pageContent] || null,
      selectedModel: stored[STORAGE_KEYS.selectedModel] || DEFAULT_MODEL,
      sessionSaved:  false,
    }];
    state.activeTabId = 0;
    state.nextTabId   = 1;
  }

  // Load active tab into state
  const activeTab = tabs.find(t => t.id === state.activeTabId) || tabs[0];
  state.messages      = activeTab.messages;
  state.pageContent   = activeTab.pageContent;
  state.selectedModel = activeTab.selectedModel || DEFAULT_MODEL;
  state.sessionSaved  = activeTab.sessionSaved  || false;

  // Apply popup-mode CSS class
  if (state.panelMode === "popup") {
    document.body.classList.add("popup-mode");
  } else {
    document.body.classList.remove("popup-mode");
  }
  updatePanelModeBtn();

  renderModelOptions();
  renderTabBar();
  renderMessages();

  if (state.pageContent) {
    showPageInfo(
      state.pageContent.title,
      state.pageContent.url,
      state.pageContent.isYouTubeTranscript ? state.pageContent.text : null
    );
  }

  updateUILanguage();
  await saveState();
}

function updatePanelModeBtn() {
  if (!UI.panelModeBtn) return;
  if (state.panelMode === "popup") {
    UI.panelModeBtn.textContent = "◫";
    UI.panelModeBtn.title = t("panel-mode-to-sidepanel");
  } else {
    UI.panelModeBtn.textContent = "⊞";
    UI.panelModeBtn.title = t("panel-mode-to-popup");
  }
}

async function togglePanelMode() {
  const newMode = state.panelMode === "popup" ? "sidepanel" : "popup";
  state.panelMode = newMode;

  if (newMode === "popup") {
    document.body.classList.add("popup-mode");
  } else {
    document.body.classList.remove("popup-mode");
    // Call sidePanel.open() immediately — before any await — to preserve the
    // user gesture context (Chrome requires it to be synchronous in the handler).
    if (POPUP_SRC_WINDOW_ID) {
      chrome.sidePanel.open({ windowId: POPUP_SRC_WINDOW_ID }).catch(() => {});
    }
  }

  updatePanelModeBtn();
  await saveState();

  const response = await sendRuntimeMessage({ type: "SET_PANEL_MODE", mode: newMode });
  if (response?.ok) {
    window.close();
  } else {
    setStatus("error", response?.error || "Mode switch failed");
  }
}

// ── Tab management ──────────────────────────────────────────────────────────
function commitActiveTab() {
  const tab = tabs.find(t => t.id === state.activeTabId);
  if (!tab) return;
  tab.messages      = state.messages;
  tab.pageContent   = state.pageContent;
  tab.selectedModel = state.selectedModel;
  tab.sessionSaved  = state.sessionSaved;
}

function getTabLabel(tab) {
  if (tab.pageContent?.url === "clipboard://") {
    return t("clipboard-tab-label");
  }
  if (tab.pageContent?.title) {
    const title = tab.pageContent.title.trim();
    return title.length > 14 ? title.slice(0, 14) + "\u2026" : title;
  }
  // No page loaded — use the first user message as the label
  const firstUser = tab.messages?.find(m => m.role === "user");
  if (firstUser?.content) {
    const text = firstUser.content.trim().replace(/\s+/g, " ");
    return text.length > 14 ? text.slice(0, 14) + "\u2026" : text;
  }
  return t("empty-tab-label");
}

function renderTabBar() {
  const bar = document.getElementById("tabBar");
  if (!bar) return;
  bar.innerHTML = "";

  let dragSrcId = null;

  tabs.forEach(tab => {
    const btn = document.createElement("button");
    btn.className = "tab-item" + (tab.id === state.activeTabId ? " active" : "");
    btn.draggable = true;
    btn.dataset.tabId = tab.id;

    const label = document.createElement("span");
    label.className = "tab-label";
    label.textContent = getTabLabel(tab);
    btn.appendChild(label);

    if (tabs.length > 1) {
      const close = document.createElement("span");
      close.className = "tab-close";
      close.textContent = "\xd7";
      close.addEventListener("click", e => { e.stopPropagation(); closeTab(tab.id); });
      btn.appendChild(close);
    }

    btn.addEventListener("click", () => switchTab(tab.id));

    // ── Drag-and-drop reorder ──
    btn.addEventListener("dragstart", e => {
      dragSrcId = tab.id;
      e.dataTransfer.effectAllowed = "move";
      btn.classList.add("dragging");
    });
    btn.addEventListener("dragend", () => {
      btn.classList.remove("dragging");
      bar.querySelectorAll(".tab-item").forEach(b => b.classList.remove("drag-over"));
    });
    btn.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragSrcId !== tab.id) btn.classList.add("drag-over");
    });
    btn.addEventListener("dragleave", () => btn.classList.remove("drag-over"));
    btn.addEventListener("drop", e => {
      e.preventDefault();
      btn.classList.remove("drag-over");
      if (dragSrcId === null || dragSrcId === tab.id) return;
      commitActiveTab();
      const srcIdx  = tabs.findIndex(t => t.id === dragSrcId);
      const destIdx = tabs.findIndex(t => t.id === tab.id);
      if (srcIdx === -1 || destIdx === -1) return;
      const [moved] = tabs.splice(srcIdx, 1);
      tabs.splice(destIdx, 0, moved);
      renderTabBar();
      saveState();
    });

    bar.appendChild(btn);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "tab-add";
  addBtn.textContent = "+";
  addBtn.title = "New tab";
  addBtn.addEventListener("click", addTab);
  bar.appendChild(addBtn);
}

async function addTab() {
  commitActiveTab();
  const id = state.nextTabId;
  state.nextTabId++;
  tabs.push({ id, messages: [], pageContent: null, selectedModel: state.selectedModel, sessionSaved: false });
  state.activeTabId  = id;
  state.messages     = [];
  state.pageContent  = null;
  state.sessionSaved = false;
  renderTabBar();
  hidePageInfo();
  renderMessages();
  UI.modelSelect.value = state.selectedModel;
  await saveState();
}

async function switchTab(id) {
  if (id === state.activeTabId) return;
  commitActiveTab();
  state.activeTabId = id;
  const tab = tabs.find(t => t.id === id) || tabs[0];
  state.messages      = tab.messages;
  state.pageContent   = tab.pageContent;
  state.selectedModel = tab.selectedModel;
  state.sessionSaved  = tab.sessionSaved;
  renderTabBar();
  renderMessages();
  UI.modelSelect.value = state.selectedModel;
  if (state.pageContent) showPageInfo(
    state.pageContent.title,
    state.pageContent.url,
    state.pageContent.isYouTubeTranscript ? state.pageContent.text : null
  );
  else hidePageInfo();
  await saveState();
}

async function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;

  // Determine whether this tab has unsaved content.
  // For the active tab use state.* (may have uncommitted changes);
  // for non-active tabs read directly from tabs[].
  const isActive = id === state.activeTabId;
  const tabData  = isActive ? state : tabs[idx];
  const hasUnsaved = tabData.messages.length > 0 && !tabData.sessionSaved;

  if (hasUnsaved) {
    // Switch to the tab so the user can see what they're being asked to save,
    // and so that downloadSession() operates on the correct content.
    if (!isActive) await switchTab(id);
    const choice = await showConfirmSaveDialog();
    if (choice === "cancel") return;
    if (choice === "yes") await downloadSession();
  }
  tabs.splice(idx, 1);
  if (tabs.length === 0) {
    tabs.push({ id: state.nextTabId, messages: [], pageContent: null, selectedModel: DEFAULT_MODEL, sessionSaved: false });
    state.nextTabId++;
  }
  if (id === state.activeTabId) {
    const next = tabs[Math.min(idx, tabs.length - 1)];
    state.activeTabId   = next.id;
    state.messages      = next.messages;
    state.pageContent   = next.pageContent;
    state.selectedModel = next.selectedModel;
    state.sessionSaved  = next.sessionSaved;
  }
  renderTabBar();
  renderMessages();
  UI.modelSelect.value = state.selectedModel;
  if (state.pageContent) showPageInfo(
    state.pageContent.title,
    state.pageContent.url,
    state.pageContent.isYouTubeTranscript ? state.pageContent.text : null
  );
  else hidePageInfo();
  await saveState();
}

function showQuickQuestions() {
  const existingQuick = UI.messagesContainer.querySelector(".quick-questions");
  if (existingQuick) {
    existingQuick.remove();
  }

  const existingSaved = UI.messagesContainer.querySelector(".saved-prompts-section");
  if (existingSaved) {
    existingSaved.remove();
  }

  const quickNode = document.createElement("div");
  quickNode.className = "quick-questions";
  quickNode.innerHTML = `
    <div class="quick-questions-title">${t("quick-question-title")}</div>
    <div class="quick-questions-grid">
      <button class="quick-question-btn" data-template="concise">${t("template-concise")}</button>
      <button class="quick-question-btn" data-template="engineering">${t("template-engineering")}</button>
      <button class="quick-question-btn" data-template="questions">${t("template-questions")}</button>
    </div>
  `;

  const firstMessage = UI.messagesContainer.querySelector(".message");
  if (firstMessage) {
    UI.messagesContainer.insertBefore(quickNode, firstMessage);
  } else {
    UI.messagesContainer.appendChild(quickNode);
  }

  quickNode.querySelectorAll(".quick-question-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const template = btn.getAttribute("data-template") || "";
      handleQuickQuestion(template);
    });
  });

  showSavedPromptsSection();
}

function showSavedPromptsSection() {
  const existingSaved = UI.messagesContainer.querySelector(".saved-prompts-section");
  if (existingSaved) {
    existingSaved.remove();
  }

  const savedNode = document.createElement("div");
  savedNode.className = "saved-prompts-section";

  const listHtml = !state.savedPrompts.length
    ? `<div class="empty-saved-prompts">${t("empty-saved-prompts")}</div>`
    : state.savedPrompts
      .map((prompt, index) => `<button class="saved-prompt-btn" data-index="${index}">${escapeHtml(prompt)}</button>`)
      .join("");

  savedNode.innerHTML = `
    <div class="saved-prompts-header">
      <div class="saved-prompts-title">${t("saved-prompts")}</div>
      <button class="manage-prompts-btn" id="managePromptsBtn">${t("manage-prompts")}</button>
    </div>
    <div class="saved-prompts-list">
      ${listHtml}
    </div>
  `;

  const quickNode = UI.messagesContainer.querySelector(".quick-questions");
  if (quickNode && quickNode.nextSibling) {
    UI.messagesContainer.insertBefore(savedNode, quickNode.nextSibling);
  } else if (quickNode) {
    quickNode.parentNode.insertBefore(savedNode, quickNode.nextSibling);
  } else {
    UI.messagesContainer.appendChild(savedNode);
  }

  const manageBtn = savedNode.querySelector("#managePromptsBtn");
  if (manageBtn) {
    manageBtn.addEventListener("click", openSavedPromptsModal);
  }

  savedNode.querySelectorAll(".saved-prompt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-index"));
      usePrompt(index);
    });
  });
}

function getQuestionPrompt(template) {
  const prompts = {
    "zh-TW": {
      concise: "請用簡短的條列式摘要載入的內容，使用繁體中文，重點放在關鍵概念上。",
      engineering: `你是一位資深技術工程師助理。請分析載入的內容並提供結構化、專業的工程摘要。\n\n請按照以下格式回答：\n\n### 核心摘要\n2-3 句技術概述。\n\n### 關鍵資訊\n- 重點 1\n- 重點 2\n- 重點 3\n（列出 4-6 個最重要的技術要點）\n\n### 技術參數\n- 參數/數值 1\n- 參數/數值 2\n（列出關鍵參數、規格或指標，如果有的話）\n\n### 潛在問題\n- 風險/問題 1\n- 風險/問題 2\n（列出潛在風險或懸而未決的問題，如果沒有則寫「無明顯問題」）\n\n### 建議行動\n- 行動 1\n- 行動 2\n（列出 3-4 個具體的下一步驟或建議）\n\n請使用繁體中文描述，但技術術語保留英文（例如 GPU, API, PCIe, bandwidth）。`,
      questions: "請根據載入的內容，列出 3 個深入問題，這些問題能幫助我更好地理解和分析載入的資訊。請用繁體中文回答。"
    },
    "zh-CN": {
      concise: "请用简短的条列式摘要载入的内容，使用简体中文，重点放在关键概念上。",
      engineering: `你是一位资深技术工程师助理。请分析载入的内容并提供结构化、专业的工程摘要。\n\n请按照以下格式回答：\n\n### 核心摘要\n2-3 句技术概述。\n\n### 关键信息\n- 重点 1\n- 重点 2\n- 重点 3\n（列出 4-6 个最重要的技术要点）\n\n### 技术参数\n- 参数/数值 1\n- 参数/数值 2\n（列出关键参数、规格或指标，如果有的话）\n\n### 潜在问题\n- 风险/问题 1\n- 风险/问题 2\n（列出潜在风险或悬而未决的问题，如果没有则写「无明显问题」）\n\n### 建议行动\n- 行动 1\n- 行动 2\n（列出 3-4 个具体的下一步骤或建议）\n\n请使用简体中文描述，但技术术语保留英文（例如 GPU, API, PCIe, bandwidth）。`,
      questions: "请根据载入的内容，列出 3 个深入问题，这些问题能帮助我更好地理解和分析载入的资讯。请用简体中文回答。"
    },
    en: {
      concise: "Please summarize the loaded content using short bullet points in English, focusing on key concepts.",
      engineering: `You are a senior technical engineer assistant. Analyze the loaded content and provide a structured, professional engineering summary.\n\nFormat your response EXACTLY as follows:\n\n### Core Summary\nBrief 2-3 sentence technical overview.\n\n### Key Information\n- Key point 1\n- Key point 2\n- Key point 3\n(List 4-6 most important technical points)\n\n### Technical Parameters\n- Parameter/Value 1\n- Parameter/Value 2\n(List key parameters, specifications, or metrics if present)\n\n### Potential Issues\n- Risk/Issue 1\n- Risk/Issue 2\n(List potential risks or open issues if applicable, otherwise write 'No obvious issues')\n\n### Recommended Actions\n- Action 1\n- Action 2\n(List 3-4 concrete next steps or recommendations)\n\nPlease respond in English. Keep technical terms in their standard form.`,
      questions: "Based on the loaded content, please list 3 in-depth questions that would help me better understand and analyze the loaded information. Respond in English."
    }
  };

  return prompts[state.currentLanguage]?.[template] || "";
}

function buildApiMessages(userMessage) {
  const apiMessages = [];

  if (state.pageContent) {
    if (state.messages.length === 0) {
      const contextMessage = `Page Title: ${state.pageContent.title}\nPage URL: ${state.pageContent.url}\n\nPage Content:\n${state.pageContent.text}\n\n---\n\nUser Question: ${userMessage}`;
      apiMessages.push({ role: "user", content: contextMessage });
    } else {
      const contextMessage = `Page Title: ${state.pageContent.title}\nPage URL: ${state.pageContent.url}\n\nPage Content:\n${state.pageContent.text}`;
      apiMessages.push({ role: "user", content: contextMessage });
      apiMessages.push({ role: "assistant", content: "I have the page content. How can I help you?" });
      apiMessages.push(...state.messages);
      apiMessages.push({ role: "user", content: userMessage });
    }
    return apiMessages;
  }

  apiMessages.push(...state.messages);
  apiMessages.push({ role: "user", content: userMessage });
  return apiMessages;
}

async function sendMessage() {
  const hasKey = await ensureApiKey(false);
  if (!hasKey) {
    return;
  }

  if (isAnthropicModelRestricted(state.selectedModel)) {
    setStatus("error", t("error-model-restricted"));
    return;
  }

  const userMessage = UI.messageInput.value.trim();
  if (!userMessage) {
    setStatus("error", t("error-empty-message"));
    return;
  }

  UI.sendBtn.disabled = true;
  UI.messageInput.disabled = true;
  setStatus("loading", t("status-sending"));
  const srcTabId = state.activeTabId;

  addMessage("user", userMessage);
  UI.messageInput.value = "";
  UI.messageInput.style.height = "auto";

  try {
    const response = await sendRuntimeMessage({
      type: "CHAT",
      messages: buildApiMessages(userMessage),
      language: state.currentLanguage,
      apiKey: state.selectedApiKey,
      model: state.selectedModel
    });

    if (!response?.ok) {
      setStatus("error", t("error-send") + (response?.error || "Unknown error"));
      return;
    }

    // If the user switched tabs while waiting, route response to the originating tab
    if (state.activeTabId !== srcTabId) {
      const srcTab = tabs.find(t => t.id === srcTabId);
      if (srcTab) {
        srcTab.messages.push({ role: "user", content: userMessage });
        srcTab.messages.push({ role: "assistant", content: response.result || "" });
        srcTab.sessionSaved = false;
      }
      incrementModelUsage(state.selectedModel);
      await saveState();
      renderTabBar();
      setStatus("ready", t("status-ready"));
      return;
    }

    addMessage("assistant", response.result || "");
    state.messages.push({ role: "user", content: userMessage });
    state.messages.push({ role: "assistant", content: response.result || "" });
    state.sessionSaved = false;
    incrementModelUsage(state.selectedModel);
    await saveState();
    renderTabBar();

    if (state.pageContent) {
      showQuickQuestions();
    }

    setStatus("ready", t("status-ready"));
  } catch (err) {
    setStatus("error", t("error-send") + (err.message || String(err)));
  } finally {
    UI.sendBtn.disabled = false;
    UI.messageInput.disabled = false;
    UI.messageInput.focus();
  }
}

async function handleQuickQuestion(template) {
  const hasKey = await ensureApiKey(false);
  if (!hasKey) {
    return;
  }

  if (isAnthropicModelRestricted(state.selectedModel)) {
    setStatus("error", t("error-model-restricted"));
    return;
  }

  const prompt = getQuestionPrompt(template);
  if (!prompt) return;

  if (template === "questions" && state.pageContent) {
    UI.sendBtn.disabled = true;
    UI.messageInput.disabled = true;
    setStatus("loading", t("status-sending"));
    const srcTabId = state.activeTabId;

    try {
      addMessage("user", prompt);

      const contextMessage = `Page Title: ${state.pageContent.title}\nPage URL: ${state.pageContent.url}\n\nPage Content:\n${state.pageContent.text}\n\n---\n\n${prompt}`;
      const response = await sendRuntimeMessage({
        type: "CHAT",
        messages: [{ role: "user", content: contextMessage }],
        language: state.currentLanguage,
        apiKey: state.selectedApiKey,
        model: state.selectedModel
      });

      if (!response?.ok) {
        setStatus("error", t("error-send") + (response?.error || "Unknown error"));
        return;
      }

      if (state.activeTabId !== srcTabId) {
        const srcTab = tabs.find(t => t.id === srcTabId);
        if (srcTab) {
          srcTab.messages.push({ role: "user", content: prompt });
          srcTab.messages.push({ role: "assistant", content: response.result || "" });
          srcTab.sessionSaved = false;
        }
        incrementModelUsage(state.selectedModel);
        await saveState();
        setStatus("ready", t("status-ready"));
        return;
      }

      addMessage("assistant", response.result || "");
      state.messages.push({ role: "user", content: prompt });
      state.messages.push({ role: "assistant", content: response.result || "" });
      state.sessionSaved = false;
      incrementModelUsage(state.selectedModel);
      await saveState();
      setStatus("ready", t("status-ready"));
    } catch (err) {
      setStatus("error", t("error-send") + (err.message || String(err)));
    } finally {
      UI.sendBtn.disabled = false;
      UI.messageInput.disabled = false;
    }

    return;
  }

  UI.messageInput.value = prompt;
  UI.messageInput.style.height = "auto";
  UI.messageInput.style.height = `${UI.messageInput.scrollHeight}px`;
  await sendMessage();
}

async function loadPageContent() {
  UI.loadPageBtn.disabled = true;
  setStatus("loading", t("status-loading-page"));

  try {
    // In sidepanel mode, currentWindow gives the active tab in the host browser window.
    // In popup mode the "current window" is the extension popup, so we query all windows
    // and filter out chrome-extension:// tabs.
    let tab;
    if (POPUP_SRC_WINDOW_ID === null) {
      // Sidepanel mode
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];
    } else {
      // Popup mode — prefer the source browser window (the one user clicked from)
      const srcTabs = await chrome.tabs.query({ active: true, windowId: POPUP_SRC_WINDOW_ID });
      tab = srcTabs.find(t => !t.url?.startsWith("chrome-extension://")) || srcTabs[0];
      if (!tab) {
        // Fallback: any active non-extension tab
        const allTabs = await chrome.tabs.query({ active: true });
        tab = allTabs.find(t => !t.url?.startsWith("chrome-extension://"))
           || allTabs.find(t => t.windowType !== "popup")
           || allTabs[0];
      }
    }
    console.log("[KC] loadPageContent target tab:", { id: tab?.id, url: tab?.url, windowId: tab?.windowId, mode: POPUP_SRC_WINDOW_ID === null ? "sidepanel" : "popup" });
    if (!tab?.id) {
      setStatus("error", t("error-no-tab"));
      return;
    }

    const response = await sendRuntimeMessage({ type: "GET_PAGE_CONTENT", tabId: tab.id });
    if (!response?.ok) {
      state.pageContent = null;
      setStatus("error", t("error-load-page") + (response?.error || "Unknown error"));
      return;
    }

    state.messages = [];
    renderEmptyState();

    state.pageContent = response.content;
    showPageInfo(
      state.pageContent.title,
      state.pageContent.url,
      state.pageContent.isYouTubeTranscript ? state.pageContent.text : null
    );
    const sysMsg = state.pageContent.isYouTubeTranscript
      ? t("system-youtube-transcript-loaded")
      : t("system-page-loaded");
    addSystemMessage(sysMsg);
    showQuickQuestions();
    commitActiveTab();
    renderTabBar();

    await saveState();
    let statusMsg;
    if (state.pageContent.isYouTubeTranscript) {
      statusMsg = t("status-youtube-transcript-loaded");
    } else if (state.pageContent.isYouTubeNoTranscript) {
      statusMsg = t("status-youtube-no-transcript");
    } else {
      statusMsg = t("status-page-loaded");
    }
    setStatus("ready", statusMsg);
  } catch (err) {
    state.pageContent = null;
    setStatus("error", t("error-load-page") + (err.message || String(err)));
  } finally {
    UI.loadPageBtn.disabled = false;
  }
}

async function loadClipboardContent() {
  UI.loadClipboardBtn.disabled = true;
  setStatus("loading", t("status-loading-clipboard"));

  try {
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText || !clipboardText.trim()) {
      setStatus("error", t("error-clipboard-empty"));
      return;
    }

    state.messages = [];
    renderEmptyState();

    state.pageContent = {
      title: "Clipboard Content",
      url: "clipboard://",
      text: clipboardText.trim()
    };

    showPageInfo(`📋 ${t("load-clipboard")}`, `${clipboardText.length} chars`);
    addSystemMessage(t("system-clipboard-loaded"));
    showQuickQuestions();
    commitActiveTab();
    renderTabBar();

    await saveState();
    setStatus("ready", t("status-clipboard-loaded"));
  } catch (err) {
    state.pageContent = null;
    setStatus("error", t("error-load-clipboard") + (err.message || String(err)));
  } finally {
    UI.loadClipboardBtn.disabled = false;
  }
}

async function clearConversation() {
  if (tabs.length > 1) {
    await closeTab(state.activeTabId);
    return;
  }
  // Only one tab: clear its content
  if (state.messages.length > 0 && !state.sessionSaved) {
    const choice = await showConfirmSaveDialog();
    if (choice === "cancel") return;
    if (choice === "yes") await downloadSession();
  }
  state.messages = [];
  state.pageContent = null;
  state.sessionSaved = false;
  hidePageInfo();
  renderMessages();
  commitActiveTab();
  renderTabBar();
  await saveState();
  setStatus("ready", t("status-ready"));
}

async function loadModels() {
  const hasKey = await ensureApiKey(false);
  if (!hasKey) {
    state.openaiModels = [];
    state.anthropicModels = [];
    state.models = [];
    renderModelOptions();
    return;
  }

  setStatus("loading", t("status-loading-models"));
  const response = await sendRuntimeMessage({ type: "GET_MODELS", apiKey: state.selectedApiKey });

  if (!response?.ok) {
    state.openaiModels = [];
    state.anthropicModels = [];
    state.models = [];
    renderModelOptions();
    setStatus("error", t("error-load-models") + (response?.error || "unknown error"));
    return;
  }

  state.openaiModels = Array.isArray(response.openaiModels) ? response.openaiModels : [];
  state.anthropicModels = Array.isArray(response.anthropicModels) ? response.anthropicModels : [];
  state.models = [...state.openaiModels, ...state.anthropicModels];
  renderModelOptions();

  if (!isGnaiKey(state.selectedApiKey)) {
    const quotaResponse = await fetchQuotaFromApi();
    if (quotaResponse?.ok) {
      syncModelQuotasFromQuota(quotaResponse.quota || {});
    }
  }

  await saveState();
  setStatus("ready", t("status-models-loaded", { count: String(state.models.length) }));
}

function openSavedPromptsModal() {
  UI.savedPromptsModal.classList.add("show");
  renderSavedPromptsList();
}

function closeSavedPromptsModal() {
  UI.savedPromptsModal.classList.remove("show");
  UI.newPromptInput.value = "";
}

function renderSavedPromptsList() {
  if (!state.savedPrompts.length) {
    UI.savedPromptsList.innerHTML = `
      <div class="empty-prompts">
        <div class="empty-prompts-icon">📝</div>
        <div class="empty-prompts-text">${t("empty-prompts")}</div>
      </div>
    `;
    return;
  }

  UI.savedPromptsList.innerHTML = state.savedPrompts
    .map(
      (prompt, index) => `
      <div class="saved-prompt-item">
        <div class="saved-prompt-text" data-index="${index}">${escapeHtml(prompt)}</div>
        <div class="saved-prompt-actions">
          <button class="prompt-action-btn delete-prompt-btn" data-index="${index}" title="Delete">🗑️</button>
        </div>
      </div>
    `
    )
    .join("");

  UI.savedPromptsList.querySelectorAll(".saved-prompt-text").forEach((element) => {
    element.addEventListener("click", () => {
      const index = Number(element.getAttribute("data-index"));
      usePrompt(index);
    });
  });

  UI.savedPromptsList.querySelectorAll(".delete-prompt-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-index"));
      deletePrompt(index);
    });
  });
}

async function addNewPrompt() {
  const promptText = UI.newPromptInput.value.trim();
  if (!promptText) return;

  state.savedPrompts.push(promptText);
  await saveState();

  UI.newPromptInput.value = "";
  renderSavedPromptsList();

  if (state.pageContent) {
    showSavedPromptsSection();
  }
}

async function deletePrompt(index) {
  state.savedPrompts.splice(index, 1);
  await saveState();
  renderSavedPromptsList();

  if (state.pageContent) {
    showSavedPromptsSection();
  }
}

function usePrompt(index) {
  const prompt = state.savedPrompts[index];
  if (!prompt) return;

  UI.messageInput.value = prompt;
  UI.messageInput.style.height = "auto";
  UI.messageInput.style.height = `${UI.messageInput.scrollHeight}px`;
  UI.messageInput.focus();
  closeSavedPromptsModal();
}

function buildSessionMarkdown() {
  const lines = [];
  const dateStr = new Date().toLocaleString();
  lines.push("# Key Chatter Session\n");
  lines.push(`**Date**: ${dateStr}  `);
  lines.push(`**Model**: ${state.selectedModel}  `);
  if (state.pageContent) {
    lines.push(`**Page**: [${state.pageContent.title}](${state.pageContent.url})  `);
  }
  lines.push("\n---\n");
  for (const msg of state.messages) {
    const role = msg.role === "user" ? "## \u{1F464} User" : "## \u{1F916} Assistant";
    lines.push(role + "\n");
    lines.push(msg.content + "\n");
    lines.push("---\n");
  }
  return lines.join("\n");
}

async function downloadSession() {
  if (state.messages.length === 0) {
    setStatus("error", t("status-session-empty"));
    return;
  }
  const md = buildSessionMarkdown();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "");
  const filename = `key-chatter-report/${ts}.md`;
  try {
    const downloadId = await chrome.downloads.download({ url, filename, saveAs: true });

    // Wait for the download to either complete or be cancelled by the user
    const savedOk = await new Promise((resolve) => {
      const onChanged = (delta) => {
        if (delta.id !== downloadId) return;
        if (delta.state?.current === "complete") {
          chrome.downloads.onChanged.removeListener(onChanged);
          resolve(true);
        } else if (delta.state?.current === "interrupted") {
          chrome.downloads.onChanged.removeListener(onChanged);
          resolve(false);
        }
      };
      chrome.downloads.onChanged.addListener(onChanged);
      // Also check immediately in case the state already settled before we registered
      chrome.downloads.search({ id: downloadId }).then(([item]) => {
        if (item?.state === "complete") {
          chrome.downloads.onChanged.removeListener(onChanged);
          resolve(true);
        } else if (item?.state === "interrupted") {
          chrome.downloads.onChanged.removeListener(onChanged);
          resolve(false);
        }
      });
    });

    if (savedOk) {
      state.sessionSaved = true;
      setStatus("ready", t("status-session-saved"));
    } else {
      setStatus("ready", t("status-ready"));
    }
  } catch (err) {
    setStatus("error", err.message || "Download failed");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function setupEventHandlers() {
  UI.languageSelect.addEventListener("change", async () => {
    state.currentLanguage = UI.languageSelect.value;
    updateUILanguage();

    if (state.pageContent) {
      showQuickQuestions();
    }

    await saveState();
    setStatus("ready", t("lang-set", { lang: state.currentLanguage }));
  });

  UI.headerTitle.addEventListener("click", async () => {
    const updated = await promptForApiKey(false);
    if (updated) {
      await loadModels();
    }
  });

  UI.modelSelect.addEventListener("change", async () => {
    state.selectedModel = UI.modelSelect.value;
    if (isAnthropicModelRestricted(state.selectedModel)) {
      const selectableModels = getSelectableModels();
      state.selectedModel = selectableModels[0] || DEFAULT_MODEL;
      UI.modelSelect.value = state.selectedModel;
      setStatus("error", t("error-model-restricted"));
    }
    await saveState();
  });

  UI.panelModeBtn.addEventListener("click", togglePanelMode);
  UI.saveSessionBtn.addEventListener("click", downloadSession);
  UI.loadPageBtn.addEventListener("click", loadPageContent);
  UI.loadClipboardBtn.addEventListener("click", loadClipboardContent);
  UI.clearBtn.addEventListener("click", clearConversation);

  UI.sendBtn.addEventListener("click", sendMessage);

  UI.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  UI.messageInput.addEventListener("input", () => {
    UI.messageInput.style.height = "auto";
    UI.messageInput.style.height = `${UI.messageInput.scrollHeight}px`;
  });

  UI.closeSavedPromptsModal.addEventListener("click", closeSavedPromptsModal);
  UI.savedPromptsModal.addEventListener("click", (event) => {
    if (event.target === UI.savedPromptsModal) {
      closeSavedPromptsModal();
    }
  });

  UI.addPromptBtn.addEventListener("click", addNewPrompt);
  UI.newPromptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      addNewPrompt();
    }
  });
}

async function bootstrap() {
  await initializeState();
  setupEventHandlers();

  if (!state.selectedApiKey) {
    await promptForApiKey(true);
  }

  setStatus("ready", t("status-ready"));
  await loadModels();
}

bootstrap().catch((err) => {
  setStatus("error", t("error-init") + (err.message || String(err)));
});
