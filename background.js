// background.js (service worker, MV3)
// ExpertGPT API bridge for chat + personal quota

const OPENAI_BASE_URL = "https://expertgpt.intel.com/v1";
const ANTHROPIC_BASE_URL = "https://expertgpt.intel.com/anthropic/v1";
const GNAI_OPENAI_BASE_URL = "https://gnai.intel.com/api/providers/openai/v1";
const GNAI_ANTHROPIC_BASE_URL = "https://gnai.intel.com/api/providers/anthropic";
const REQUEST_TIMEOUT_MS = 30000;

const GNAI_OPENAI_MODELS = ["gpt-4o", "gpt-4.1", "gpt-5-mini", "gpt-5-nano", "o3-mini"];
const GNAI_ANTHROPIC_MODELS = ["claude-4-6-opus", "claude-4-6-sonnet", "claude-4-5-opus", "claude-4-5-sonnet", "claude-4-5-haiku"];

function isGnaiKey(apiKey) {
  return typeof apiKey === "string" && apiKey.length > 0 && !apiKey.startsWith("pak_");
}

function isAnthropicModel(model) {
  return typeof model === "string" && model.toLowerCase().startsWith("claude");
}

const MESSAGE_TYPES = {
  GET_MODELS: "GET_MODELS",
  GET_PAGE_CONTENT: "GET_PAGE_CONTENT",
  CHAT: "CHAT",
  GET_QUOTA: "GET_QUOTA",
  SET_PANEL_MODE: "SET_PANEL_MODE"
};

const SYSTEM_PROMPTS = {
  "zh-TW": "你是一位友善且樂於助人的 AI 助理。請使用繁體中文回答，內容清楚、精準、可執行。",
  "zh-CN": "你是一位友善且乐于助人的 AI 助理。请使用简体中文回答，内容清晰、准确、可执行。",
  "en": "You are a friendly and helpful AI assistant. Answer clearly, accurately, and with actionable details."
};

// Track the popup window so we can focus it instead of creating a duplicate
let _bgPopupWindowId = null;
chrome.windows.onRemoved.addListener(id => {
  if (id === _bgPopupWindowId) _bgPopupWindowId = null;
});

// Cache mode + source window in memory so onClicked never needs an await
// (sidePanel.open must be called synchronously in the user-gesture handler)
let _cachedMode = "sidepanel";
let _cachedSrcWindowId = null;

async function openPopupWindow(srcWindowId = null) {
  if (_bgPopupWindowId !== null) {
    try {
      await chrome.windows.update(_bgPopupWindowId, { focused: true });
      return;
    } catch (e) {
      _bgPopupWindowId = null;
    }
  }
  // Embed srcWindowId in the URL so sidepanel.js can call sidePanel.open() in-gesture
  const resolvedSrcWindowId = srcWindowId
    || (await chrome.windows.getLastFocused({ windowTypes: ["normal"] }).catch(() => null))?.id;
  const baseUrl = chrome.runtime.getURL("sidepanel.html");
  const url = resolvedSrcWindowId ? `${baseUrl}?srcWindowId=${resolvedSrcWindowId}` : baseUrl;
  const win = await chrome.windows.create({
    url,
    type: "popup",
    width: 640,
    height: 600
  });
  _bgPopupWindowId = win.id;
}

async function applyPanelMode(_mode) {
  // Always keep action popup empty; opening is handled by onClicked / openPopupWindow
  await chrome.action.setPopup({ popup: "" });
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(["panelMode"]);
  _cachedMode = stored.panelMode || "sidepanel";
  await applyPanelMode(_cachedMode);
});

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get(["panelMode"]);
  _cachedMode = stored.panelMode || "sidepanel";
  await applyPanelMode(_cachedMode);
});

