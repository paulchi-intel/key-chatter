const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const EXPECTED_MODELS_URL = "https://gnai.intel.com/meta?section=models";

function loadBackground(fetchImpl) {
  const listeners = { addListener() {} };
  const context = {
    AbortController,
    URL,
    chrome: {
      action: { onClicked: listeners },
      runtime: { onInstalled: listeners, onMessage: listeners, onStartup: listeners },
      windows: { onRemoved: listeners }
    },
    clearTimeout,
    console,
    fetch: fetchImpl,
    setTimeout
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync("background.js", "utf8"), context, {
    filename: "background.js"
  });
  return context;
}

test("model discovery falls back to authenticated model APIs when the meta page has no HTML table", async () => {
  const requests = [];
  const background = loadBackground(async (url, options) => {
    requests.push({ url, options });
    if (url === EXPECTED_MODELS_URL) {
      return { ok: true, text: async () => "<html><body><div id=\"app\"></div></body></html>" };
    }
    if (url.endsWith("/api/providers/openai/v1/models")) {
      return { ok: true, json: async () => ({ data: [{ id: "gpt-5-mini" }] }) };
    }
    if (url.endsWith("/api/providers/anthropic/v1/models")) {
      return { ok: true, json: async () => ({ data: [{ id: "claude-4-6-sonnet" }] }) };
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  const result = await background.discoverModelsFromDocumentation("test-api-key");

  assert.equal(requests[0].url, EXPECTED_MODELS_URL);
  assert.equal(requests[0].options.credentials, "include");
  assert.equal(requests[1].options.headers.Authorization, "Bearer test-api-key");
  assert.equal(requests[2].options.headers.Authorization, "Bearer test-api-key");
  assert.deepEqual(Array.from(result.models), ["gpt-5-mini", "claude-4-6-sonnet"]);
  assert.equal(result.sourceUrl, "GNAI model APIs");
});
