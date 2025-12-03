/**
 * Vision Models Configuration
 * Defines which models support vision/multimodal inputs
 */

export interface VisionModelConfig {
  id: string
  supportsVision: boolean
  maxImageSize?: number // in MB
  maxImages?: number
  supportedFormats?: string[]
}

/**
 * Vision model prefixes - models starting with these support vision
 * This is more maintainable than listing every model version
 */
const VISION_MODEL_PREFIXES = [
  // OpenAI
  "openai/gpt-4",
  "openai/gpt-5",
  // Anthropic Claude
  "anthropic/claude-3",
  "anthropic/claude-4",
  // Google Gemini
  "google/gemini-1.5",
  "google/gemini-2",
  // xAI Grok (all vision-capable)
  "x-ai/grok-2",
  "x-ai/grok-3",
  "x-ai/grok-4",
  // Meta Llama vision models
  "meta-llama/llama-3.2-11b-vision",
  "meta-llama/llama-3.2-90b-vision",
  // Qwen vision models
  "qwen/qwen-2-vl",
  "qwen/qwen-2.5-vl",
  "qwen/qwen3",
]

/**
 * Specific model IDs that support vision (for exact matches)
 */
export const VISION_CAPABLE_MODELS = new Set([
  // OpenAI GPT-4 Vision
  "openai/gpt-4-vision-preview",
  "openai/gpt-4-turbo",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-5-2025-08-07",
  "openai/gpt-5-mini-2025-08-07",

  // Anthropic Claude
  "anthropic/claude-3-opus",
  "anthropic/claude-3-sonnet",
  "anthropic/claude-3-haiku",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-4-sonnet",
  "anthropic/claude-4.5-sonnet",
  "anthropic/claude-4.5-sonnet-20250929",
  "anthropic/claude-opus-4",
  "anthropic/claude-opus-4.1",
  "anthropic/claude-haiku-4.5",

  // Google Gemini
  "google/gemini-1.5-pro",
  "google/gemini-1.5-flash",
  "google/gemini-2.0-flash",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",

  // xAI Grok - all support vision
  "x-ai/grok-2-vision",
  "x-ai/grok-2-vision-1212",
  "x-ai/grok-3",
  "x-ai/grok-3-fast",
  "x-ai/grok-4",
  "x-ai/grok-4-fast",
  "x-ai/grok-4.1",
  "x-ai/grok-4.1-fast",

  // Qwen
  "qwen/qwen3-max",
  "qwen/qwen3-235b-a22b-thinking-2507",
])

/**
 * Check if a model supports vision/multimodal inputs
 * Uses both exact match and prefix matching for better coverage
 */
export function supportsVision(modelId: string): boolean {
  // First check exact match
  if (VISION_CAPABLE_MODELS.has(modelId)) {
    return true
  }

  // Then check prefix match (catches new versions automatically)
  return VISION_MODEL_PREFIXES.some(prefix => modelId.startsWith(prefix))
}

/**
 * Get vision configuration for a model
 */
export function getVisionConfig(modelId: string): VisionModelConfig {
  const defaultConfig: VisionModelConfig = {
    id: modelId,
    supportsVision: false,
    maxImageSize: 10,
    maxImages: 1,
    supportedFormats: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  }

  if (!supportsVision(modelId)) {
    return defaultConfig
  }

  // Model-specific configurations
  if (modelId.startsWith("google/gemini")) {
    return {
      ...defaultConfig,
      supportsVision: true,
      maxImages: 16, // Gemini supports multiple images
    }
  }

  if (modelId.startsWith("anthropic/claude")) {
    return {
      ...defaultConfig,
      supportsVision: true,
      maxImages: 20, // Claude supports many images
      maxImageSize: 5, // Claude recommends smaller images
    }
  }

  if (modelId.startsWith("openai/gpt")) {
    return {
      ...defaultConfig,
      supportsVision: true,
      maxImages: 10,
    }
  }

  if (modelId.startsWith("x-ai/grok")) {
    return {
      ...defaultConfig,
      supportsVision: true,
      maxImages: 5,
    }
  }

  return {
    ...defaultConfig,
    supportsVision: true,
  }
}

/**
 * Get a recommended vision model if current model doesn't support vision
 */
export function getRecommendedVisionModel(currentModel?: string): string {
  // If current model already supports vision, return it
  if (currentModel && supportsVision(currentModel)) {
    return currentModel
  }

  // Return best default vision model
  return "anthropic/claude-4.5-sonnet-20250929"
}

/**
 * Validate image attachment against model capabilities
 */
export function validateImageForModel(
  modelId: string,
  imageCount: number,
  imageSizeMB: number
): { valid: boolean; error?: string } {
  const config = getVisionConfig(modelId)

  if (!config.supportsVision) {
    return {
      valid: false,
      error: "This model does not support image inputs. Please select a vision-capable model.",
    }
  }

  if (config.maxImages && imageCount > config.maxImages) {
    return {
      valid: false,
      error: `This model supports a maximum of ${config.maxImages} images per message.`,
    }
  }

  if (config.maxImageSize && imageSizeMB > config.maxImageSize) {
    return {
      valid: false,
      error: `Image size exceeds maximum of ${config.maxImageSize}MB for this model.`,
    }
  }

  return { valid: true }
}