// onClicked must NOT await before calling sidePanel.open — use cached mode.
chrome.action.onClicked.addListener((tab) => {
  _cachedSrcWindowId = tab.windowId;  // remember for SET_PANEL_MODE sidepanel switch
  if (_cachedMode === "popup") {
    openPopupWindow(tab.windowId);
  } else {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Extract captionTracks array from an HTML/JS text blob using bracket-depth counting
function _extractCaptionTracksFromText(text) {
  const ctIdx = text.indexOf('"captionTracks":');
  if (ctIdx === -1) return null;
  const arrayStart = text.indexOf('[', ctIdx);
  if (arrayStart === -1) return null;
  let depth = 0, end = -1;
  for (let i = arrayStart; i < text.length && end === -1; i++) {
    const c = text[i];
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) end = i + 1; }
  }
  if (end === -1) return null;
  try {
    const parsed = JSON.parse(text.substring(arrayStart, end));
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(t => ({ baseUrl: t.baseUrl, languageCode: t.languageCode, kind: t.kind || "" }));
    }
  } catch (_) {}
  return null;
}

async function getPageContent(tabId) {
  // Step 1: Get URL + title via MAIN world; also try ytInitialPlayerResponse + script tags
  const [{ result: pageInfo }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      const url   = window.location.href || "";
      const title = document.title || "";
      let captionTracks = null;
      if (/youtube\.com\/watch/.test(url)) {
        try {
          // Primary: window.ytInitialPlayerResponse
          let tracks = window.ytInitialPlayerResponse
            ?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          // Secondary: inline <script> tags
          if (!Array.isArray(tracks) || tracks.length === 0) {
            for (const s of document.scripts) {
              if (s.src || !s.textContent.includes('"captionTracks"')) continue;
              const idx = s.textContent.indexOf('"captionTracks":');
              if (idx === -1) continue;
              const bs = s.textContent.indexOf('[', idx);
              if (bs === -1) continue;
              let d = 0, e2 = -1;
              for (let i = bs; i < s.textContent.length && e2 === -1; i++) {
                const c = s.textContent[i];
                if (c === '[' || c === '{') d++;
                else if (c === ']' || c === '}') { d--; if (d === 0) e2 = i + 1; }
              }
              if (e2 !== -1) {
                try { tracks = JSON.parse(s.textContent.substring(bs, e2)); } catch (_) {}
                if (Array.isArray(tracks) && tracks.length) break;
              }
            }
          }
          if (Array.isArray(tracks) && tracks.length > 0) {
            captionTracks = tracks.map(t => ({
              baseUrl: t.baseUrl, languageCode: t.languageCode, kind: t.kind || ""
            }));
          }
        } catch (_) {}
      }
      return { url, title, captionTracks };
    }
  });

  let captionTracks = pageInfo?.captionTracks ?? null;
  const isYouTube = /youtube\.com\/watch/.test(pageInfo?.url || "");

  // Step 1b: HTML fetch fallback — service worker fetches the page directly and parses captionTracks
  // (handles cases where ytInitialPlayerResponse is not accessible via script injection)
  if (isYouTube && (!Array.isArray(captionTracks) || captionTracks.length === 0)) {
    console.log('[KC] MAIN world found no captionTracks — trying HTML fetch fallback');
    try {
      const pageResp = await fetch(pageInfo.url, { credentials: "include" });
      if (pageResp.ok) {
        const html = await pageResp.text();
        const found = _extractCaptionTracksFromText(html);
        if (found) {
          captionTracks = found;
          console.log('[KC] captionTracks from HTML fetch:', captionTracks.length, 'tracks');
        } else {
          console.log('[KC] No captionTracks in HTML (video may have no captions)');
        }
      }
    } catch (e) {
      console.error('[KC] HTML fetch error:', e);
    }
  }

  // Step 2: Fetch transcript from WITHIN the page (MAIN world) so it runs with
  // YouTube's own cookies and same-origin policy — service-worker fetch lacks these.
  if (Array.isArray(captionTracks) && captionTracks.length > 0) {
    try {
      const [{ result: transcriptResult }] = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: async (tracksJson) => {
          const dbg = { steps: [] };
          try {
            let tracks = JSON.parse(tracksJson);

            // Refresh captionTracks from inside the page — service-worker-fetched HTML
            // often has unsigned/stale URLs. The page's own same-origin fetch gets fresh ones.
            try {
              const pageResp = await fetch(window.location.href, { credentials: "include" });
              dbg.steps.push(`pageFetch:${pageResp.status}`);
              if (pageResp.ok) {
                const html = await pageResp.text();
                dbg.steps.push(`htmlLen:${html.length}`);
                const idx = html.indexOf('"captionTracks":');
                if (idx !== -1) {
                  const bs = html.indexOf('[', idx);
                  let d = 0, end = -1;
                  for (let i = bs; i < html.length && end === -1; i++) {
                    const c = html[i];
                    if (c === '[' || c === '{') d++;
                    else if (c === ']' || c === '}') { d--; if (d === 0) end = i + 1; }
                  }
                  if (end !== -1) {
                    try {
                      const fresh = JSON.parse(html.substring(bs, end));
                      if (Array.isArray(fresh) && fresh.length) {
                        tracks = fresh.map(t => ({
                          baseUrl: t.baseUrl, languageCode: t.languageCode, kind: t.kind || ""
                        }));
                        dbg.steps.push(`freshTracks:${tracks.length}`);
                      }
                    } catch (_) {}
                  }
                }
              }
            } catch (e) { dbg.steps.push(`pageFetchErr:${e.message}`); }

            const manual = tracks.filter(t => t.kind !== "asr");
            const pool   = manual.length ? manual : tracks;
            const pick   = pool.find(t => /^zh/.test(t.languageCode))
                        || pool.find(t => t.languageCode === "en")
                        || pool[0];
            if (!pick?.baseUrl) return { dbg, error: "no pick" };

            dbg.lang = pick.languageCode;
            dbg.baseUrlPrefix = pick.baseUrl.substring(0, 100);

            let base = pick.baseUrl;
            if (!/[?&]lang=/.test(base)) base += `&lang=${pick.languageCode}`;

            // Attempt JSON3
            try {
              const u = /[?&]fmt=/.test(base) ? base : base + "&fmt=json3";
              const r = await fetch(u);
              const raw = await r.text();
              dbg.steps.push(`json3:${r.status}/${r.headers.get('content-type')}/${raw.length}`);
              if (r.ok && raw.trimStart().startsWith("{")) {
                const data = JSON.parse(raw);
                const lines = (data.events || [])
                  .filter(e => e.segs)
                  .map(e => e.segs.map(s => (s.utf8 || "").replace(/\n/g, " ")).join(""))
                  .filter(Boolean);
                const text = lines.join("\n").trim();
                if (text) return { text, lang: pick.languageCode, dbg };
              }
            } catch (e) { dbg.steps.push(`json3Err:${e.message}`); }

            // Attempt XML
            try {
              const u = base.replace(/[?&]fmt=[^&]*/g, "");
              const r = await fetch(u);
              const raw = await r.text();
              dbg.steps.push(`xml:${r.status}/${r.headers.get('content-type')}/${raw.length}`);
              if (r.ok && raw.includes("<text")) {
                const lines = [];
                const rx = /<text[^>]*>([\s\S]*?)<\/text>/g;
                let m;
                while ((m = rx.exec(raw)) !== null) {
                  const seg = m[1]
                    .replace(/<[^>]+>/g, "")
                    .replace(/&#39;/g, "'").replace(/&amp;/g, "&")
                    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                    .replace(/\n/g, " ").trim();
                  if (seg) lines.push(seg);
                }
                const text = lines.join("\n").trim();
                if (text) return { text, lang: pick.languageCode, dbg };
              }
            } catch (e) { dbg.steps.push(`xmlErr:${e.message}`); }

            return { dbg, error: "no transcript text" };
          } catch (e) {
            dbg.fatal = e.message;
            return { dbg, error: e.message };
          }
        },
        args: [JSON.stringify(captionTracks)]
      });

      console.log('[KC] MAIN world transcript result:', transcriptResult);

      if (transcriptResult?.text) {
        const maxLen = 15000;
        const text = transcriptResult.text;
        return {
          text: text.length > maxLen
            ? text.slice(0, maxLen) + "\n\n[... transcript truncated ...]"
            : text,
          title: pageInfo.title,
          url: pageInfo.url,
          isYouTubeTranscript: true,
          transcriptLang: transcriptResult.lang
        };
      }
    } catch (e) {
      console.error("[KC] MAIN world transcript fetch error:", e);
    }
  }

  // Step 2b: Last-resort fallback — open YouTube's own transcript panel via DOM
  // and scrape the segment text. Works even for ASR/signed-URL cases.
  if (isYouTube) {
    // In popup mode the extension popup window may occlude the YouTube tab,
    // causing Chrome to throttle the tab's rendering and ignore programmatic
    // clicks. Briefly bring the YouTube window to the foreground (we restore
    // the previously focused window afterwards so the user's popup/sidepanel
    // doesn't lose context).
    let prevFocusedWindowId = null;
    let ytWindowId = null;
    try {
      const tabInfo = await chrome.tabs.get(tabId);
      ytWindowId = tabInfo?.windowId ?? null;
      const focused = await chrome.windows.getLastFocused({ populate: false }).catch(() => null);
      prevFocusedWindowId = focused?.id ?? null;
      if (ytWindowId && ytWindowId !== prevFocusedWindowId) {
        await chrome.windows.update(ytWindowId, { focused: true }).catch(() => {});
        // Give the renderer a moment to un-throttle.
        await new Promise(r => setTimeout(r, 250));
      }
    } catch (e) {
      console.log("[KC] focus pre-step failed:", e?.message || e);
    }

    try {
      console.log("[KC] trying DOM transcript scrape");
      const [{ result: domResult }] = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: async () => {
          const sleep = ms => new Promise(r => setTimeout(r, ms));
          const dbg = { steps: [] };

          // Selectors for the transcript engagement panel
          const PANEL_SELECTOR =
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]';
          const SEG_SELECTORS = [
            "ytd-transcript-segment-renderer .segment-text",
            "ytd-transcript-segment-renderer yt-formatted-string.segment-text",
            "ytd-transcript-segment-renderer div.segment-text",
            "ytd-transcript-segment-renderer"
          ];

          // Check if the transcript panel is already open and populated
          const isPanelVisible = () => {
            const p = document.querySelector(PANEL_SELECTOR);
            if (!p) return false;
            const vis = p.getAttribute("visibility");
            // Newer YT uses visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"
            if (vis && /EXPANDED/i.test(vis)) return true;
            // Fallback: check if rendered (has size)
            const rect = p.getBoundingClientRect();
            return rect.height > 50 && rect.width > 50;
          };

          const collectSegments = () => {
            // Prefer the segment-renderer element itself so we can pull both
            // timestamp and text from each segment.
            const renderers = document.querySelectorAll("ytd-transcript-segment-renderer");
            if (renderers.length > 0) {
              return { segs: renderers, sel: "ytd-transcript-segment-renderer", structured: true };
            }
            for (const sel of SEG_SELECTORS) {
              const found = document.querySelectorAll(sel);
              if (found.length > 0) return { segs: found, sel, structured: false };
            }
            return { segs: [], sel: "", structured: false };
          };

          const extractText = () => {
            const { segs, sel, structured } = collectSegments();
            if (segs.length > 0) {
              const lines = [...segs].map(s => {
                if (structured) {
                  // Pull "[mm:ss] text" pairs from each segment renderer
                  const tsEl =
                    s.querySelector(".segment-timestamp, div.segment-timestamp") ||
                    s.querySelector('[class*="timestamp"]');
                  const txtEl =
                    s.querySelector(".segment-text, yt-formatted-string.segment-text, div.segment-text") ||
                    s.querySelector('[class*="segment-text"]');
                  const ts = (tsEl?.textContent || "").trim();
                  const txt = (txtEl?.textContent || s.textContent || "").trim();
                  if (!txt) return "";
                  return ts ? `[${ts}] ${txt}` : txt;
                }
                return (s.textContent || "").trim();
              }).filter(Boolean);
              if (lines.length > 0) return { text: lines.join("\n"), via: `segs:${sel}` };
            }
            // Panel-level fallback
            const panel = document.querySelector(PANEL_SELECTOR);
            if (panel) {
              const txt = (panel.innerText || "")
                .split("\n").map(l => l.trim())
                .filter(l => l && !/^transcript$/i.test(l) && !/^search$/i.test(l)
                          && !/^\u5b57\u5e55$|^\u6587\u5b57\u8a18\u9304$/.test(l))
                .join("\n");
              if (txt.length > 50) return { text: txt, via: "panelInnerText" };
            }
            return { text: "", via: "" };
          };

          // If panel already open, just scrape immediately
          if (isPanelVisible()) {
            dbg.steps.push("alreadyOpen");
            // wait a tick in case content needs to render
            for (let i = 0; i < 10; i++) {
              const r = extractText();
              if (r.text) { dbg.steps.push(r.via); return { text: r.text, lang: "", dbg }; }
              await sleep(150);
            }
          }

          // Otherwise, find and click the "Show transcript" button.

          // YouTube's Polymer/lit elements often ignore bare .click() — dispatch a
          // full pointer/mouse sequence to better simulate a real user click.
          const fireClick = (el) => {
            const opts = { bubbles: true, cancelable: true, composed: true, view: window, button: 0 };
            try { el.dispatchEvent(new PointerEvent("pointerdown", opts)); } catch {}
            try { el.dispatchEvent(new MouseEvent("mousedown", opts)); } catch {}
            try { el.dispatchEvent(new PointerEvent("pointerup", opts)); } catch {}
            try { el.dispatchEvent(new MouseEvent("mouseup", opts)); } catch {}
            try { el.dispatchEvent(new MouseEvent("click", opts)); } catch {}
            try { if (typeof el.click === "function") el.click(); } catch {}
          };

          // Try description-area button first (most reliable on modern desktop YT)
          const tryClickButton = async () => {
            // Expand description if collapsed
            const expand = document.querySelector("#expand, tp-yt-paper-button#expand");
            if (expand && expand.offsetParent !== null) {
              fireClick(expand);
              dbg.steps.push("expanded");
              await sleep(500);
            }

            // Specific button in description's transcript section
            const inDescBtn = document.querySelector(
              "ytd-video-description-transcript-section-renderer button, " +
              "ytd-video-description-transcript-section-renderer yt-button-shape button"
            );
            if (inDescBtn) {
              // scroll into view so click event geometry is valid
              try { inDescBtn.scrollIntoView({ block: "center" }); } catch {}
              fireClick(inDescBtn);
              dbg.steps.push("descBtnClicked");
              return true;
            }

            // Broader search: any button matching transcript label, but EXCLUDE
            // "hide" labels so we don't toggle off an already-open panel.
            const showRe = /(show transcript|\u986f\u793a\u5b57\u5e55|\u663e\u793a\u5b57\u5e55|\u986f\u793a\u6587\u5b57\u8a18\u9304|\u663e\u793a\u6587\u5b57\u8bb0\u5f55|show full transcript)/i;
            const hideRe = /(hide transcript|\u96b1\u85cf\u5b57\u5e55|\u9690\u85cf\u5b57\u5e55)/i;
            const candidates = document.querySelectorAll(
              "button, tp-yt-paper-button, yt-button-shape, ytd-button-renderer, " +
              "ytd-menu-service-item-renderer, tp-yt-paper-item"
            );
            for (const el of candidates) {
              const label = (el.getAttribute("aria-label") || "") + " " + (el.textContent || "");
              if (hideRe.test(label)) continue;
              if (showRe.test(label)) {
                try { el.scrollIntoView({ block: "center" }); } catch {}
                fireClick(el);
                dbg.steps.push("genericBtnClicked");
                return true;
              }
            }

            // Try "..." menu (More actions)
            const moreBtn = document.querySelector(
              "ytd-watch-metadata #button-shape > button, " +
              "ytd-menu-renderer #button button"
            );
            if (moreBtn) {
              fireClick(moreBtn);
              dbg.steps.push("moreClicked");
              await sleep(500);
              for (const el of document.querySelectorAll(
                "tp-yt-paper-item, ytd-menu-service-item-renderer"
              )) {
                const label = (el.getAttribute("aria-label") || "") + " " + (el.textContent || "");
                if (showRe.test(label)) {
                  fireClick(el);
                  dbg.steps.push("menuItemClicked");
                  return true;
                }
              }
            }
            return false;
          };

          const clicked = await tryClickButton();
          if (!clicked) { dbg.steps.push("noBtn"); return { dbg, error: "transcript button not found" }; }

          // Poll for panel + content. Also try to force panel visibility if it
          // exists in DOM but didn't expand (some YT builds need the attribute).
          let forcedVisibility = false;
          for (let i = 0; i < 60; i++) {
            await sleep(200);
            const r = extractText();
            if (r.text) { dbg.steps.push(r.via); return { text: r.text, lang: "", dbg }; }

            // Half-way through, try forcing the panel to expand
            if (i === 15 && !forcedVisibility) {
              const panel = document.querySelector(PANEL_SELECTOR);
              if (panel) {
                const v = panel.getAttribute("visibility") || "";
                dbg.steps.push("panelExists:" + v);
                if (!/EXPANDED/i.test(v)) {
                  try {
                    panel.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED");
                    dbg.steps.push("forcedExpand");
                    forcedVisibility = true;
                  } catch {}
                }
              } else {
                dbg.steps.push("panelMissingAt3s");
              }
            }
          }

          // Final fallback: button was clicked successfully, so the transcript panel
          // should have opened. Even if our selectors didn't match, the page's
          // innerText now includes the transcript content — return it and mark as
          // a successful transcript load.
          dbg.steps.push("clickedButSelectorMissed");
          // Record final panel state for diagnostics
          const finalPanel = document.querySelector(PANEL_SELECTOR);
          dbg.steps.push("finalPanel:" + (finalPanel ? (finalPanel.getAttribute("visibility") || "noVisAttr") : "missing"));
          const bodyText = (document.body?.innerText || "").trim();
          // Quality check: a real transcript-bearing body has substantial text.
          // Tiny snippets like "Sign in\n0:10 / 7:39\nGoogle" mean the panel
          // never actually opened (likely due to tab being throttled/occluded).
          if (bodyText.length >= 500) {
            return { text: bodyText, lang: "", dbg, fromBodyInnerText: true };
          }
          dbg.steps.push("bodyTextTooShort:" + bodyText.length);
          return { dbg, error: "panel did not open after click" };
        }
      });

      console.log("[KC] DOM transcript result:", domResult);

      if (domResult?.text) {
        const maxLen = 15000;
        const text = domResult.text;
        return {
          text: text.length > maxLen
            ? text.slice(0, maxLen) + "\n\n[... transcript truncated ...]"
            : text,
          title: pageInfo.title,
          url: pageInfo.url,
          isYouTubeTranscript: true,
          transcriptLang: domResult.lang || "auto"
        };
      }
    } catch (e) {
      console.error("[KC] DOM transcript error:", e);
    } finally {
      // Restore focus to whatever window was focused before (popup/sidepanel host)
      if (prevFocusedWindowId && ytWindowId && prevFocusedWindowId !== ytWindowId) {
        chrome.windows.update(prevFocusedWindowId, { focused: true }).catch(() => {});
      }
    }
  }

  // Step 3: Normal page content extraction (ISOLATED world, sync)
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      let text = document.body ? document.body.innerText || "" : "";
      const title = document.title || "";
      const url   = window.location.href || "";
      const maxLen = 15000;
      if (text.length > maxLen) {
        text = `${text.slice(0, maxLen)}\n\n[... content truncated ...]`;
      }
      return { text, title, url };
    }
  });

  // If we're on a YouTube watch page but never got transcript text,
  // flag it so the UI can show a distinct "no transcript available" message.
  if (isYouTube && result) {
    result.isYouTubeNoTranscript = true;
  }

  return result;
}

