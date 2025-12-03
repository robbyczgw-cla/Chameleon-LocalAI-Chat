import type { Chat, Message } from "@/types"

interface SearchIndex {
  // Word -> { chatId -> { messageIds: string[], titleMatch: boolean } }
  index: Map<string, Map<string, { messageIds: Set<string>; titleMatch: boolean }>>
  lastUpdate: number
}

interface SearchResult {
  chatId: string
  score: number
  titleMatch: boolean
  messageMatches: string[]
}

class SearchService {
  private index: SearchIndex | null = null
  private indexing = false

  /**
   * Build search index from chats
   */
  buildIndex(chats: Chat[]): void {
    if (this.indexing) return

    this.indexing = true
    const startTime = performance.now()

    const index = new Map<string, Map<string, { messageIds: Set<string>; titleMatch: boolean }>>()

    chats.forEach((chat) => {
      // Index title words
      const titleWords = this.tokenize(chat.title)
      titleWords.forEach((word) => {
        if (!index.has(word)) {
          index.set(word, new Map())
        }
        const chatMap = index.get(word)!
        if (!chatMap.has(chat.id)) {
          chatMap.set(chat.id, { messageIds: new Set(), titleMatch: true })
        } else {
          chatMap.get(chat.id)!.titleMatch = true
        }
      })

      // Index message content
      chat.messages.forEach((message) => {
        const contentWords = this.tokenize(message.content)
        contentWords.forEach((word) => {
          if (!index.has(word)) {
            index.set(word, new Map())
          }
          const chatMap = index.get(word)!
          if (!chatMap.has(chat.id)) {
            chatMap.set(chat.id, { messageIds: new Set([message.id]), titleMatch: false })
          } else {
            chatMap.get(chat.id)!.messageIds.add(message.id)
          }
        })
      })
    })

    this.index = {
      index,
      lastUpdate: Date.now(),
    }
    this.indexing = false

    const buildTime = performance.now() - startTime
    console.log(`[SearchService] Index built in ${buildTime.toFixed(2)}ms with ${index.size} unique terms`)
  }

  /**
   * Tokenize text into searchable words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .split(/\s+/)
      .filter((word) => word.length > 1) // Filter very short words
  }

  /**
   * Search for query across indexed chats
   */
  search(query: string, chats: Chat[], limit = 50): SearchResult[] {
    if (!query.trim()) return []

    // Build index if not exists or stale
    if (!this.index || Date.now() - this.index.lastUpdate > 60000) {
      this.buildIndex(chats)
    }

    const queryWords = this.tokenize(query)
    if (queryWords.length === 0) return []

    // Score each chat based on query words
    const chatScores = new Map<string, { score: number; titleMatch: boolean; messageIds: Set<string> }>()

    queryWords.forEach((queryWord, index) => {
      // Exact match
      if (this.index!.index.has(queryWord)) {
        const chatMap = this.index!.index.get(queryWord)!
        chatMap.forEach((data, chatId) => {
          const existing = chatScores.get(chatId)
          const wordScore = (queryWords.length - index) * 10 // Earlier words score higher
          const titleBonus = data.titleMatch ? 50 : 0
          const messageBonus = data.messageIds.size * 5

          if (existing) {
            existing.score += wordScore + titleBonus + messageBonus
            existing.titleMatch = existing.titleMatch || data.titleMatch
            data.messageIds.forEach((id) => existing.messageIds.add(id))
          } else {
            chatScores.set(chatId, {
              score: wordScore + titleBonus + messageBonus,
              titleMatch: data.titleMatch,
              messageIds: new Set(data.messageIds),
            })
          }
        })
      }

      // Prefix match (fuzzy)
      this.index!.index.forEach((chatMap, indexedWord) => {
        if (indexedWord.startsWith(queryWord) && indexedWord !== queryWord) {
          chatMap.forEach((data, chatId) => {
            const existing = chatScores.get(chatId)
            const wordScore = (queryWords.length - index) * 5 // Half score for prefix match
            const titleBonus = data.titleMatch ? 25 : 0
            const messageBonus = data.messageIds.size * 2

            if (existing) {
              existing.score += wordScore + titleBonus + messageBonus
              existing.titleMatch = existing.titleMatch || data.titleMatch
              data.messageIds.forEach((id) => existing.messageIds.add(id))
            } else {
              chatScores.set(chatId, {
                score: wordScore + titleBonus + messageBonus,
                titleMatch: data.titleMatch,
                messageIds: new Set(data.messageIds),
              })
            }
          })
        }
      })
    })

    // Convert to results and sort by score
    const results: SearchResult[] = []
    chatScores.forEach((data, chatId) => {
      results.push({
        chatId,
        score: data.score,
        titleMatch: data.titleMatch,
        messageMatches: Array.from(data.messageIds),
      })
    })

    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Force rebuild index
   */
  invalidateIndex(): void {
    this.index = null
  }

  /**
   * Check if index is fresh
   */
  isIndexFresh(): boolean {
    if (!this.index) return false
    return Date.now() - this.index.lastUpdate < 60000
  }
}

export const searchService = new SearchService()
