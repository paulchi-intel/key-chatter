# Key Chatter

Chrome extension supporting both ExpertGPT and GNAI API keys, with a side panel and a floating popup window mode.

## GitHub Description

Key Chatter is a Chrome extension supporting ExpertGPT and GNAI APIs, with webpage/clipboard context chat, OpenAI + Anthropic model selection, built-in multilingual prompts, and a switchable side panel / floating popup UI.

## Features

- **Dual display mode** — toggle between side panel (anchored to the browser) and a floating popup window (movable and resizable by the OS) using the ⊞/◫ button at the far right of the header; preference is persisted across sessions
- **Single-panel chat UI** — no tabs, just chat
- **Markdown rendering** — assistant replies render bold, italic, headings, bullet/numbered lists, inline code, fenced code blocks, and tables; blank lines and list spacing are kept minimal
- **Dual API key support** — accepts both ExpertGPT (`pak_...`) and GNAI keys; the model list and chat endpoint are automatically routed based on the key type
- **Model selector** — groups shown as `--- OpenAI ---` and `--- Anthropic ---`
  - **ExpertGPT key**: models fetched dynamically from the API; quota displayed as `(used/limit)` per model
  - **GNAI key**: fixed model list (no quota display); OpenAI models: `gpt-4o`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`, `o3-mini`; Anthropic models: `claude-4-6-opus`, `claude-4-6-sonnet`, `claude-4-5-opus`, `claude-4-5-sonnet`, `claude-4-5-haiku`
- **Automatic endpoint routing** — Anthropic models route to the Anthropic endpoint; OpenAI-compatible models route to the OpenAI endpoint; each key type uses its own base URL
- **Save Session** — click the 💾 button to download the current conversation as a Markdown file (`.md`); the OS "Save As" dialog opens so you can choose the destination (e.g. `Documents\key-chatter-report`); if you click **Clear** without having saved, a confirmation prompt asks whether to save first
- **Header controls** — Clear / 💾 Save / Load Page / Load Clipboard / model dropdown / language selector (繁/簡/En) / panel-mode toggle (⊞/◫)
- **Page info in chat** — after loading a page or clipboard, the source title and URL appear inside the message area above the quick questions
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

1. Open the side panel (click the extension icon).
2. Enter your API key when prompted (first launch only) — either an ExpertGPT `pak_...` key or a GNAI key.
3. The model list loads automatically based on your key type.
4. Select a model from the header dropdown.
5. Optionally click **Load Page** or **Load Clipboard** to add context.
6. Use **Quick Questions** for one-click summaries after loading content.
7. Use **Saved Prompts** to store and reuse common prompts.
8. Ask questions normally in the chat box.
9. To switch to floating popup mode, click **⊞** at the right end of the header; click **◫** inside the popup to switch back.
10. Click **💾** to save the current conversation as a Markdown file. If you press **Clear** before saving, you will be asked whether to save first.

## Delivery Notes

- Manifest is MV3 and uses `<all_urls>` host permission so Load Page can extract content from arbitrary websites.
- API key is stored in `chrome.storage.local`. ExpertGPT keys are validated as `pak_` + length > 8; GNAI keys accept any non-empty string.
- For ExpertGPT keys, per-model quota is fetched from `/v1/quota` and shown in the selector. GNAI keys skip this step.
- Anthropic models always route to the Anthropic-format endpoint (`/v1/messages`); OpenAI-compatible models route to `/chat/completions`.
- Legacy `apiKeys[]` data is auto-migrated to single-key mode at startup.
- **Panel mode** is stored in `chrome.storage.local` as `panelMode` (`"sidepanel"` or `"popup"`). The service worker caches it in memory (`_cachedMode`) so the `chrome.action.onClicked` handler never needs an async call before `sidePanel.open()`.
- **Popup mode** uses `chrome.windows.create({ type: "popup", width: 640, height: 600 })` — a real browser window that can be moved and resized by the OS natively. Re-clicking the extension icon focuses the existing popup instead of opening a second one.
- **Load Page** queries active tabs across all windows and skips extension-origin URLs, so it works correctly in both sidepanel and popup modes.
- **Save Session** uses `chrome.downloads.download` with `saveAs: true` to open the OS file-picker. The default filename is `<ISO-timestamp>.md`. The `downloads` permission is declared in `manifest.json`. `state.sessionSaved` is reset to `false` after every new assistant reply and set to `true` after a successful download; `clearConversation` checks this flag before discarding messages.

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
6. Verify `Load Page` and `Load Clipboard` both produce context-aware answers (test in both sidepanel and popup modes).
7. Verify Saved Prompts add/delete/use flows.
8. Verify panel-mode toggle: sidepanel → popup (⊞) opens floating window and closes sidepanel; popup → sidepanel (◫) opens sidepanel and closes popup.
9. Verify markdown rendering: bold, italic, headings, lists, code blocks, tables all render correctly in assistant replies.
10. Verify Save Session: click 💾, confirm "Save As" dialog appears; verify the saved `.md` file contains the conversation in Markdown format.
11. Verify Clear guard: start a chat without saving, click Clear → confirm prompt appears; choose Save → file picker opens; after dismissing, conversation clears.
12. Re-check extension permissions in `chrome://extensions` before packaging.

## Files

- `manifest.json`: extension manifest (MV3); permissions include `sidePanel`, `windows`, `activeTab`, `scripting`, `storage`, `clipboardRead`, `downloads`
- `background.js`: service worker — API bridge; routes requests to ExpertGPT or GNAI endpoints; handles `SET_PANEL_MODE` (creates popup window or opens sidepanel); caches `_cachedMode` and `_cachedSrcWindowId` for gesture-safe `sidePanel.open()` calls
- `sidepanel.html`: UI structure and CSS for both sidepanel and popup modes
- `sidepanel.js`: all UI logic — chat, markdown rendering (`renderMarkdown`), API key modal/validation, model list rendering (with/without quota), quick questions, saved prompts, panel-mode toggle, i18n
- `options.html`: static info page