function isValidApiKey(apiKey) {
  if (typeof apiKey !== "string" || !apiKey.trim()) return false;
  if (apiKey.startsWith("pak_")) return apiKey.length > 8;
  return apiKey.length > 0;
}

function assertApiKey(apiKey) {
  if (!isValidApiKey(apiKey)) {
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
  if (isGnaiKey(apiKey)) {
    try {
      const data = await fetchJson(GNAI_OPENAI_BASE_URL, "/models", apiKey);
      const models = (data.data || [])
        .map((m) => String(m?.id || "").trim())
        .filter(Boolean);
      if (models.length > 0) return models;
    } catch (_err) {
      // fall back to hardcoded list
    }
    return GNAI_OPENAI_MODELS;
  }
  assertApiKey(apiKey);
  const data = await fetchJson(OPENAI_BASE_URL, "/models", apiKey);
  return (data.data || [])
    .map((m) => String(m?.id || "").trim())
    .filter(Boolean);
}

async function fetchAnthropicModels(apiKey) {
  if (isGnaiKey(apiKey)) {
    try {
      const data = await fetchJson(GNAI_ANTHROPIC_BASE_URL, "/v1/models", apiKey);
      const models = (data.data || [])
        .map((m) => String(m?.id || "").trim())
        .filter(Boolean);
      if (models.length > 0) return models;
    } catch (_err) {
      // fall back to hardcoded list
    }
    return GNAI_ANTHROPIC_MODELS;
  }
  assertApiKey(apiKey);
  const data = await fetchJson(ANTHROPIC_BASE_URL, "/models", apiKey);
  return (data.data || [])
    .map((m) => String(m?.id || "").trim())
    .filter(Boolean);
}

async function callExpertGPT(messages, language, apiKey, model) {
  assertApiKey(apiKey);
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS["zh-TW"];
  const selectedModel = model || "gpt-4.1-mini";

  if (isAnthropicModel(selectedModel)) {
    const anthropicBase = isGnaiKey(apiKey) ? GNAI_ANTHROPIC_BASE_URL : ANTHROPIC_BASE_URL;
    const anthropicPath = isGnaiKey(apiKey) ? "/v1/messages" : "/messages";
    const body = {
      model: selectedModel,
      system: systemPrompt,
      messages: messages,
      max_tokens: 1200
    };
    const data = await fetchJson(anthropicBase, anthropicPath, apiKey, {
      method: "POST",
      body: JSON.stringify(body)
    });
    return data?.content?.[0]?.text || "(No response content)";
  }

  const baseUrl = isGnaiKey(apiKey) ? GNAI_OPENAI_BASE_URL : OPENAI_BASE_URL;
  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];
  const isReasoningModel = /^o\d/i.test(selectedModel) || /^gpt-5/i.test(selectedModel);
  const body = {
    model: selectedModel,
    messages: fullMessages,
    stream: false,
    ...(isReasoningModel
      ? { max_completion_tokens: 1200 }
      : { temperature: 0.7, max_tokens: 1200 })
  };
  const data = await fetchJson(baseUrl, "/chat/completions", apiKey, {
    method: "POST",
    body: JSON.stringify(body)
  });
  return data?.choices?.[0]?.message?.content || "(No response content)";
}

