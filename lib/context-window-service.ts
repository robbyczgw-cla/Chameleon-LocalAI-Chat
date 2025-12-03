/**
 * Context Window Service
 * Tracks context window usage and provides auto-compression capabilities
 */

import { estimateTokens } from "./token-tracker"

// Model context window sizes (in tokens) - Updated November 2025
// Source: OpenRouter API and official model documentation
export const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  // OpenAI Models
  "openai/gpt-5-2025-08-07": 256000,
  "openai/gpt-5-mini-2025-08-07": 128000,
  "openai/gpt-4o": 128000,
  "openai/gpt-4o-mini": 128000,
  "openai/gpt-4-turbo": 128000,
  "openai/gpt-4": 8192,
  "openai/gpt-3.5-turbo": 16385,
  "openai/o1": 200000,
  "openai/o1-mini": 128000,
  "openai/o1-preview": 128000,

  // Anthropic Models
  "anthropic/claude-4.5-sonnet-20250929": 200000,
  "anthropic/claude-opus-4.1": 200000,
  "anthropic/claude-3.5-sonnet": 200000,
  "anthropic/claude-3-opus": 200000,
  "anthropic/claude-3-sonnet": 200000,
  "anthropic/claude-3-haiku": 200000,
  "anthropic/claude-haiku-4.5": 200000,
  "anthropic/claude-3.5-haiku": 200000,

  // Google Models
  "google/gemini-2.5-pro": 1000000,
  "google/gemini-2.5-flash": 1000000,
  "google/gemini-2.5-flash-lite": 1000000,
  "google/gemini-2.0-flash-exp": 1000000,
  "google/gemini-pro-1.5": 1000000,
  "google/gemini-pro": 32768,

  // xAI Grok Models
  "x-ai/grok-4.1-fast": 2000000,
  "x-ai/grok-4-fast": 2000000,
  "x-ai/grok-4": 2000000,
  "x-ai/grok-2": 131072,
  "x-ai/grok-beta": 131072,
  "x-ai/grok-code-fast-1": 131072,
  "xai/grok-4": 2000000,
  "xai/grok-4-fast": 2000000,

  // DeepSeek Models
  "deepseek/deepseek-chat": 64000,
  "deepseek/deepseek-chat-v3.2-experimental": 64000,
  "deepseek/deepseek-chat-v3-0324:free": 64000,
  "deepseek/deepseek-r1": 64000,
  "deepseek/deepseek-coder-v3": 64000,

  // Meta Llama Models
  "meta-llama/llama-4-maverick:free": 1000000,
  "meta-llama/llama-4-scout:free": 512000,
  "meta-llama/llama-3.1-405b-instruct": 131072,
  "meta-llama/llama-3.1-70b-instruct": 131072,
  "meta-llama/llama-3.1-8b-instruct": 131072,

  // Qwen Models
  "qwen/qwen3-max": 40960,
  "qwen/qwen3-235b-a22b-thinking-2507": 131072,
  "qwen/qwen3-coder": 131072,
  "qwen/qwen3-coder-30b-a3b-instruct": 131072,

  // Mistral Models
  "mistralai/mistral-large": 128000,
  "mistralai/mistral-medium": 32768,
  "mistralai/codestral-2025": 32768,

  // Default fallback
  default: 32768,
}

// Warning thresholds for context usage
export const CONTEXT_THRESHOLDS = {
  safe: 0.5,      // < 50% - Green
  warning: 0.75,  // 50-75% - Yellow
  danger: 0.9,    // 75-90% - Orange
  critical: 0.95, // > 95% - Red
}

export interface ContextUsage {
  usedTokens: number
  maxTokens: number
  percentage: number
  status: "safe" | "warning" | "danger" | "critical"
  remainingTokens: number
  canFitMessage: (messageTokens: number) => boolean
}

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export interface CompressionResult {
  originalTokens: number
  compressedTokens: number
  savedTokens: number
  compressionRatio: number
  summary: string
}

class ContextWindowService {
  private cachedContextLengths: Record<string, number> = {}

  /**
   * Get context window size for a model
   */
  getContextWindow(model: string): number {
    // Check cache first
    if (this.cachedContextLengths[model]) {
      return this.cachedContextLengths[model]
    }

    // Try exact match
    if (MODEL_CONTEXT_WINDOWS[model]) {
      return MODEL_CONTEXT_WINDOWS[model]
    }

    // Try partial match (e.g., "gpt-4" in "openai/gpt-4-turbo")
    for (const [key, value] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
      if (model.includes(key.split("/")[1] || key) || key.includes(model)) {
        return value
      }
    }

    return MODEL_CONTEXT_WINDOWS.default
  }

