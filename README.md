# Key Chatter

Chrome extension side panel using ExpertGPT API key.

## GitHub Description

Key Chatter is a Chrome side panel extension for ExpertGPT with webpage/clipboard context chat, OpenAI + Anthropic model selection, and built-in multilingual prompts.

## Features

- **Single-panel chat UI** — no tabs, just chat
- **API Key** — stored locally; enter once on first launch, edit anytime by clicking 🔑 in the header
- **Model selector** — loaded from `/v1/models`, shown in the header bar with used/limit quota per model (e.g. `gpt-4.1-mini (3/100)`)
- **Dual model sources** — OpenAI models from `/v1/models` and Anthropic models from `/anthropic/v1/models`
- **Grouped model dropdown** — selector groups are shown as `--- OpenAI ---` and `--- Anthropic ---`
- **Anthropic restrictions** — models that are currently restricted are shown disabled (gray) in the Anthropic section; `claude-haiku-4-5*` stays selectable
- **Header controls** — Clear / Load Page / Load Clipboard / model dropdown / language selector (繁/簡/En)
- **Quick Questions** — appears after loading page/clipboard content; one-click summary templates
- **Saved Prompts** — manage reusable prompt snippets, accessible from the chat panel
- **i18n** — full UI in Traditional Chinese, Simplified Chinese, and English
- **Reliability guards** — request timeouts and explicit background/runtime error handling

## API Key

No default key is bundled. On first launch you will be prompted to enter a `pak_...` key.
To change the key later, click **🔑 Key Chatter** in the header.

## How to use

1. Open the side panel.
2. Enter your `pak_...` API key when prompted (first launch only).
3. Select a model from the header dropdown.
4. Optionally click **Load Page** or **Load Clipboard** to add context.
5. Use **Quick Questions** for one-click summaries after loading content.
6. Use **Saved Prompts** to store and reuse common prompts.
7. Ask questions normally in the chat box.

## Delivery Notes

- Manifest is MV3 and uses `<all_urls>` host permission so Load Page can extract content from arbitrary websites.
- API key is stored in `chrome.storage.local` and validated as `pak_...` format.
- Legacy `apiKeys[]` data is auto-migrated to single-key mode at startup.

## Release Checklist

1. Load unpacked extension from this folder in Chrome.
2. Verify first-launch API key modal appears and key is persisted after reopening browser.
3. Verify model list loads and displays quota as `(used/limit)`.
4. Verify model groups appear as `--- OpenAI ---` and `--- Anthropic ---`.
5. Verify restricted Anthropic models are disabled.
6. Verify chat works in all 3 languages (繁/簡/En).
7. Verify `Load Page` and `Load Clipboard` both produce context-aware answers.
8. Verify Saved Prompts add/delete/use flows.
9. Re-check extension permissions in `chrome://extensions` before packaging.

## Files

- `manifest.json`: extension manifest (MV3)
- `background.js`: service worker — API bridge for `/v1/models`, `/anthropic/v1/models`, `/v1/chat/completions`, `/v1/quota` with request timeout guards
- `sidepanel.html`: single-panel UI structure and CSS
- `sidepanel.js`: all UI logic — chat, API key modal/validation, model/quota sync, quick questions, saved prompts, i18n
- `options.html`: static info page
