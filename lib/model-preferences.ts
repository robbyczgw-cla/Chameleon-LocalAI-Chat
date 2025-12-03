/**
 * User Model Preferences - LocalStorage Service
 * Manages user's selected OpenRouter models
 */

const STORAGE_KEY = "user-selected-models"
const DEFAULT_MODEL = "x-ai/grok-4.1-fast"
const MAX_MODELS = 30

// Default starting models for new users
const DEFAULT_STARTING_MODELS = [
  "x-ai/grok-4.1-fast", // ALWAYS the default - 2M context, reasoning support
  "x-ai/grok-4-fast",
  "openai/gpt-5.1",
  "moonshotai/kimi-k2-thinking",
  "anthropic/claude-haiku-4.5",
  "z-ai/glm-4.6",
  "deepseek/deepseek-v3.2-exp",
  "google/gemini-2.5-flash-preview-09-2025",
  "qwen/qwen3-max",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "google/gemini-2.5-flash-image", // Only image model
]

export interface UserModelPreferences {
  selectedModels: string[] // Array of model IDs
  lastUpdated: string
}

/**
 * Get user's selected models from localStorage
 * If no preferences exist, initializes with DEFAULT_STARTING_MODELS
 */
export function getUserSelectedModels(): string[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    // If no stored preferences, initialize with defaults
    if (!stored) {
      console.log("[ModelPreferences] No stored preferences, initializing with defaults")
      saveUserSelectedModels(DEFAULT_STARTING_MODELS)
      return DEFAULT_STARTING_MODELS
    }

    const prefs: UserModelPreferences = JSON.parse(stored)

    // Always ensure default model is included
    if (!prefs.selectedModels.includes(DEFAULT_MODEL)) {
      prefs.selectedModels.unshift(DEFAULT_MODEL)
    }

    return prefs.selectedModels
  } catch (error) {
    console.error("[ModelPreferences] Failed to load:", error)
    return DEFAULT_STARTING_MODELS
  }
}

/**
 * Save user's selected models to localStorage
 */
export function saveUserSelectedModels(modelIds: string[]): boolean {
  if (typeof window === "undefined") return false

  try {
    // Ensure default model is always first
    const models = modelIds.filter((id) => id !== DEFAULT_MODEL)
    models.unshift(DEFAULT_MODEL)

    // Limit to MAX_MODELS
    const limitedModels = models.slice(0, MAX_MODELS)

    const prefs: UserModelPreferences = {
      selectedModels: limitedModels,
      lastUpdated: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))

    // Dispatch custom event to notify all listeners
    window.dispatchEvent(new CustomEvent("modelPreferencesChanged"))

    return true
  } catch (error) {
    console.error("[ModelPreferences] Failed to save:", error)
    return false
  }
}

/**
 * Add a model to user's selection
 */
export function addModelToSelection(modelId: string): boolean {
  const current = getUserSelectedModels()

  // Check if already exists
  if (current.includes(modelId)) {
    console.warn("[ModelPreferences] Model already in selection:", modelId)
    return false
  }

  // Check max limit
  if (current.length >= MAX_MODELS) {
    console.warn("[ModelPreferences] Max models reached:", MAX_MODELS)
    return false
  }

  const updated = [...current, modelId]
  return saveUserSelectedModels(updated)
}

/**
 * Remove a model from user's selection
 */
export function removeModelFromSelection(modelId: string): boolean {
  // Cannot remove default model
  if (modelId === DEFAULT_MODEL) {
    console.warn("[ModelPreferences] Cannot remove default model:", DEFAULT_MODEL)
    return false
  }

  const current = getUserSelectedModels()
  const updated = current.filter((id) => id !== modelId)

  return saveUserSelectedModels(updated)
}

/**
 * Check if user has any custom selections
 */
export function hasCustomModelSelection(): boolean {
  const models = getUserSelectedModels()
  return models.length > 1 // More than just the default
}

/**
 * Reset to default starting models
 */
export function resetModelSelection(): boolean {
  if (typeof window === "undefined") return false

  try {
    saveUserSelectedModels(DEFAULT_STARTING_MODELS)
    return true
  } catch (error) {
    console.error("[ModelPreferences] Failed to reset:", error)
    return false
  }
}

/**
 * Get default starting models
 */
export function getDefaultStartingModels(): string[] {
  return [...DEFAULT_STARTING_MODELS]
}

/**
 * Get the default model ID
 */
export function getDefaultModelId(): string {
  return DEFAULT_MODEL
}

/**
 * Get max models limit
 */
export function getMaxModelsLimit(): number {
  return MAX_MODELS
}
