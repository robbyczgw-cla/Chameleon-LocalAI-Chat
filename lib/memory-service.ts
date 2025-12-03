/**
 * Memory Service - Token-efficient long-term memory for Advanced mode
 *
 * Stores and retrieves user context, preferences, and facts to maintain
 * conversation continuity across sessions without excessive token usage.
 *
 * Local-First Edition: Uses SQLite for persistence via API routes.
 */

import type { Memory, MemorySettings } from "@/types"
import { generateUUID } from "@/lib/utils"

const MEMORY_STORAGE_KEY = "chat_memories"
const EXTRACTION_MODEL = "local/qwen/qwen3-1.7b" // Use local model for extraction
const DEFAULT_SETTINGS: MemorySettings = {
  enabled: false,
  autoExtract: true,
  maxMemoriesInContext: 5,
  importanceThreshold: 2,
  syncToDatabase: true, // Default to true for local SQLite
}

class MemoryService {
  private memories: Memory[] = []
  private settings: MemorySettings = DEFAULT_SETTINGS
  private syncEnabled: boolean = true

  constructor() {
    this.loadMemories()
  }

  /**
   * Configure database sync (simplified for local-first)
   */
  configureDatabaseSync(userId: string | null, syncEnabled: boolean) {
    this.syncEnabled = syncEnabled
    console.log("[Memory] Database sync configured:", { syncEnabled: this.syncEnabled })
  }

