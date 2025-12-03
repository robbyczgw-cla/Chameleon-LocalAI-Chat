/**
 * Models Module
 * Unified exports for model-related functionality
 */

// Model descriptions
export { MODEL_DESCRIPTIONS } from "../model-descriptions"

// User model preferences (selected models)
export type { UserModelPreferences } from "../model-preferences"
export {
  getUserSelectedModels,
  saveUserSelectedModels,
  addModelToSelection,
  removeModelFromSelection,
  resetModelSelection,
  hasCustomModelSelection,
  getDefaultStartingModels,
  getDefaultModelId,
  getMaxModelsLimit,
} from "../model-preferences"

// Vision model configuration
export type { VisionModelConfig } from "../vision-models"
export {
  VISION_CAPABLE_MODELS,
  supportsVision,
  getVisionConfig,
  getRecommendedVisionModel,
  validateImageForModel,
} from "../vision-models"

// OpenRouter API (streaming, model list)
export {
  streamChatMessage,
  REASONING_MODELS,
  fetchAvailableModels,
  type OpenRouterModel,
} from "../openrouter"
