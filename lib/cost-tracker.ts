// Cost tracking and budgeting system for LLM usage

export interface CostEntry {
  id: string
  timestamp: number
  chatId: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number // in USD
  searchProvider?: string
  searchCost?: number
}

export interface CostStats {
  totalCost: number
  totalTokens: number
  totalChats: number
  costByModel: Record<string, number>
  costByDay: Array<{ date: string; cost: number }>
  avgCostPerMessage: number
}

// Model pricing (per 1M tokens) - OpenRouter prices as of November 2025
// Source: https://openrouter.ai/models - Updated 2025-11
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI Models
  "openai/gpt-5-2025-08-07": { input: 10.0, output: 30.0 },
  "openai/gpt-5-mini-2025-08-07": { input: 0.30, output: 1.20 },
  "openai/gpt-4o": { input: 2.50, output: 10.0 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.60 },
  "openai/gpt-4-turbo": { input: 10.0, output: 30.0 },
  "openai/gpt-4": { input: 30.0, output: 60.0 },
  "openai/gpt-3.5-turbo": { input: 0.50, output: 1.50 },
  "openai/o1": { input: 15.0, output: 60.0 },
  "openai/o1-mini": { input: 3.0, output: 12.0 },
  "openai/o1-preview": { input: 15.0, output: 60.0 },

  // Anthropic Models
  "anthropic/claude-4.5-sonnet-20250929": { input: 3.0, output: 15.0 },
  "anthropic/claude-opus-4.1": { input: 15.0, output: 75.0 },
  "anthropic/claude-3.5-sonnet": { input: 3.0, output: 15.0 },
  "anthropic/claude-3-opus": { input: 15.0, output: 75.0 },
  "anthropic/claude-3-sonnet": { input: 3.0, output: 15.0 },
  "anthropic/claude-3-haiku": { input: 0.25, output: 1.25 },
  "anthropic/claude-haiku-4.5": { input: 0.80, output: 4.0 },
  "anthropic/claude-3.5-haiku": { input: 1.0, output: 5.0 },

  // Google Models
  "google/gemini-2.5-pro": { input: 1.25, output: 5.0 },
  "google/gemini-2.5-flash": { input: 0.075, output: 0.30 },
  "google/gemini-2.5-flash-lite": { input: 0.02, output: 0.08 },
  "google/gemini-2.0-flash-exp": { input: 0.0, output: 0.0 }, // Free experimental
  "google/gemini-pro-1.5": { input: 1.25, output: 5.0 },
  "google/gemini-pro": { input: 0.50, output: 1.50 },

  // xAI Grok Models - Updated November 2025
  "x-ai/grok-4.1-fast": { input: 0.60, output: 2.0 },
  "x-ai/grok-4-fast": { input: 0.60, output: 2.0 },
  "x-ai/grok-4": { input: 3.0, output: 15.0 },
  "x-ai/grok-2": { input: 2.0, output: 10.0 },
  "x-ai/grok-beta": { input: 5.0, output: 15.0 },
  "x-ai/grok-code-fast-1": { input: 0.20, output: 0.80 },
  "xai/grok-4": { input: 3.0, output: 15.0 },
  "xai/grok-4-fast": { input: 0.60, output: 2.0 },

  // DeepSeek Models - Very affordable
  "deepseek/deepseek-chat": { input: 0.14, output: 0.28 },
  "deepseek/deepseek-chat-v3.2-experimental": { input: 0.14, output: 0.28 },
  "deepseek/deepseek-chat-v3-0324:free": { input: 0.0, output: 0.0 },
  "deepseek/deepseek-r1": { input: 0.55, output: 2.19 },
  "deepseek/deepseek-coder-v3": { input: 0.14, output: 0.28 },

  // Meta Llama Models
  "meta-llama/llama-4-maverick:free": { input: 0.0, output: 0.0 },
  "meta-llama/llama-4-scout:free": { input: 0.0, output: 0.0 },
  "meta-llama/llama-3.1-405b-instruct": { input: 2.70, output: 2.70 },
  "meta-llama/llama-3.1-70b-instruct": { input: 0.52, output: 0.75 },
  "meta-llama/llama-3.1-8b-instruct": { input: 0.055, output: 0.055 },

  // Qwen Models
  "qwen/qwen3-max": { input: 0.16, output: 0.64 },
  "qwen/qwen3-235b-a22b-thinking-2507": { input: 1.0, output: 3.0 },
  "qwen/qwen3-coder": { input: 0.50, output: 1.50 },
  "qwen/qwen3-coder-30b-a3b-instruct": { input: 0.14, output: 0.14 },

  // Mistral Models
  "mistralai/mistral-large": { input: 2.0, output: 6.0 },
  "mistralai/mistral-medium": { input: 2.70, output: 8.10 },
  "mistralai/codestral-2025": { input: 0.30, output: 0.90 },

  // Other models
  "zhipu/glm-4.6": { input: 0.10, output: 0.10 },
  "minimax/m2": { input: 0.15, output: 0.45 },
}