  /**
   * Load memories from SQLite database
   */
  async loadFromDatabase(): Promise<void> {
    if (!this.syncEnabled) {
      console.log("[Memory] Database sync disabled, skipping load")
      return
    }

    try {
      console.log("[Memory] Loading memories from SQLite...")
      const response = await fetch('/api/db/memories')
      if (!response.ok) {
        throw new Error(`Failed to load memories: ${response.status}`)
      }

      const dbMemories = await response.json()

      // Merge with local memories (database takes priority for conflicts)
      const localMemoryIds = new Set(this.memories.map(m => m.id))
      const dbMemoryIds = new Set(dbMemories.map((m: any) => m.id))

      // Add DB memories that aren't local
      for (const dbMem of dbMemories) {
        if (!localMemoryIds.has(dbMem.id)) {
          this.memories.push(dbMem)
        } else {
          // Update local with DB version (DB is source of truth)
          const idx = this.memories.findIndex(m => m.id === dbMem.id)
          if (idx !== -1) {
            this.memories[idx] = dbMem
          }
        }
      }

      // Upload local-only memories to database
      for (const localMem of this.memories) {
        if (!dbMemoryIds.has(localMem.id)) {
          try {
            await fetch('/api/db/memories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: localMem.id,
                type: localMem.type,
                content: localMem.content,
                importance: localMem.importance,
                source: localMem.source,
                createdAt: localMem.createdAt,
              }),
            })
          } catch (err) {
            console.error("[Memory] Failed to upload local memory:", err)
          }
        }
      }

      this.saveMemories() // Update localStorage with merged data
      console.log("[Memory] Database sync complete. Total memories:", this.memories.length)
    } catch (error) {
      console.error("[Memory] Failed to load from database:", error)
    }
  }

  /**
   * Load memories from localStorage
   */
  private loadMemories() {
    // Skip during SSR
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(MEMORY_STORAGE_KEY)
      if (stored) {
        this.memories = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[Memory] Load error:", error)
      this.memories = []
    }
  }

  /**
   * Save memories to localStorage (and optionally to database)
   */
  private saveMemories() {
    // Skip during SSR
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.memories))
    } catch (error) {
      console.error("[Memory] Save error:", error)
    }
  }

  /**
   * Add a new memory
   */
  addMemory(memory: Omit<Memory, "id" | "createdAt" | "lastAccessedAt" | "accessCount">): Memory {
    const newMemory: Memory = {
      ...memory,
      id: generateUUID(),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    }

    this.memories.push(newMemory)
    this.saveMemories()

    // Sync to SQLite database
    if (this.syncEnabled) {
      fetch('/api/db/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newMemory.id,
          type: newMemory.type,
          content: newMemory.content,
          importance: newMemory.importance,
          source: newMemory.source,
          createdAt: newMemory.createdAt,
        }),
      }).catch(err => {
        console.error("[Memory] Failed to sync new memory to database:", err)
      })
    }

    console.log("[Memory] Added:", newMemory.type, "-", newMemory.content.substring(0, 50))
    return newMemory
  }

  /**
   * Get all memories
   */
  getAllMemories(): Memory[] {
    return [...this.memories].sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Get memories by type
   */
  getMemoriesByType(type: Memory["type"]): Memory[] {
    return this.memories.filter((m) => m.type === type)
  }

  /**
   * Get relevant memories for a query (token-efficient)
   * Uses keyword matching and importance scoring
   */
  getRelevantMemories(query: string, limit?: number): Memory[] {
    const maxResults = limit || this.settings.maxMemoriesInContext
    const threshold = this.settings.importanceThreshold

    // Tokenize query
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)

    // Score each memory
    const scored = this.memories
      .filter(m => m.importance >= threshold)
      .map(memory => {
        let score = 0

        // Importance weight (0-30 points)
        score += memory.importance * 10

        // Keyword matching (0-50 points)
        const contentLower = memory.content.toLowerCase()
        const categoryLower = (memory.category || "").toLowerCase()

        for (const token of queryTokens) {
          if (contentLower.includes(token)) score += 10
          if (categoryLower.includes(token)) score += 5
        }

        // Recency bonus (0-20 points)
        const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24)
        if (daysSinceCreated < 7) score += 20
        else if (daysSinceCreated < 30) score += 10
        else if (daysSinceCreated < 90) score += 5

        return { memory, score }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)

    // Update access stats
    scored.forEach(({ memory }) => {
      const m = this.memories.find(mem => mem.id === memory.id)
      if (m) {
        m.lastAccessedAt = Date.now()
        m.accessCount++
      }
    })
    this.saveMemories()

    return scored.map(({ memory }) => memory)
  }

  /**
   * Format memories for LLM context (token-efficient)
   */
  formatMemoriesForContext(memories: Memory[]): string {
    if (memories.length === 0) return ""

    const grouped: Record<Memory["type"], Memory[]> = {
      preference: [],
      fact: [],
      context: [],
      skill: [],
      goal: [],
    }

    memories.forEach(m => grouped[m.type].push(m))

    const sections: string[] = []

    if (grouped.preference.length > 0) {
      sections.push(`Preferences: ${grouped.preference.map(m => m.content).join("; ")}`)
    }
    if (grouped.fact.length > 0) {
      sections.push(`Facts: ${grouped.fact.map(m => m.content).join("; ")}`)
    }
    if (grouped.context.length > 0) {
      sections.push(`Context: ${grouped.context.map(m => m.content).join("; ")}`)
    }
    if (grouped.skill.length > 0) {
      sections.push(`Skills: ${grouped.skill.map(m => m.content).join("; ")}`)
    }
    if (grouped.goal.length > 0) {
      sections.push(`Goals: ${grouped.goal.map(m => m.content).join("; ")}`)
    }

    return `<user_memory>\n${sections.join("\n")}\n</user_memory>`
  }

  /**
   * Update an existing memory
   */
  updateMemory(id: string, updates: Partial<Memory>): boolean {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return false

    this.memories[index] = {
      ...this.memories[index],
      ...updates,
    }
    this.saveMemories()

    // Sync to SQLite database
    if (this.syncEnabled) {
      fetch('/api/db/memories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(err => {
        console.error("[Memory] Failed to sync memory update to database:", err)
      })
    }

    return true
  }

  /**
   * Delete a memory
   */
  deleteMemory(id: string): boolean {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return false

    this.memories.splice(index, 1)
    this.saveMemories()

    // Sync to SQLite database
    if (this.syncEnabled) {
      fetch(`/api/db/memories?id=${id}`, { method: 'DELETE' }).catch(err => {
        console.error("[Memory] Failed to sync memory deletion to database:", err)
      })
    }

    return true
  }

  /**
   * Clear all memories
   */
  clearAllMemories() {
    this.memories = []
    this.saveMemories()

    // Sync to SQLite database
    if (this.syncEnabled) {
      fetch('/api/db/memories?all=true', { method: 'DELETE' }).catch(err => {
        console.error("[Memory] Failed to sync memory clear to database:", err)
      })
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      total: this.memories.length,
      byType: {
        preference: this.memories.filter(m => m.type === "preference").length,
        fact: this.memories.filter(m => m.type === "fact").length,
        context: this.memories.filter(m => m.type === "context").length,
        skill: this.memories.filter(m => m.type === "skill").length,
        goal: this.memories.filter(m => m.type === "goal").length,
      },
      byImportance: {
        high: this.memories.filter(m => m.importance === 3).length,
        medium: this.memories.filter(m => m.importance === 2).length,
        low: this.memories.filter(m => m.importance === 1).length,
      },
    }
  }

  /**
   * Extract memories from conversation (auto-extract feature)
   * Returns suggested memories that user can review and save
   */
  extractMemoriesFromConversation(userMessage: string, assistantMessage: string): Memory[] {
    const suggestions: Omit<Memory, "id" | "createdAt" | "lastAccessedAt" | "accessCount">[] = []

    // Preference patterns
    const preferencePatterns = [
      /I (?:prefer|like|love|enjoy|want) (.+?)(?:\.|$)/gi,
      /I don't (?:like|want|prefer|enjoy) (.+?)(?:\.|$)/gi,
      /My preference is (.+?)(?:\.|$)/gi,
    ]

    // Fact patterns
    const factPatterns = [
      /I (?:am|work as|study|live in) (.+?)(?:\.|$)/gi,
      /My (?:name|job|role|hobby|interest) is (.+?)(?:\.|$)/gi,
      /I have (.+?)(?:\.|$)/gi,
    ]

    // Goal patterns
    const goalPatterns = [
      /I (?:want to|need to|plan to|goal is to) (.+?)(?:\.|$)/gi,
      /I'm (?:trying to|working on|learning) (.+?)(?:\.|$)/gi,
    ]

    const combined = `${userMessage} ${assistantMessage}`.toLowerCase()

    // Extract preferences
    preferencePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(combined)) !== null) {
        const content = match[1].trim()
        if (content.length > 10 && content.length < 200) {
          suggestions.push({
            type: "preference",
            content: `User ${match[0].includes("don't") ? "doesn't" : ""} prefers: ${content}`,
            importance: 2,
          })
        }
      }
    })

    // Extract facts
    factPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(combined)) !== null) {
        const content = match[1].trim()
        if (content.length > 3 && content.length < 200) {
          suggestions.push({
            type: "fact",
            content: `User ${match[0].split(" ")[1]}: ${content}`,
            importance: 2,
          })
        }
      }
    })

    // Extract goals
    goalPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(combined)) !== null) {
        const content = match[1].trim()
        if (content.length > 10 && content.length < 200) {
          suggestions.push({
            type: "goal",
            content: `User wants to: ${content}`,
            importance: 3,
          })
        }
      }
    })

    // Convert to full Memory objects (without saving yet)
    return suggestions.map(s => ({
      ...s,
      id: generateUUID(),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    }))
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<MemorySettings>) {
    this.settings = {
      ...this.settings,
      ...settings,
    }
  }

  /**
   * Get current settings
   */
  getSettings(): MemorySettings {
    return { ...this.settings }
  }

  /**
   * Extract memories using LLM
   * Uses a local model to analyze conversation and extract key facts
   */
  async extractMemoriesWithLLM(
    userMessage: string,
    assistantMessage: string,
    apiKey?: string
  ): Promise<Memory[]> {
    // Get existing memories to avoid duplicates
    const existingMemories = this.getAllMemories()
    const existingContent = existingMemories.map(m => m.content.toLowerCase()).join("; ")

    const extractionPrompt = `Analyze this conversation and extract key facts about the user that should be remembered long-term.

EXISTING MEMORIES (do NOT duplicate these):
${existingContent || "None yet"}

CONVERSATION:
User: "${userMessage}"
Assistant: "${assistantMessage}"

RULES:
1. Only extract NEW information not already in existing memories
2. Only include truly important, long-term relevant facts
3. Focus on: preferences, personal facts, goals, skills, work context
4. Ignore: temporary questions, greetings, one-time requests
5. Be concise - each memory should be 5-15 words
6. Return empty array [] if nothing worth remembering

Return ONLY a valid JSON array (no markdown, no explanation):
[{"type": "preference|fact|goal|skill|context", "content": "...", "importance": 1|2|3}]

importance: 1=low (nice to know), 2=medium (useful), 3=high (very important)`

    try {
      console.log("[Memory] Starting LLM extraction with model:", EXTRACTION_MODEL)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-openrouter-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: extractionPrompt }],
          model: EXTRACTION_MODEL,
          temperature: 0.3, // Low temp for consistent extraction
          maxTokens: 500,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Memory] Extraction API error:", response.status, errorText)
        return []
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ""
      console.log("[Memory] LLM response:", content)

      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.log("[Memory] No valid JSON in extraction response:", content.substring(0, 100))
        return []
      }

      let extracted
      try {
        extracted = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.error("[Memory] LLM extraction JSON parse error:", parseError)
        return []
      }
      console.log("[Memory] Parsed extraction:", extracted)

      if (!Array.isArray(extracted) || extracted.length === 0) {
        console.log("[Memory] No memories extracted (empty array)")
        return []
      }

      // Convert to Memory objects and deduplicate
      const newMemories: Memory[] = []

      for (const item of extracted) {
        console.log("[Memory] Processing item:", item)

        // Skip if too similar to existing memory
        const contentLower = item.content?.toLowerCase() || ""
        if (existingContent && existingContent.length > 0 && contentLower.length >= 30) {
          if (existingContent.includes(contentLower.substring(0, 30))) {
            console.log("[Memory] Skipping duplicate:", item.content?.substring(0, 40))
            continue
          }
        }

        // Validate structure
        if (!item.type || !item.content || item.importance === undefined) {
          console.log("[Memory] Skipping invalid item (missing fields):", item)
          continue
        }

        if (!["preference", "fact", "goal", "skill", "context"].includes(item.type)) {
          console.log("[Memory] Skipping invalid type:", item.type)
          continue
        }

        if (![1, 2, 3].includes(item.importance)) {
          console.log("[Memory] Invalid importance, defaulting to 2:", item.importance)
          item.importance = 2
        }

        const memory: Memory = {
          id: generateUUID(),
          type: item.type,
          content: item.content,
          importance: item.importance,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          accessCount: 0,
        }

        newMemories.push(memory)
        console.log("[Memory] Added to newMemories:", memory.type, "-", memory.content)
      }

      // Auto-save the new memories
      for (const memory of newMemories) {
        this.memories.push(memory)
        console.log("[Memory] Auto-saved:", memory.type, "-", memory.content)
      }

      if (newMemories.length > 0) {
        this.saveMemories()
      }

      return newMemories
    } catch (error) {
      console.error("[Memory] LLM extraction error:", error)
      return []
    }
  }

  /**
   * Check if conversation qualifies for memory extraction
   * Requires 4+ messages (2 user + 2 assistant minimum)
   */
  shouldExtractMemories(messageCount: number): boolean {
    const shouldExtract = this.settings.enabled && this.settings.autoExtract && messageCount >= 4
    console.log("[Memory] shouldExtractMemories check:", {
      enabled: this.settings.enabled,
      autoExtract: this.settings.autoExtract,
      messageCount,
      required: 4,
      result: shouldExtract
    })
    return shouldExtract
  }
}

// Export singleton instance
export const memoryService = new MemoryService()
