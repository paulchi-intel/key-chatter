# Key Chatter

Chrome extension supporting both ExpertGPT and GNAI API keys, with a side panel and a floating popup window mode.

## GitHub Description

Key Chatter is a Chrome extension supporting ExpertGPT and GNAI APIs, with multi-tab conversations, webpage/clipboard context chat, OpenAI + Anthropic model selection, built-in multilingual prompts, and a switchable side panel / floating popup UI.

## Features

- **Dual display mode** — toggle between side panel (anchored to the browser) and a floating popup window (movable and resizable by the OS) using the ⊞/◫ button at the far right of the header; preference is persisted across sessions
- **Multi-tab conversations** — run multiple independent chats simultaneously; click **+** in the tab bar to open a new tab, × to close one; each tab has its own message history, loaded page/clipboard content, and model selection; tabs are labelled by page title, "Clipboard", or "empty"; state is fully persisted across sessions via `chrome.storage.local`
- **Markdown rendering** — assistant replies render bold, italic, headings, bullet/numbered lists, inline code, fenced code blocks, and tables; blank lines and list spacing are kept minimal
- **Dual API key support** — accepts both ExpertGPT (`pak_...`) and GNAI keys; the model list and chat endpoint are automatically routed based on the key type
- **Model selector** — groups shown as `--- OpenAI ---` and `--- Anthropic ---`
  - **ExpertGPT key**: models fetched dynamically from the API; quota displayed as `(used/limit)` per model
  - **GNAI key**: fixed model list (no quota display); OpenAI models: `gpt-4o`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`, `o3-mini`; Anthropic models: `claude-4-6-opus`, `claude-4-6-sonnet`, `claude-4-5-opus`, `claude-4-5-sonnet`, `claude-4-5-haiku`
- **Automatic endpoint routing** — Anthropic models route to the Anthropic endpoint; OpenAI-compatible models route to the OpenAI endpoint; each key type uses its own base URL
- **Save Session** — click the 💾 button to download the current tab's conversation as a Markdown file (`.md`); the OS "Save As" dialog opens so you can choose the destination (e.g. `Documents\key-chatter-report`); if you click **Clear** (or close a tab) without having saved, a **Yes / No / Cancel** in-page dialog appears — **Yes** saves then clears, **No** clears without saving, **Cancel** aborts the action entirely; cancelling the OS file picker is also detected and handled gracefully
- **Header controls** — Clear / 💾 Save / Load Page / Load Clipboard / model dropdown / language selector (繁/簡/En) / panel-mode toggle (⊞/◫)
- **YouTube transcript loading** — on a YouTube video page, clicking **Load Page** automatically detects and loads the video's transcript. The extension first tries to extract caption track URLs directly from the page, then opens YouTube's built-in transcript panel via DOM automation and scrapes the segments. If the transcript loads successfully, status shows "YouTube 字幕已載入" and a collapsible **▶ 顯示字幕** toggle appears under the page-info block, showing all transcript lines (with `[mm:ss]` timestamps) in a scrollable dark panel; up to **200,000 characters** (~3+ hours of video) are retained. If the video has no transcript, status shows a distinct "未提供字幕" message and falls back to regular page text.
- **Page info in chat** — after loading a page or clipboard, the source title and URL appear inside the message area above the quick questions
- **Quick Questions** — appears after loading page/clipboard content; one-click summary templates; correctly restored when switching back to a tab that has content loaded
- **Saved Prompts** — manage reusable prompt snippets, accessible from the chat panel
- **i18n** — full UI in Traditional Chinese, Simplified Chinese, and English; button tooltips (`title` attributes) also update with the selected language via `data-i18n-title`; the language selector shows native script for each option (繁 / 简 / En)
- **Reliability guards** — request timeouts, explicit background/runtime error handling, and async response routing so replies always land in the correct tab even if you switch tabs while waiting

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
9. Click **+** in the tab bar to start a new independent conversation; click a tab to switch between them; click × on a tab to close it.
10. To switch to floating popup mode, click **⊞** at the right end of the header; click **◫** inside the popup to switch back.
11. Click **💾** to save the current tab's conversation as a Markdown file. If you press **Clear** before saving, you will be asked whether to save first.

## Delivery Notes

- Manifest is MV3 and uses `<all_urls>` host permission so Load Page can extract content from arbitrary websites.
- API key is stored in `chrome.storage.local`. ExpertGPT keys are validated as `pak_` + length > 8; GNAI keys accept any non-empty string.
- For ExpertGPT keys, per-model quota is fetched from `/v1/quota` and shown in the selector. GNAI keys skip this step.
- Anthropic models always route to the Anthropic-format endpoint (`/v1/messages`); OpenAI-compatible models route to `/chat/completions`.
- Legacy `apiKeys[]` data is auto-migrated to single-key mode at startup.
- **Panel mode** is stored in `chrome.storage.local` as `panelMode` (`"sidepanel"` or `"popup"`). The service worker caches it in memory (`_cachedMode`) so the `chrome.action.onClicked` handler never needs an async call before `sidePanel.open()`.
- **Popup mode** uses `chrome.windows.create({ type: "popup", width: 640, height: 600 })` — a real browser window that can be moved and resized by the OS natively. Re-clicking the extension icon focuses the existing popup instead of opening a second one. When creating the popup, background embeds the source browser `windowId` as a URL query parameter (`?srcWindowId=N`). When the user clicks ◫ to switch back to sidepanel, `sidepanel.js` reads `POPUP_SRC_WINDOW_ID` synchronously from the URL and calls `chrome.sidePanel.open({ windowId })` **before any `await`** to preserve the user gesture context (Chrome requires `sidePanel.open()` to be called synchronously within a gesture handler; routing through the service worker loses the context).
- **Load Page** — in sidepanel mode uses `{ active: true, currentWindow: true }` to reliably get the tab in the current browser window; in popup mode queries `{ active: true, windowId: POPUP_SRC_WINDOW_ID }` to target exactly the browser window that spawned the popup (avoids picking up extension or wrong-window tabs), falling back to any non-extension active tab if needed. A `[KC] loadPageContent target tab:` log line records the resolved tab for diagnostics.
- **YouTube transcript extraction** uses a multi-step pipeline:
  1. *MAIN world injection* — reads `window.ytInitialPlayerResponse` or parses inline `<script>` tags for `captionTracks`.
  2. *HTML fetch fallback* — service worker fetches the YouTube page HTML and extracts `captionTracks` via bracket-depth counting (handles cases where `ytInitialPlayerResponse` is absent).
  3. *MAIN world transcript fetch* — passes caption track URLs as arguments to a second `executeScript` call that fetches the timedtext endpoint from within the page's JS context (same-origin + session cookies), trying JSON3 then XML format.
  4. *DOM scrape fallback* — if timedtext URLs return empty (YouTube's ASR captions require a Proof-of-Origin Token), the service worker first brings the YouTube window to the foreground (`chrome.windows.update({ focused: true })`) so Chrome stops throttling the tab's renderer; focus is restored to the popup/sidepanel window in a `finally` block. The injected script fires a full pointer-event sequence (`pointerdown → mousedown → pointerup → mouseup → click → .click()`) via a `fireClick()` helper — YouTube's Polymer/Lit elements often ignore a bare `.click()`. The button is scrolled into view before clicking. After clicking, the script polls for `ytd-transcript-segment-renderer` elements and falls back to the engagement-panel's `innerText`; mid-poll it forces `visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"` if the panel element exists but hasn't expanded. The body-`innerText` final fallback only counts if ≥ 500 chars (shorter text means the tab was still throttled). `isYouTubeTranscript: true` is only set when usable text is obtained. `dbg.steps` captures `panelExists:<visibility>`, `forcedExpand`, `finalPanel:<state>`, and `bodyTextTooShort:<n>` for diagnostics.
  5. *No-transcript flag* — if all steps fail, `isYouTubeNoTranscript: true` is set so the status bar shows a distinct message.
