/**
 * Persona Memory Service
 * Allows each persona to remember past conversations with the user
 */

const STORAGE_KEY = "persona-memories"
const MAX_CONVERSATIONS_DEFAULT = 10
const MAX_CONTEXT_LENGTH = 2000 // Max characters to include in context

export interface PersonaConversation {
  id: string
  personaId: string
  timestamp: number
  summary: string // Summary of what was discussed
  topics: string[] // Key topics covered
  userMessages: string[] // Sample user messages
  assistantMessages: string[] // Sample assistant responses
}

export interface PersonaMemoryStore {
  [personaId: string]: PersonaConversation[]
}

class PersonaMemoryService {
  private memories: PersonaMemoryStore = {}

  constructor() {
    this.loadMemories()
  }

  /**
   * Load memories from localStorage
   */
  private loadMemories(): void {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.memories = JSON.parse(stored)
        console.log("[PersonaMemory] Loaded memories for", Object.keys(this.memories).length, "personas")
      }
    } catch (error) {
      console.error("[PersonaMemory] Failed to load memories:", error)
      this.memories = {}
    }
  }

  /**
   * Save memories to localStorage
   */
  private saveMemories(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories))
    } catch (error) {
      console.error("[PersonaMemory] Failed to save memories:", error)
    }
  }

  /**
   * Add a conversation to persona's memory
   */
  addConversation(
    personaId: string,
    summary: string,
    topics: string[],
    userMessages: string[],
    assistantMessages: string[],
    maxConversations: number = MAX_CONVERSATIONS_DEFAULT
  ): void {
    if (!this.memories[personaId]) {
      this.memories[personaId] = []
    }

    const conversation: PersonaConversation = {
      id: `conv-${Date.now()}`,
      personaId,
      timestamp: Date.now(),
      summary,
      topics,
      userMessages: userMessages.slice(0, 3), // Keep first 3 messages
      assistantMessages: assistantMessages.slice(0, 3),
    }

    this.memories[personaId].unshift(conversation)

    // Limit to max conversations
    if (this.memories[personaId].length > maxConversations) {
      this.memories[personaId] = this.memories[personaId].slice(0, maxConversations)
    }

    this.saveMemories()
    console.log(`[PersonaMemory] Added conversation for ${personaId}. Total: ${this.memories[personaId].length}`)
  }

  /**
   * Get all conversations for a persona
   */
  getConversations(personaId: string): PersonaConversation[] {
    return this.memories[personaId] || []
  }

  /**
   * Get relevant past conversations based on current query
   */
  getRelevantConversations(personaId: string, query: string, maxResults: number = 3): PersonaConversation[] {
    const conversations = this.getConversations(personaId)
    if (conversations.length === 0) return []

    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 3)

    // Score each conversation based on relevance
    const scored = conversations.map((conv) => {
      let score = 0
      const convText = `${conv.summary} ${conv.topics.join(" ")}`.toLowerCase()

      // Check topic overlap
      queryWords.forEach((word) => {
        if (convText.includes(word)) {
          score += 2
        }
      })

      // Prefer recent conversations (recency boost)
      const ageInDays = (Date.now() - conv.timestamp) / (1000 * 60 * 60 * 24)
      if (ageInDays < 1) score += 3
      else if (ageInDays < 7) score += 2
      else if (ageInDays < 30) score += 1

      return { conversation: conv, score }
    })

    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .filter((item) => item.score > 0)
      .map((item) => item.conversation)
  }

  /**
   * Format conversations for context injection
   */
  formatConversationsForContext(conversations: PersonaConversation[]): string {
    if (conversations.length === 0) return ""

    let context = "📚 Past Conversations (Persona Memory):\n\n"

    conversations.forEach((conv, index) => {
      const timeAgo = this.getTimeAgo(conv.timestamp)
      context += `[${index + 1}] ${timeAgo}:\n`
      context += `Summary: ${conv.summary}\n`
      if (conv.topics.length > 0) {
        context += `Topics: ${conv.topics.join(", ")}\n`
      }
      context += "\n"
    })

    // Limit context length
    if (context.length > MAX_CONTEXT_LENGTH) {
      context = context.substring(0, MAX_CONTEXT_LENGTH) + "...(truncated)"
    }

    return context + "\nPlease reference these past conversations when relevant, showing continuity and memory."
  }

  /**
   * Generate a summary of a conversation (simplified version)
   * In production, this could use an LLM to generate better summaries
   */
  generateSummary(userMessages: string[], assistantMessages: string[]): string {
    const allText = [...userMessages, ...assistantMessages].join(" ")

    // Extract first meaningful sentence or first 100 chars
    const firstSentence = allText.split(/[.!?]/)[0]
    if (firstSentence && firstSentence.length > 10) {
      return firstSentence.trim().substring(0, 150)
    }

    return allText.substring(0, 150).trim()
  }

  /**
   * Extract topics from conversation
   */
  extractTopics(userMessages: string[], assistantMessages: string[]): string[] {
    const allText = [...userMessages, ...assistantMessages].join(" ").toLowerCase()

    // Simple keyword extraction (could be improved with NLP)
    const commonWords = new Set([
      "the",
      "is",
      "at",
      "which",
      "on",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "with",
      "to",
      "for",
      "of",
      "as",
      "by",
      "that",
      "this",
      "it",
      "from",
      "they",
      "we",
      "you",
      "me",
      "i",
      "my",
    ])

    const words = allText.match(/\b\w{4,}\b/g) || []
    const wordFreq = new Map<string, number>()

    words.forEach((word) => {
      if (!commonWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })

    // Get top 5 most frequent words as topics
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  /**
   * Get time ago string
   */
  private getTimeAgo(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    if (days === 1) return "yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  /**
   * Clear all memories for a persona
   */
  clearPersonaMemories(personaId: string): void {
    delete this.memories[personaId]
    this.saveMemories()
    console.log(`[PersonaMemory] Cleared memories for ${personaId}`)
  }

  /**
   * Clear all memories
   */
  clearAllMemories(): void {
    this.memories = {}
    this.saveMemories()
    console.log("[PersonaMemory] Cleared all persona memories")
  }

  /**
   * Get statistics about persona memories
   */
  getStats(personaId: string): { totalConversations: number; oldestTimestamp: number; newestTimestamp: number } {
    const conversations = this.getConversations(personaId)

    if (conversations.length === 0) {
      return { totalConversations: 0, oldestTimestamp: 0, newestTimestamp: 0 }
    }

    const timestamps = conversations.map((c) => c.timestamp)
    return {
      totalConversations: conversations.length,
      oldestTimestamp: Math.min(...timestamps),
      newestTimestamp: Math.max(...timestamps),
    }
  }
}

// Export singleton instance
export const personaMemoryService = new PersonaMemoryService()
