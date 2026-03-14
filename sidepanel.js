// sidepanel.js - Key Chatter single-panel chat UI

const STORAGE_KEYS = {
  selectedApiKey: "selectedApiKey",
  selectedModel: "selectedModel",
  language: "language",
  messages: "messages",
  pageContent: "pageContent",
  savedPrompts: "savedPrompts"
};

const DEFAULT_MODEL = "gpt-4.1-mini";
const RUNTIME_MESSAGE_TIMEOUT_MS = 20000;
const ALLOWED_ANTHROPIC_MODEL_PREFIXES = ["claude-haiku-4-5"];

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
    "error-api-key-prefix": "API key 必須以 pak_ 開頭",
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
    "apikey-modal-hint": "請輸入 API Key（以 pak_ 開頭）",
    "apikey-cancel": "取消",
    "apikey-confirm": "確認",
    "apikey-updated": "API key 已更新",
    "apikey-required": "請先設定 API key",
    "model-restricted-tag": "受限"
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
    "error-api-key-prefix": "API key 必须以 pak_ 开头",
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
    "apikey-modal-hint": "请输入 API Key（以 pak_ 开头）",
    "apikey-cancel": "取消",
    "apikey-confirm": "确认",
    "apikey-updated": "API key 已更新",
    "apikey-required": "请先设置 API key",
    "model-restricted-tag": "受限"
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
    "error-api-key-prefix": "API key must start with pak_",
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
    "apikey-modal-hint": "Enter your API Key (starts with pak_)",
    "apikey-cancel": "Cancel",
    "apikey-confirm": "Confirm",
    "apikey-updated": "API key updated",
    "apikey-required": "Please set your API key first",
    "model-restricted-tag": "Restricted"
  }
};

const UI = {
  headerTitle: document.getElementById("headerTitle"),
  clearBtn: document.getElementById("clearBtn"),
  loadPageBtn: document.getElementById("loadPageBtn"),
  loadClipboardBtn: document.getElementById("loadClipboardBtn"),
  languageSelect: document.getElementById("languageSelect"),
  statusIndicator: document.getElementById("statusIndicator"),
  statusText: document.getElementById("statusText"),
  pageInfo: document.getElementById("pageInfo"),
  pageTitle: document.getElementById("pageTitle"),
  pageUrl: document.getElementById("pageUrl"),
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
  closeApiKeyModal: document.getElementById("closeApiKeyModal")
};

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
  savedPrompts: []
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

  UI.languageSelect.value = state.currentLanguage;
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
  return typeof key === "string" && key.startsWith("pak_") && key.length > 8;
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

function showPageInfo(title, url) {
  UI.pageTitle.textContent = title || "";
  UI.pageUrl.textContent = url || "";
  UI.pageInfo.classList.add("show");
}

function hidePageInfo() {
  UI.pageInfo.classList.remove("show");
  UI.pageTitle.textContent = "";
  UI.pageUrl.textContent = "";
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
    let html = escapeHtml(content || "");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`(.+?)`/g, "<code>$1</code>");
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    html = `<p>${html}</p>`.replace(/<p><\/p>/g, "");
    node.innerHTML = html;
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
    renderEmptyState();
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
  if (!state.anthropicModels.includes(model)) {
    return false;
  }

  return !ALLOWED_ANTHROPIC_MODEL_PREFIXES.some((prefix) => model.startsWith(prefix));
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

    models.forEach((model) => {
      const quota = state.modelQuotas[model] || { used: 0, limit: 0 };
      const option = document.createElement("option");
      option.value = model;
      const isRestricted = isAnthropicModelRestricted(model);
      option.disabled = isRestricted;
      option.textContent = isRestricted
        ? `${model} (${quota.used}/${quota.limit}) [${t("model-restricted-tag")}]`
        : `${model} (${quota.used}/${quota.limit})`;
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
  await chrome.storage.local.set({
    [STORAGE_KEYS.selectedApiKey]: state.selectedApiKey,
    [STORAGE_KEYS.selectedModel]: state.selectedModel,
    [STORAGE_KEYS.language]: state.currentLanguage,
    [STORAGE_KEYS.messages]: state.messages,
    [STORAGE_KEYS.pageContent]: state.pageContent,
    [STORAGE_KEYS.savedPrompts]: state.savedPrompts
  });
}

async function initializeState() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.selectedApiKey,
    STORAGE_KEYS.selectedModel,
    STORAGE_KEYS.language,
    STORAGE_KEYS.messages,
    STORAGE_KEYS.pageContent,
    STORAGE_KEYS.savedPrompts
  ]);

  // Backward compatibility: migrate first valid key from legacy apiKeys[] storage.
  const keys = Array.isArray(stored.apiKeys) ? stored.apiKeys : [];
  const firstStoredKey = keys.find((key) => isValidApiKey(String(key)));
  const selectedKey = stored[STORAGE_KEYS.selectedApiKey];

  state.selectedApiKey = isValidApiKey(selectedKey) ? selectedKey : firstStoredKey || "";
  state.selectedModel = stored[STORAGE_KEYS.selectedModel] || DEFAULT_MODEL;
  state.openaiModels = [];
  state.anthropicModels = [];
  state.currentLanguage = stored[STORAGE_KEYS.language] || "zh-TW";
  state.messages = Array.isArray(stored[STORAGE_KEYS.messages]) ? stored[STORAGE_KEYS.messages] : [];
  state.pageContent = stored[STORAGE_KEYS.pageContent] || null;
  state.savedPrompts = Array.isArray(stored[STORAGE_KEYS.savedPrompts]) ? stored[STORAGE_KEYS.savedPrompts] : [];

  renderModelOptions();
  renderMessages();

  if (state.pageContent) {
    showPageInfo(state.pageContent.title, state.pageContent.url);
  }

  updateUILanguage();
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

    addMessage("assistant", response.result || "");
    state.messages.push({ role: "user", content: userMessage });
    state.messages.push({ role: "assistant", content: response.result || "" });
    incrementModelUsage(state.selectedModel);
    await saveState();

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

      addMessage("assistant", response.result || "");
      state.messages.push({ role: "user", content: prompt });
      state.messages.push({ role: "assistant", content: response.result || "" });
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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
    showPageInfo(state.pageContent.title, state.pageContent.url);
    addSystemMessage(t("system-page-loaded"));
    showQuickQuestions();

    await saveState();
    setStatus("ready", t("status-page-loaded"));
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
  state.messages = [];
  state.pageContent = null;
  hidePageInfo();
  renderMessages();
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

  const quotaResponse = await fetchQuotaFromApi();
  if (quotaResponse?.ok) {
    syncModelQuotasFromQuota(quotaResponse.quota || {});
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