// Search API pricing (per search)
const SEARCH_PRICING: Record<string, number> = {
  tavily: 0.001,    // $1 per 1000 searches
  serper: 0.0002,   // $2 per 10,000 searches
  exa: 0.0005,      // $5 per 10,000 searches (2x cheaper than Tavily)
  youcom: 0.0,      // Free tier available
}

export class CostTracker {
  private entries: CostEntry[] = []
  private readonly STORAGE_KEY = "cost-tracker-entries"
  private readonly MAX_ENTRIES = 10000 // Keep last 10k entries

  constructor() {
    this.loadFromStorage()
  }

  // Calculate cost for a specific model and token usage
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING["x-ai/grok-4.1-fast"] // fallback

    // Pricing is per 1M tokens
    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output

    return inputCost + outputCost
  }

  // Track a new cost entry
  trackCost(entry: Omit<CostEntry, "id" | "timestamp">): void {
    const newEntry: CostEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }

    this.entries.unshift(newEntry) // Add to beginning

    // Keep only last MAX_ENTRIES
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries = this.entries.slice(0, this.MAX_ENTRIES)
    }

    this.saveToStorage()
  }

  // Get all entries
  getEntries(): CostEntry[] {
    return this.entries
  }

  // Get entries for a specific chat
  getChatEntries(chatId: string): CostEntry[] {
    return this.entries.filter((entry) => entry.chatId === chatId)
  }

  // Get entries within a date range
  getEntriesInRange(startDate: Date, endDate: Date): CostEntry[] {
    const start = startDate.getTime()
    const end = endDate.getTime()
    return this.entries.filter((entry) => entry.timestamp >= start && entry.timestamp <= end)
  }

  // Calculate statistics
  getStats(timeRange?: { start: Date; end: Date }): CostStats {
    const relevantEntries = timeRange
      ? this.getEntriesInRange(timeRange.start, timeRange.end)
      : this.entries

    const totalCost = relevantEntries.reduce((sum, entry) => sum + entry.cost + (entry.searchCost || 0), 0)
    const totalTokens = relevantEntries.reduce((sum, entry) => sum + entry.totalTokens, 0)
    const uniqueChats = new Set(relevantEntries.map((entry) => entry.chatId))

    // Cost by model
    const costByModel: Record<string, number> = {}
    relevantEntries.forEach((entry) => {
      costByModel[entry.model] = (costByModel[entry.model] || 0) + entry.cost
    })

    // Cost by day
    const costByDay: Record<string, number> = {}
    relevantEntries.forEach((entry) => {
      const date = new Date(entry.timestamp).toISOString().split("T")[0]
      costByDay[date] = (costByDay[date] || 0) + entry.cost + (entry.searchCost || 0)
    })

    const costByDayArray = Object.entries(costByDay)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalCost,
      totalTokens,
      totalChats: uniqueChats.size,
      costByModel,
      costByDay: costByDayArray,
      avgCostPerMessage: relevantEntries.length > 0 ? totalCost / relevantEntries.length : 0,
    }
  }

  // Get cost for a specific chat
  getChatCost(chatId: string): number {
    return this.getChatEntries(chatId).reduce(
      (sum, entry) => sum + entry.cost + (entry.searchCost || 0),
      0,
    )
  }

  // Clear all entries
  clearAll(): void {
    this.entries = []
    this.saveToStorage()
  }

  // Clear entries older than X days
  clearOlderThan(days: number): void {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    this.entries = this.entries.filter((entry) => entry.timestamp >= cutoff)
    this.saveToStorage()
  }

  // Export to JSON
  exportToJSON(): string {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalEntries: this.entries.length,
        entries: this.entries,
      },
      null,
      2,
    )
  }

  // Private methods for persistence
  private loadFromStorage(): void {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.entries = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[CostTracker] Failed to load from storage:", error)
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries))
    } catch (error) {
      console.error("[CostTracker] Failed to save to storage:", error)
    }
  }
}

// Singleton instance
let costTrackerInstance: CostTracker | null = null

export function getCostTracker(): CostTracker {
  if (!costTrackerInstance) {
    costTrackerInstance = new CostTracker()
  }
  return costTrackerInstance
}

// Helper to get search cost
export function getSearchCost(provider: "tavily" | "serper"): number {
  return SEARCH_PRICING[provider] || 0
}