  /**
   * Cache context length from API response
   */
  cacheContextLength(model: string, contextLength: number): void {
    this.cachedContextLengths[model] = contextLength
  }

  /**
   * Calculate total tokens for messages
   */
  calculateMessageTokens(messages: Message[]): number {
    let total = 0
    for (const msg of messages) {
      // Add tokens for content
      total += estimateTokens(msg.content)
      // Add ~4 tokens overhead per message for role, formatting
      total += 4
    }
    // Add ~3 tokens for assistant reply priming
    total += 3
    return total
  }

  /**
   * Get current context usage
   */
  getContextUsage(messages: Message[], model: string, reserveForOutput: number = 4096): ContextUsage {
    const maxTokens = this.getContextWindow(model)
    const usedTokens = this.calculateMessageTokens(messages)
    const availableForInput = maxTokens - reserveForOutput
    const percentage = usedTokens / availableForInput

    let status: ContextUsage["status"] = "safe"
    if (percentage >= CONTEXT_THRESHOLDS.critical) {
      status = "critical"
    } else if (percentage >= CONTEXT_THRESHOLDS.danger) {
      status = "danger"
    } else if (percentage >= CONTEXT_THRESHOLDS.warning) {
      status = "warning"
    }

    return {
      usedTokens,
      maxTokens: availableForInput,
      percentage: Math.min(percentage, 1),
      status,
      remainingTokens: Math.max(0, availableForInput - usedTokens),
      canFitMessage: (messageTokens: number) => usedTokens + messageTokens < availableForInput,
    }
  }

  /**
   * Check if compression is recommended
   */
  shouldCompress(usage: ContextUsage): boolean {
    return usage.status === "danger" || usage.status === "critical"
  }

  /**
   * Generate a compression prompt for summarizing conversation history
   */
  getCompressionPrompt(messages: Message[], keepLastN: number = 4): string {
    // Keep system message and last N messages intact
    const systemMessage = messages.find(m => m.role === "system")
    const recentMessages = messages.slice(-keepLastN)
    const messagesToSummarize = messages.filter(
      m => m.role !== "system" && !recentMessages.includes(m)
    )

    if (messagesToSummarize.length === 0) {
      return ""
    }

    const conversationText = messagesToSummarize
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n")

    return `Please provide a concise summary of this conversation history. Focus on:
1. Key topics discussed
2. Important decisions or conclusions reached
3. Any specific requests or preferences mentioned
4. Context needed for continuing the conversation

Keep the summary under 500 words. Write in a neutral, factual tone.

CONVERSATION TO SUMMARIZE:
${conversationText}

SUMMARY:`
  }

  /**
   * Create compressed messages array with summary
   */
  createCompressedMessages(
    originalMessages: Message[],
    summary: string,
    keepLastN: number = 4
  ): Message[] {
    const systemMessage = originalMessages.find(m => m.role === "system")
    const recentMessages = originalMessages.slice(-keepLastN)

    const compressedMessages: Message[] = []

    // Add system message if exists
    if (systemMessage) {
      compressedMessages.push(systemMessage)
    }

    // Add summary as a system message
    compressedMessages.push({
      role: "system",
      content: `[Previous conversation summary]\n${summary}\n[End of summary - Recent messages follow]`
    })

    // Add recent messages
    compressedMessages.push(...recentMessages)

    return compressedMessages
  }

  /**
   * Calculate compression stats
   */
  calculateCompressionStats(
    originalMessages: Message[],
    compressedMessages: Message[]
  ): CompressionResult {
    const originalTokens = this.calculateMessageTokens(originalMessages)
    const compressedTokens = this.calculateMessageTokens(compressedMessages)
    const savedTokens = originalTokens - compressedTokens

    return {
      originalTokens,
      compressedTokens,
      savedTokens,
      compressionRatio: compressedTokens / originalTokens,
      summary: `Compressed ${originalTokens} → ${compressedTokens} tokens (saved ${savedTokens})`
    }
  }

  /**
   * Format context window size for display
   */
  formatContextWindow(tokens: number): string {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`
    }
    return tokens.toString()
  }

  /**
   * Get color for status
   */
  getStatusColor(status: ContextUsage["status"]): string {
    switch (status) {
      case "safe": return "text-green-500"
      case "warning": return "text-yellow-500"
      case "danger": return "text-orange-500"
      case "critical": return "text-red-500"
      default: return "text-gray-500"
    }
  }

  /**
   * Get background color for status
   */
  getStatusBgColor(status: ContextUsage["status"]): string {
    switch (status) {
      case "safe": return "bg-green-500"
      case "warning": return "bg-yellow-500"
      case "danger": return "bg-orange-500"
      case "critical": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }
}

// Singleton instance
export const contextWindowService = new ContextWindowService()
