// Token estimation and cost calculation utilities
// Uses centralized pricing from cost-tracker.ts

import { MODEL_PRICING as COST_TRACKER_PRICING } from "./cost-tracker"

interface ModelPricing {
  inputCost: number // Cost per million tokens
  outputCost: number // Cost per million tokens
}

// Convert cost-tracker pricing format to token-tracker format
const MODEL_PRICING: Record<string, ModelPricing> = Object.fromEntries(
  Object.entries(COST_TRACKER_PRICING).map(([model, pricing]) => [
    model,
    { inputCost: pricing.input, outputCost: pricing.output }
  ])
)

// Add default fallback
MODEL_PRICING.default = { inputCost: 1.0, outputCost: 2.0 }

/**
 * Estimate token count for text (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Get pricing for a model
 */
export function getModelPricing(model: string): ModelPricing {
  // Try exact match first
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model]
  }

  // Try partial match (e.g., "gpt-4" in "openai/gpt-4-turbo")
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.includes(key) || key.includes(model)) {
      return pricing
    }
  }

  return MODEL_PRICING.default
}

/**
 * Calculate cost for token usage
 */
export function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  const pricing = getModelPricing(model)

  const inputCost = (promptTokens / 1_000_000) * pricing.inputCost
  const outputCost = (completionTokens / 1_000_000) * pricing.outputCost

  return inputCost + outputCost
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`
  }
  return `$${cost.toFixed(4)}`
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}
