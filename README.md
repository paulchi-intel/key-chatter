# Key Chatter

Key Chatter is a Chrome extension for chatting with ExpertGPT and GNAI from a side panel or floating popup. It supports multiple conversations, webpage and clipboard context, OpenAI and Anthropic models, and Traditional Chinese, Simplified Chinese, and English.

## Features

- ExpertGPT (`pak_...`) and GNAI API keys
- Side-panel and floating-popup modes
- Multiple persistent conversation tabs
- OpenAI and Anthropic model selection
- Webpage, clipboard, and YouTube transcript loading
- Markdown responses, reusable prompts, and Markdown session export
- Per-model ExpertGPT quota display
- Automatic update notifications from GitHub Releases

## Install

1. Download the latest ZIP from [GitHub Releases](https://github.com/paulchi-intel/key-chatter/releases/latest).
2. Extract it to a permanent folder.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Select **Load unpacked** and choose the extracted folder.
5. Click the Key Chatter extension icon to begin.

No API key is bundled. Enter one when prompted:

| Service | Key format | Get a key |
|---|---|---|
| ExpertGPT | Starts with `pak_` | [ExpertGPT profile](https://expertgpt.intel.com/my_profile) |
| GNAI | Any other non-empty key | [GNAI](https://gnai.intel.com/auth/oauth2/sso/) |

Click **🔑 Key Chatter** in the header to change the key later.

## Use

1. Select a model from the header.
2. Optionally load the current webpage or clipboard as context.
3. Ask a question or use a saved prompt or quick question.
4. Use **+** to create another conversation tab.
5. Use **⊞/◫** to switch between side-panel and popup modes.
6. Use **💾** to export the active conversation as Markdown.

For GNAI keys, choose **Verify supported models…** from the model selector to probe which models the current key can use. Key Chatter first reads the current GNAI model source, falls back to the authenticated provider model APIs when the page is dynamically rendered, and saves the successful verification results for later sessions.

## Models

- **ExpertGPT:** models are loaded dynamically; available quota is shown as `(used/limit)`.
- **GNAI:** models are loaded from GNAI when available, with a built-in fallback list if discovery fails.
- Anthropic models use the Anthropic Messages endpoint; other chat models use the OpenAI-compatible Chat Completions endpoint.

## Update

Key Chatter checks the latest GitHub Release at startup and caches the result for six hours. When a newer version is available, an update banner links to the download.

To update an unpacked installation, replace the extension files with the contents of the latest ZIP, then click **Reload** in `chrome://extensions`. Conversations and settings remain in `chrome.storage.local`.

## Release

1. Update `version` in `manifest.json` and commit it.
2. Create and push a matching tag such as `vX.Y.Z`.
3. GitHub Actions validates the version and JavaScript, then publishes the ZIP and SHA-256 checksum.

Before publishing, verify both key types, OpenAI and Anthropic chat, model verification, all three languages, context loading, popup/side-panel switching, session export, and update notification behavior.

## Project files

- `manifest.json` — Chrome MV3 manifest
- `background.js` — API routing, model verification, page extraction, and update checks
- `sidepanel.html` — side-panel and popup interface
- `sidepanel.js` — conversations, model selector, storage, rendering, and localization
- `options.html` — extension information page
- `.github/workflows/release.yml` — tagged-release packaging workflow

## License

See [LICENSE](LICENSE).