- Transcript text is capped at **200,000 characters** for YouTube pages (covering ~3+ hours) and **15,000 characters** for normal web pages. Both paths append `[... transcript truncated ...]` when the cap is hit.
- **Multi-tab state** is stored as `kc_tabs` (array of tab snapshots), `kc_active_tab_id`, and `kc_next_tab_id` in `chrome.storage.local`. Legacy single-tab storage keys are auto-migrated into `tabs[0]` on first load. Each tab carries its own `messages`, `pageContent`, `selectedModel`, and `sessionSaved` fields. A "state proxy" pattern keeps `state.*` in sync with the active tab; `commitActiveTab()` is called before every tab switch or save.
- **Tab labels** are derived from the loaded page title (truncated), "Clipboard" (for clipboard content), or "empty" (for a new or cleared tab). The label updates immediately when content is loaded or the tab is cleared, because `commitActiveTab()` is called before `renderTabBar()` in all relevant code paths.
- **Async response routing** — `sendMessage` captures `srcTabId` before the API call; if the user switches tabs during a request, the reply is stored directly into the source tab's `messages` array without touching the UI.
- **Unsaved-session guard** — when the user clicks **Clear** or the tab × button and the current tab has unsaved messages, a custom in-page **Yes / No / Cancel** modal (`confirmSaveModal`) is shown instead of the browser's native `confirm()` dialog. **Yes** calls `downloadSession()` then proceeds; **No** skips saving and proceeds; **Cancel** (or pressing Escape / clicking the backdrop) aborts with no changes. Button order left-to-right: Yes → No → Cancel.
- **Save Session** uses `chrome.downloads.download` with `saveAs: true` to open the OS file-picker. The default filename is `<ISO-timestamp>.md`. The `downloads` permission is declared in `manifest.json`. A `chrome.downloads.onChanged` listener detects whether the user completed or cancelled the save dialog; `state.sessionSaved` is set to `true` only on confirmed save and reset to `false` after every new assistant reply.
- **Clear with multi-tab** — if more than one tab is open, Clear closes the active tab instead of wiping it.

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
   - **YouTube transcript**: open a YouTube video with captions, click **Load Page** — status should show "YouTube 字幕已載入"; the page-info block should show a **▶ 顯示字幕** toggle that expands to a scrollable transcript panel.
   - **YouTube no-transcript**: open a YouTube video known to have no captions — status should show the "未提供字幕" distinct message.
   - **Re-load after closing panel**: manually close the YouTube transcript panel, click **Load Page** again — transcript should reload without toggling the panel off.
