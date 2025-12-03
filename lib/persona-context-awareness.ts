/**
 * Persona Context Awareness Service
 * Detects time of day, mood, and tracks conversation topics
 */

export interface ContextAwarenessData {
  timeOfDay: "morning" | "afternoon" | "evening" | "night"
  greeting: string
  mood: "positive" | "neutral" | "negative" | "unknown"
  topics: string[]
}

class PersonaContextAwarenessService {
  /**
   * Get current time of day
   */
  getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
    const hour = new Date().getHours()

    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 17) return "afternoon"
    if (hour >= 17 && hour < 21) return "evening"
    return "night"
  }

  /**
   * Generate time-based greeting
   */
  getTimeBasedGreeting(): string {
    const timeOfDay = this.getTimeOfDay()

    const greetings = {
      morning: [
        "Guten Morgen!",
        "Einen wunderschönen Morgen!",
        "Hallo! Früh wach heute!",
        "Morgen! Schon fleißig?",
      ],
      afternoon: [
        "Guten Tag!",
        "Hallo! Wie läuft dein Tag?",
        "Na, alles klar?",
        "Hey! Schön dich zu sehen!",
      ],
      evening: [
        "Guten Abend!",
        "Na, wie war dein Tag?",
        "Abend! Noch fleißig?",
        "Hey! Arbeitest du noch oder entspannst du schon?",
      ],
      night: [
        "Gute Nacht!",
        "Arbeitest du noch so spät?",
        "Wow, Nachteule!",
        "Hey! Noch wach?",
      ],
    }

    const options = greetings[timeOfDay]
    return options[Math.floor(Math.random() * options.length)]
  }

  /**
   * Detect mood from user's message
   * Simple sentiment analysis based on keywords and patterns
   */
  detectMood(message: string): "positive" | "neutral" | "negative" | "unknown" {
    if (!message || message.trim().length === 0) return "unknown"

    const messageLower = message.toLowerCase()

    // Positive indicators
    const positiveKeywords = [
      "danke",
      "super",
      "toll",
      "großartig",
      "perfekt",
      "gut",
      "genial",
      "cool",
      "freue",
      "liebe",
      "yeah",
      "yes",
      "ja",
      "😊",
      "😄",
      "🎉",
      "❤️",
      "👍",
      "✨",
      "🙂",
      "😁",
      "🤩",
    ]

    // Negative indicators
    const negativeKeywords = [
      "schlecht",
      "problem",
      "fehler",
      "schade",
      "leider",
      "ärgerlich",
      "nervt",
      "doof",
      "traurig",
      "stress",
      "schwierig",
      "kompliziert",
      "help",
      "hilfe",
      "😢",
      "😭",
      "😞",
      "😔",
      "☹️",
      "😤",
      "😡",
      "💔",
    ]

    // Punctuation analysis
    const hasExclamation = /!+/.test(message)
    const hasQuestion = /\?+/.test(message)
    const hasCapsLock = message.toUpperCase() === message && message.length > 5

    let positiveScore = 0
    let negativeScore = 0

    // Count keyword matches
    positiveKeywords.forEach((keyword) => {
      if (messageLower.includes(keyword)) positiveScore++
    })

    negativeKeywords.forEach((keyword) => {
      if (messageLower.includes(keyword)) negativeScore++
    })

    // Adjust scores based on punctuation
    if (hasExclamation && positiveScore > 0) positiveScore += 0.5
    if (hasQuestion && negativeScore > 0) negativeScore += 0.5
    if (hasCapsLock) negativeScore += 1 // Caps lock often indicates frustration

    // Determine mood
    if (positiveScore > negativeScore && positiveScore > 0) return "positive"
    if (negativeScore > positiveScore && negativeScore > 0) return "negative"
    if (positiveScore === 0 && negativeScore === 0) return "neutral"

    return "unknown"
  }

  /**
   * Get mood-based response modifier
   */
  getMoodResponseModifier(mood: "positive" | "neutral" | "negative" | "unknown"): string {
    switch (mood) {
      case "positive":
        return "Der Nutzer scheint in guter Stimmung zu sein. Sei enthusiastisch und teile die positive Energie!"
      case "negative":
        return "Der Nutzer scheint frustriert oder gestresst zu sein. Sei besonders geduldig, verständnisvoll und hilfsbereit."
      case "neutral":
        return "Der Nutzer ist sachlich unterwegs. Bleibe professionell und fokussiert."
      default:
        return ""
    }
  }

  /**
   * Extract topics from conversation
   */
  extractConversationTopics(messages: string[]): string[] {
    const allText = messages.join(" ").toLowerCase()

    // Common stop words (German + English)
    const stopWords = new Set([
      // German
      "der",
      "die",
      "das",
      "und",
      "oder",
      "aber",
      "ist",
      "sind",
      "ein",
      "eine",
      "mit",
      "von",
      "zu",
      "für",
      "auf",
      "in",
      "ich",
      "du",
      "er",
      "sie",
      "es",
      "wir",
      "ihr",
      "mein",
      "dein",
      "sein",
      "wie",
      "was",
      "wer",
      "wo",
      "warum",
      "wenn",
      "dann",
      "nicht",
      "kann",
      "will",
      "habe",
      "hat",
      "bitte",
      "danke",
      // English
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
      "your",
      "have",
      "has",
      "can",
      "will",
      "would",
      "could",
      "please",
      "thanks",
    ])

    // Extract words (4+ characters)
    const words = allText.match(/\b\w{4,}\b/g) || []
    const wordFreq = new Map<string, number>()

    words.forEach((word) => {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })

    // Get top topics (minimum 2 occurrences)
    return Array.from(wordFreq.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  /**
   * Generate full context awareness data
   */
  generateContextData(userMessages: string[]): ContextAwarenessData {
    const timeOfDay = this.getTimeOfDay()
    const greeting = this.getTimeBasedGreeting()

    // Analyze most recent message for mood
    const latestMessage = userMessages[userMessages.length - 1] || ""
    const mood = this.detectMood(latestMessage)

    // Extract topics from all messages
    const topics = this.extractConversationTopics(userMessages)

    return {
      timeOfDay,
      greeting,
      mood,
      topics,
    }
  }

  /**
   * Format context for system prompt injection
   */
  formatContextForPrompt(
    contextData: ContextAwarenessData,
    personaName: string,
    options: {
      useTimeBasedGreetings?: boolean
      detectMood?: boolean
      trackTopics?: boolean
    }
  ): string {
    const parts: string[] = []

    parts.push(`\n🎯 Context Awareness (${personaName}):\n`)

    if (options.useTimeBasedGreetings) {
      parts.push(`⏰ Zeit: ${contextData.timeOfDay} - Verwende passende Begrüßungen wie "${contextData.greeting}"`)
    }

    if (options.detectMood && contextData.mood !== "unknown") {
      const moodModifier = this.getMoodResponseModifier(contextData.mood)
      parts.push(`💭 Stimmung: ${contextData.mood} - ${moodModifier}`)
    }

    if (options.trackTopics && contextData.topics.length > 0) {
      parts.push(`📌 Aktuelle Themen: ${contextData.topics.join(", ")} - Beziehe dich darauf wenn relevant.`)
    }

    return parts.join("\n")
  }
}

// Export singleton instance
export const personaContextAwareness = new PersonaContextAwarenessService()
