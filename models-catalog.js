// models-catalog.js
// ─────────────────────────────────────────────────────────────────────────
// 需要驗證的候選模型清單（可自行維護增刪）。
// 「驗證支援的模型」功能會逐一探測下列每個模型，
// 通過者才會出現在 model-selector 下拉選單中。
// ─────────────────────────────────────────────────────────────────────────

export const CANDIDATE_MODELS = {
  openai: [
    "gpt-4.1",
    "gpt-4o",
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-5.1",
    "gpt-5.1-codex",
    "gpt-5.1-codex-max",
    "gpt-5.2",
    "gpt-5.2-codex",
    "gpt-5.3-codex",
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-5.4-nano",
    "gpt-5.5",
    "o3",
    "o3-mini",
    "o4-mini",
  ],
  anthropic: [
    "claude-4-6-sonnet",
    "claude-4-5-sonnet",
    "claude-4-5-sonnet-thinking",
    "claude-4-5-haiku",
    "claude-4-5-haiku-thinking",
    "claude-4-5-opus",
    "claude-4-5-opus-thinking",
    "claude-4-6-sonnet-thinking",
    "claude-4-6-opus",
    "claude-4-6-opus-thinking",
    "claude-4-7-opus",
    "claude-4-7-opus-thinking",
    "claude-4-8-opus",
    "claude-5-sonnet",
    "claude-5-sonnet-thinking",
  ],
};