async function fetchPersonalQuota(apiKey) {
  assertApiKey(apiKey);
  if (isGnaiKey(apiKey)) {
    throw new Error("Quota is not available for GNAI keys");
  }
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
        console.log('[KC] GET_PAGE_CONTENT tabId=', message.tabId);
        const content = await getPageContent(message.tabId);
        console.log('[KC] result:', content ? { isYT: content.isYouTubeTranscript, len: content.text?.length, lang: content.transcriptLang } : null);
        if (!content?.text?.trim()) {
          sendResponse({ ok: false, error: "No page text found." });
          return;
        }
        sendResponse({ ok: true, content });
      } catch (err) {
        console.error('[KC] getPageContent error:', err);
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

  if (message.type === MESSAGE_TYPES.SET_PANEL_MODE) {
    (async () => {
      try {
        const mode = message.mode === "popup" ? "popup" : "sidepanel";
        _cachedMode = mode;  // update cache immediately

        if (mode === "popup") {
          // Save state, then open popup window; sidepanel.js will window.close() itself
          await chrome.storage.local.set({ panelMode: mode });
          await applyPanelMode(mode);
          await openPopupWindow(_cachedSrcWindowId);
          sendResponse({ ok: true });
        } else {
          // sidepanel.js calls chrome.sidePanel.open() directly (in-gesture) before
          // sending this message, so we only need to persist state and close the popup.
          await chrome.storage.local.set({ panelMode: mode });
          await applyPanelMode(mode);
          sendResponse({ ok: true });
          // Close popup window if tracked
          if (_bgPopupWindowId !== null) {
            try { await chrome.windows.remove(_bgPopupWindowId); } catch (e) {}
            _bgPopupWindowId = null;
          }
        }
      } catch (err) {
        sendResponse({ ok: false, error: err.message || String(err) });
      }
    })();
    return true;
  }

  sendResponse({ ok: false, error: `Unsupported message type: ${String(message?.type || "")}` });
});