7. Verify Saved Prompts add/delete/use flows.
8. Verify panel-mode toggle: sidepanel → popup (⊞) opens floating window and closes sidepanel; popup → sidepanel (◫) opens sidepanel and closes popup **without** the `sidePanel.open() may only be called in response to a user gesture` error.
9. Verify markdown rendering: bold, italic, headings, lists, code blocks, tables all render correctly in assistant replies.
10. Verify Save Session: click 💾, confirm "Save As" dialog appears; verify the saved `.md` file contains the conversation in Markdown format; cancel the dialog and verify no "saved" status is shown.
11. Verify Clear guard: start a chat without saving, click Clear → **Yes/No/Cancel** in-page dialog appears; click **Cancel** → nothing happens; click **No** → conversation clears without saving; repeat and click **Yes** → file picker opens, then conversation clears. Also verify × on a tab triggers the same dialog.
12. **Multi-tab**: click + to open a second tab; load a different page; verify each tab keeps its own history and label; close a tab with × and confirm the adjacent tab becomes active; reload the extension and confirm tab state is restored; click **Clear** on a tab with content and verify the tab label immediately changes to "empty".
13. Verify async routing: start a slow request, switch tabs while waiting — the reply should land in the originating tab, not the active one.
14. Re-check extension permissions in `chrome://extensions` before packaging.

## Files

- `manifest.json`: extension manifest (MV3); permissions include `sidePanel`, `windows`, `activeTab`, `scripting`, `storage`, `clipboardRead`, `downloads`
- `background.js`: service worker — API bridge; routes requests to ExpertGPT or GNAI endpoints; handles `SET_PANEL_MODE` (creates popup window or opens sidepanel); caches `_cachedMode` and `_cachedSrcWindowId` for gesture-safe `sidePanel.open()` calls
- `sidepanel.html`: UI structure and CSS for both sidepanel and popup modes; layout order: header-bar → status-bar → tab-bar → chat-container
- `sidepanel.js`: all UI logic — multi-tab management (`addTab`, `switchTab`, `closeTab`, `renderTabBar`, `commitActiveTab`), chat, markdown rendering (`renderMarkdown`), API key modal/validation, model list rendering (with/without quota), quick questions, saved prompts, panel-mode toggle, save session (`buildSessionMarkdown`, `downloadSession`), unsaved-session guard (`showConfirmSaveDialog`), i18n
- `options.html`: static info page
