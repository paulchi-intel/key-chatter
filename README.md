# Key Chatter

Chrome extension side panel supporting both ExpertGPT and GNAI API keys.

## GitHub Description

Key Chatter is a Chrome side panel extension supporting ExpertGPT and GNAI APIs, with webpage/clipboard context chat, OpenAI + Anthropic model selection, and built-in multilingual prompts.

## Features

- **Single-panel chat UI** — no tabs, just chat
- **Dual API key support** — accepts both ExpertGPT (`pak_...`) and GNAI keys; the model list and chat endpoint are automatically routed based on the key type
- **Model selector** — groups shown as `--- OpenAI ---` and `--- Anthropic ---`
  - **ExpertGPT key**: models fetched dynamically from the API; quota displayed as `(used/limit)` per model
  - **GNAI key**: fixed model list (no quota display); OpenAI models: `gpt-4o`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`, `o3-mini`; Anthropic models: `claude-4-6-opus`, `claude-4-6-sonnet`, `claude-4-5-opus`, `claude-4-5-sonnet`, `claude-4-5-haiku`
- **Automatic endpoint routing** — Anthropic models route to the Anthropic endpoint; OpenAI-compatible models route to the OpenAI endpoint; each key type uses its own base URL
- **Header controls** — Clear / Load Page / Load Clipboard / model dropdown / language selector (繁/簡/En)
- **Quick Questions** — appears after loading page/clipboard content; one-click summary templates
- **Saved Prompts** — manage reusable prompt snippets, accessible from the chat panel
- **i18n** — full UI in Traditional Chinese, Simplified Chinese, and English
- **Reliability guards** — request timeouts and explicit background/runtime error handling

## API Key

No default key is bundled. On first launch you will be prompted to enter your API key. Two key formats are supported:

| Type | Format | Where to get it |
|------|--------|-----------------|
| **ExpertGPT** | starts with `pak_` | https://expertgpt.intel.com/my_profile |
| **GNAI** | any other string | https://gnai.intel.com/auth/oauth2/sso/ |

To change the key later, click **🔑 Key Chatter** in the header.

## How to use

1. Open the side panel.
2. Enter your API key when prompted (first launch only) — either an ExpertGPT `pak_...` key or a GNAI key.
3. The model list loads automatically based on your key type.
4. Select a model from the header dropdown.
5. Optionally click **Load Page** or **Load Clipboard** to add context.
6. Use **Quick Questions** for one-click summaries after loading content.
7. Use **Saved Prompts** to store and reuse common prompts.
8. Ask questions normally in the chat box.

## Delivery Notes

- Manifest is MV3 and uses `<all_urls>` host permission so Load Page can extract content from arbitrary websites.
- API key is stored in `chrome.storage.local`. ExpertGPT keys are validated as `pak_` + length > 8; GNAI keys accept any non-empty string.
- For ExpertGPT keys, per-model quota is fetched from `/v1/quota` and shown in the selector. GNAI keys skip this step.
- Anthropic models always route to the Anthropic-format endpoint (`/v1/messages`); OpenAI-compatible models route to `/chat/completions`.
- Legacy `apiKeys[]` data is auto-migrated to single-key mode at startup.

## Release Checklist

1. Load unpacked extension from this folder in Chrome.
2. Verify first-launch API key modal appears with updated hint text.
3. **ExpertGPT key (`pak_...`)**:
   - Models load dynamically with `(used/limit)` quota in selector.
   - Both OpenAI and Anthropic model groups appear.
   - Chat works with both OpenAI and Anthropic models.
   - Quota section visible in selector.
4. **GNAI key**:
   - Fixed model list loads (no quota in selector).
   - Both OpenAI and Anthropic model groups appear.
   - Chat works with both OpenAI and Anthropic models.
5. Verify chat works in all 3 languages (繁/簡/En).
6. Verify `Load Page` and `Load Clipboard` both produce context-aware answers.
7. Verify Saved Prompts add/delete/use flows.
8. Re-check extension permissions in `chrome://extensions` before packaging.

## Files

- `manifest.json`: extension manifest (MV3)
- `background.js`: service worker — API bridge; routes requests to ExpertGPT or GNAI endpoints based on key type; supports `/v1/models`, `/anthropic/v1/models`, `/chat/completions`, `/v1/messages` (Anthropic format), `/v1/quota`
- `sidepanel.html`: single-panel UI structure and CSS
- `sidepanel.js`: all UI logic — chat, API key modal/validation, model list rendering (with/without quota), quick questions, saved prompts, i18n
- `options.html`: static info page
