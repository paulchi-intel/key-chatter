// background.js (service worker, MV3)
// ExpertGPT API bridge for chat + personal quota

const OPENAI_BASE_URL = "https://expertgpt.intel.com/v1";
const ANTHROPIC_BASE_URL = "https://expertgpt.intel.com/anthropic/v1";
const REQUEST_TIMEOUT_MS = 20000;

const MESSAGE_TYPES = {
  GET_MODELS: "GET_MODELS",
  GET_PAGE_CONTENT: "GET_PAGE_CONTENT",
  CHAT: "CHAT",
  GET_QUOTA: "GET_QUOTA"
};

const SYSTEM_PROMPTS = {
  "zh-TW": "你是一位友善且樂於助人的 AI 助理。請使用繁體中文回答，內容清楚、精準、可執行。",
  "zh-CN": "你是一位友善且乐于助人的 AI 助理。请使用简体中文回答，内容清晰、准确、可执行。",
  "en": "You are a friendly and helpful AI assistant. Answer clearly, accurately, and with actionable details."
};

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

async function getPageContent(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      let text = document.body ? document.body.innerText || "" : "";
      const title = document.title || "";
      const url = window.location.href || "";

      const maxLen = 15000;
      if (text.length > maxLen) {
        text = `${text.slice(0, maxLen)}\n\n[... content truncated ...]`;
      }

      return { text, title, url };
    }
  });

  return result;
}

function assertApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("pak_")) {
    throw new Error("API key is required");
  }
}

async function fetchJson(baseUrl, path, apiKey, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: options.body,
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`${path} failed (${response.status}): ${text}`);
    }

    return response.json();
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchModels(apiKey) {
  assertApiKey(apiKey);

  const data = await fetchJson(OPENAI_BASE_URL, "/models", apiKey);
  return (data.data || [])
    .map((m) => String(m?.id || "").trim())
    .filter(Boolean);
}

async function fetchAnthropicModels(apiKey) {
  assertApiKey(apiKey);

  const data = await fetchJson(ANTHROPIC_BASE_URL, "/models", apiKey);
  return (data.data || [])
    .map((m) => String(m?.id || "").trim())
    .filter(Boolean);
}

async function callExpertGPT(messages, language, apiKey, model) {
  assertApiKey(apiKey);
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS["zh-TW"];
  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const body = {
    model: model || "gpt-4.1-mini",
    messages: fullMessages,
    stream: false,
    temperature: 0.7,
    max_tokens: 1200
  };

  const data = await fetchJson(OPENAI_BASE_URL, "/chat/completions", apiKey, {
    method: "POST",
    body: JSON.stringify(body)
  });
  return data?.choices?.[0]?.message?.content || "(No response content)";
}

async function fetchPersonalQuota(apiKey) {
  assertApiKey(apiKey);

  return fetchJson(OPENAI_BASE_URL, "/quota", apiKey);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.GET_MODELS) {
    (async () => {
      try {
        const openaiModels = await fetchModels(message.apiKey);

        // Anthropic models are optional. If this endpoint fails, keep core model loading working.
        let anthropicModels = [];
        try {
          anthropicModels = await fetchAnthropicModels(message.apiKey);
        } catch (_err) {
          anthropicModels = [];
        }

        sendResponse({
          ok: true,
          models: [...openaiModels, ...anthropicModels],
          openaiModels,
          anthropicModels
        });
      } catch (err) {
        sendResponse({ ok: false, error: err.message || String(err) });
      }
    })();
    return true;
  }

  if (message.type === MESSAGE_TYPES.GET_PAGE_CONTENT) {
    (async () => {
      try {
        const content = await getPageContent(message.tabId);
        if (!content?.text?.trim()) {
          sendResponse({ ok: false, error: "No page text found." });
          return;
        }
        sendResponse({ ok: true, content });
      } catch (err) {
        sendResponse({ ok: false, error: err.message || String(err) });
      }
    })();
    return true;
  }

  if (message.type === MESSAGE_TYPES.CHAT) {
    (async () => {
      try {
        const result = await callExpertGPT(
          message.messages || [],
          message.language || "zh-TW",
          message.apiKey,
          message.model || "gpt-4.1-mini"
        );
        sendResponse({ ok: true, result });
      } catch (err) {
        sendResponse({ ok: false, error: err.message || String(err) });
      }
    })();
    return true;
  }

  if (message.type === MESSAGE_TYPES.GET_QUOTA) {
    (async () => {
      try {
        const quota = await fetchPersonalQuota(message.apiKey);
        sendResponse({ ok: true, quota });
      } catch (err) {
        sendResponse({ ok: false, error: err.message || String(err) });
      }
    })();
    return true;
  }

  sendResponse({ ok: false, error: `Unsupported message type: ${String(message?.type || "")}` });
});
