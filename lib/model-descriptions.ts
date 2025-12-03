/**
 * Model Descriptions - Short 5-6 word descriptions for quick reference
 */

export const MODEL_DESCRIPTIONS: Record<string, string> = {
  // Grok Models
  "x-ai/grok-4": "Hochleistungs-Allrounder mit Top-Qualität, stark",
  "x-ai/grok-4-fast": "Schnell, günstig & trotzdem stark",
  "x-ai/grok-code-fast-1": "Spezialisiert für Code, schnelle Antworten",

  // OpenAI Models
  "openai/gpt-5-2025-08-07": "Neuestes GPT mit maximaler Intelligenz",
  "openai/gpt-5.1": "Verbesserte Version, sehr intelligent, empfohlen",
  "openai/gpt-5-mini-2025-08-07": "Kompakt, schnell, smart & günstig",
  "openai/gpt-oss-120b": "Open Source Modell, sehr groß",
  "openai/gpt-oss-20b": "Open Source Modell, mittlere Größe",

  // Anthropic Models
  "anthropic/claude-4.5-sonnet-20250929": "Perfekte Balance aus Qualität & Tempo",
  "anthropic/claude-opus-4.1": "Maximale Intelligenz, teuer, sehr stark",
  "anthropic/claude-haiku-4.5": "Schnell, günstig, effizient & zuverlässig",

  // Google Models
  "google/gemini-2.5-pro": "1M Context, sehr groß & leistungsstark",
  "google/gemini-2.5-flash": "Schnell, günstig, Google Qualität, empfohlen",
  "google/gemini-2.5-flash-preview-09-2025": "Preview Version, experimentell, sehr schnell",
  "google/gemini-2.5-flash-lite": "Ultraschnell, minimal, für einfache Tasks",

  // DeepSeek Models
  "deepseek/deepseek-chat-v3.2-experimental": "Experimentell, innovativ & sehr günstig",
  "deepseek/deepseek-v3.2-exp": "Experimentell, innovativ, neue Features testen",
  "deepseek/deepseek-chat-v3-0324:free": "Völlig kostenlos, DeepSeek V3 Qualität",
  "deepseek/deepseek-coder-v3": "Spezialisiert für Code & Programmierung",

  // Qwen Models
  "qwen/qwen3-max": "Alibaba Flaggschiff-Modell, sehr leistungsstark",
  "qwen/qwen3-235b-a22b-thinking-2507": "Thinking Mode aktiviert, sehr intelligent",
  "qwen/qwen3-coder": "480B Parameter, absoluter Code-Experte",
  "qwen/qwen3-coder-30b-a3b-instruct": "Kompakt, schnell, fokussiert auf Code",

  // Meta Llama Models
  "meta-llama/llama-4-maverick:free": "Open Source Meta Modell, kostenlos",
  "meta-llama/llama-4-scout:free": "Schnell, open source, gratis nutzbar",

  // Chinese Models
  "zhipu/glm-4.6": "Chinesisches Flaggschiff-Modell, sehr stark",
  "z-ai/glm-4.6": "GLM 4.6, China AI Innovation",
  "minimax/m2": "Chinesisch, multimodal, experimentell, spannend",

  // Moonshot & Others
  "moonshotai/kimi-k2-thinking": "Long Context fähig, Thinking Mode",
  "mistralai/codestral-2025": "Mistral Code-Experte, europäische KI",
}

/**
 * Get model description, fallback to generic
 */
export function getModelDescription(modelId: string): string {
  return MODEL_DESCRIPTIONS[modelId] || "KI-Modell"
}

/**
 * Get model category badge
 */
export function getModelCategory(modelId: string): string {
  if (modelId.includes("gpt")) return "OpenAI"
  if (modelId.includes("claude")) return "Anthropic"
  if (modelId.includes("gemini")) return "Google"
  if (modelId.includes("grok")) return "xAI"
  if (modelId.includes("deepseek")) return "DeepSeek"
  if (modelId.includes("qwen")) return "Qwen"
  if (modelId.includes("llama")) return "Meta"
  if (modelId.includes("glm") || modelId.includes("minimax")) return "China"
  if (modelId.includes("moonshot") || modelId.includes("kimi")) return "Moonshot"
  if (modelId.includes("mistral")) return "Mistral"
  return "KI"
}
