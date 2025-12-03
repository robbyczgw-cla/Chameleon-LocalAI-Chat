/**
 * Persona Preferences Service
 * Learns user's preferences, styles, and interests through conversations
 * Works together with Persona Memory to extract patterns
 */

const STORAGE_KEY = "persona-preferences"

export type PreferenceCategory =
  | "coding_style"
  | "interests"
  | "communication_style"
  | "topics"
  | "tools"
  | "languages"
  | "work_patterns"
  | "personal"

export interface LearnedPreference {
  category: PreferenceCategory
  key: string // e.g., "preferred_language", "coding_style", "interest_topic"
  value: string // The actual preference value
  confidence: number // 0-1, how confident we are about this preference
  lastUpdated: number
  occurrences: number // How many times we've observed this
  examples: string[] // Example quotes where we learned this
}

export interface PersonaPreferences {
  [personaId: string]: {
    preferences: LearnedPreference[]
    totalInteractions: number
    relationshipDepth: number // 0-100, calculated based on interactions
    relationshipStage: string // "Just Met", "Acquaintance", etc.
    firstInteraction: number
    lastInteraction: number
  }
}

const RELATIONSHIP_STAGES = [
  { threshold: 0, name: "Gerade kennengelernt", emoji: "👋" },
  { threshold: 10, name: "Bekanntschaft", emoji: "🤝" },
  { threshold: 25, name: "Freund", emoji: "😊" },
  { threshold: 50, name: "Guter Freund", emoji: "🌟" },
  { threshold: 75, name: "Vertrauter", emoji: "💎" },
  { threshold: 95, name: "Seelenverwandter", emoji: "✨" },
]

class PersonaPreferencesService {
  private preferences: PersonaPreferences = {}

  constructor() {
    this.loadPreferences()
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.preferences = JSON.parse(stored)
        console.log("[PersonaPreferences] Loaded preferences for", Object.keys(this.preferences).length, "personas")
      }
    } catch (error) {
      console.error("[PersonaPreferences] Failed to load preferences:", error)
      this.preferences = {}
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences))
    } catch (error) {
      console.error("[PersonaPreferences] Failed to save preferences:", error)
    }
  }

  /**
   * Initialize persona preferences if not exists
   */
  private initPersona(personaId: string): void {
    if (!this.preferences[personaId]) {
      this.preferences[personaId] = {
        preferences: [],
        totalInteractions: 0,
        relationshipDepth: 0,
        relationshipStage: RELATIONSHIP_STAGES[0].name,
        firstInteraction: Date.now(),
        lastInteraction: Date.now(),
      }
    }
  }

  /**
   * Track an interaction and update relationship depth
   */
  recordInteraction(
    personaId: string,
    messageLength: number,
    hasCodeBlocks: boolean = false,
    topicDepth: "shallow" | "medium" | "deep" = "medium"
  ): void {
    this.initPersona(personaId)
    const persona = this.preferences[personaId]

    persona.totalInteractions++
    persona.lastInteraction = Date.now()

    // Calculate depth increase based on interaction quality
    let depthIncrease = 0.5 // Base increase

    // Longer messages = deeper conversation
    if (messageLength > 200) depthIncrease += 0.3
    if (messageLength > 500) depthIncrease += 0.5

    // Code sharing = trust/collaboration
    if (hasCodeBlocks) depthIncrease += 0.4

    // Topic depth
    if (topicDepth === "deep") depthIncrease += 0.6
    else if (topicDepth === "medium") depthIncrease += 0.3

    // Frequency bonus (regular conversations deepen relationship)
    const daysSinceFirst = (Date.now() - persona.firstInteraction) / (1000 * 60 * 60 * 24)
    if (daysSinceFirst < 1 && persona.totalInteractions > 5) {
      depthIncrease += 0.5 // Rapid bonding in first day
    }

    // Update depth (max 100)
    const oldDepth = persona.relationshipDepth
    persona.relationshipDepth = Math.min(100, persona.relationshipDepth + depthIncrease)

    // Update relationship stage
    const newStage = this.getRelationshipStage(persona.relationshipDepth)
    const oldStage = persona.relationshipStage

    if (newStage !== oldStage) {
      persona.relationshipStage = newStage
      console.log(`[PersonaPreferences] 🎉 Relationship evolved: ${oldStage} → ${newStage}`)

      // Trigger level up event
      window.dispatchEvent(
        new CustomEvent("personaLevelUp", {
          detail: { personaId, newStage, oldStage, depth: persona.relationshipDepth },
        })
      )
    }

    this.savePreferences()
  }

  /**
   * Get relationship stage based on depth
   */
  getRelationshipStage(depth: number): string {
    for (let i = RELATIONSHIP_STAGES.length - 1; i >= 0; i--) {
      if (depth >= RELATIONSHIP_STAGES[i].threshold) {
        return RELATIONSHIP_STAGES[i].name
      }
    }
    return RELATIONSHIP_STAGES[0].name
  }

  /**
   * Get relationship stage emoji
   */
  getRelationshipEmoji(stage: string): string {
    const found = RELATIONSHIP_STAGES.find((s) => s.name === stage)
    return found?.emoji || "👋"
  }

  /**
   * Learn a preference from conversation
   */
  learnPreference(
    personaId: string,
    category: PreferenceCategory,
    key: string,
    value: string,
    example: string
  ): void {
    this.initPersona(personaId)
    const persona = this.preferences[personaId]

    // Find existing preference
    const existingIndex = persona.preferences.findIndex((p) => p.category === category && p.key === key)

    if (existingIndex >= 0) {
      const existing = persona.preferences[existingIndex]

      // If same value, increase confidence
      if (existing.value === value) {
        existing.occurrences++
        existing.confidence = Math.min(1, existing.confidence + 0.1)
        existing.lastUpdated = Date.now()
        if (existing.examples.length < 3) {
          existing.examples.push(example)
        }
      } else {
        // Different value - check if we should replace
        if (existing.occurrences < 3) {
          // Low confidence, replace
          existing.value = value
          existing.occurrences = 1
          existing.confidence = 0.5
          existing.lastUpdated = Date.now()
          existing.examples = [example]
        }
        // Otherwise keep the more established preference
      }
    } else {
      // New preference
      persona.preferences.push({
        category,
        key,
        value,
        confidence: 0.5,
        lastUpdated: Date.now(),
        occurrences: 1,
        examples: [example],
      })
    }

    this.savePreferences()
  }

  /**
   * Extract preferences from conversation messages
   * This works with persona memory to analyze patterns
   */
  extractPreferencesFromConversation(
    personaId: string,
    userMessages: string[],
    assistantMessages: string[]
  ): void {
    const allText = [...userMessages, ...assistantMessages].join(" ")

    // Detect coding style preferences
    this.detectCodingPreferences(personaId, allText, userMessages)

    // Detect interests
    this.detectInterests(personaId, allText, userMessages)

    // Detect communication style
    this.detectCommunicationStyle(personaId, userMessages)

    // Detect tools and languages
    this.detectToolsAndLanguages(personaId, allText)
  }

  /**
   * Detect coding style preferences
   */
  private detectCodingPreferences(personaId: string, text: string, userMessages: string[]): void {
    // Detect preferred programming language
    const languages = {
      Python: /\b(python|py|django|flask|pandas|numpy)\b/gi,
      JavaScript: /\b(javascript|js|node|react|vue|angular|typescript|ts)\b/gi,
      Java: /\b(java|spring|maven|gradle)\b/gi,
      "C++": /\b(c\+\+|cpp|cmake)\b/gi,
      Rust: /\b(rust|cargo)\b/gi,
      Go: /\b(golang|go)\b/gi,
    }

    Object.entries(languages).forEach(([lang, pattern]) => {
      const matches = text.match(pattern)
      if (matches && matches.length > 2) {
        this.learnPreference(
          personaId,
          "coding_style",
          "preferred_language",
          lang,
          `Mentioned ${lang} ${matches.length} times`
        )
      }
    })

    // Detect code style patterns
    if (/\bfunctional programming\b/gi.test(text)) {
      this.learnPreference(
        personaId,
        "coding_style",
        "paradigm",
        "functional",
        "Discusses functional programming"
      )
    }
    if (/\boop\b|object.?oriented/gi.test(text)) {
      this.learnPreference(personaId, "coding_style", "paradigm", "OOP", "Discusses OOP")
    }
  }

  /**
   * Detect user interests
   */
  private detectInterests(personaId: string, text: string, userMessages: string[]): void {
    const interests = {
      "Machine Learning": /\b(machine learning|ml|neural network|deep learning|ai|artificial intelligence)\b/gi,
      "Web Development": /\b(web dev|frontend|backend|fullstack|api|rest)\b/gi,
      "Data Science": /\b(data science|analytics|visualization|statistics)\b/gi,
      Gaming: /\b(game dev|gaming|unity|unreal|godot)\b/gi,
      DevOps: /\b(devops|docker|kubernetes|ci\/cd|deployment)\b/gi,
      Security: /\b(security|encryption|authentication|cybersecurity)\b/gi,
    }

    Object.entries(interests).forEach(([interest, pattern]) => {
      const matches = text.match(pattern)
      if (matches && matches.length > 1) {
        this.learnPreference(personaId, "interests", interest.toLowerCase().replace(" ", "_"), interest, `${matches.length} mentions`)
      }
    })
  }

  /**
   * Detect communication style
   */
  private detectCommunicationStyle(personaId: string, userMessages: string[]): void {
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.length, 0) / userMessages.length

    if (avgLength < 50) {
      this.learnPreference(personaId, "communication_style", "message_length", "concise", "Short messages")
    } else if (avgLength > 200) {
      this.learnPreference(personaId, "communication_style", "message_length", "detailed", "Long messages")
    }

    // Detect formality
    const formalWords = userMessages.join(" ").match(/\b(please|thank you|appreciate|kindly|regards)\b/gi)
    const casualWords = userMessages.join(" ").match(/\b(hey|yeah|nah|cool|awesome|lol)\b/gi)

    if (formalWords && formalWords.length > casualWords?.length || 0) {
      this.learnPreference(personaId, "communication_style", "formality", "formal", "Uses formal language")
    } else if (casualWords && casualWords.length > 2) {
      this.learnPreference(personaId, "communication_style", "formality", "casual", "Uses casual language")
    }
  }

  /**
   * Detect tools and languages
   */
  private detectToolsAndLanguages(personaId: string, text: string): void {
    const tools = {
      Git: /\bgit\b/gi,
      VSCode: /\b(vscode|vs code|visual studio code)\b/gi,
      Docker: /\bdocker\b/gi,
      Linux: /\b(linux|ubuntu|debian)\b/gi,
      AWS: /\baws\b|amazon web services/gi,
    }

    Object.entries(tools).forEach(([tool, pattern]) => {
      if (pattern.test(text)) {
        this.learnPreference(personaId, "tools", tool.toLowerCase(), tool, `Uses ${tool}`)
      }
    })
  }

  /**
   * Get all preferences for a persona
   */
  getPreferences(personaId: string): LearnedPreference[] {
    return this.preferences[personaId]?.preferences || []
  }

  /**
   * Get high-confidence preferences (0.7+)
   */
  getHighConfidencePreferences(personaId: string): LearnedPreference[] {
    return this.getPreferences(personaId).filter((p) => p.confidence >= 0.7)
  }

  /**
   * Get preferences by category
   */
  getPreferencesByCategory(personaId: string, category: PreferenceCategory): LearnedPreference[] {
    return this.getPreferences(personaId).filter((p) => p.category === category)
  }

  /**
   * Format preferences for context injection
   */
  formatPreferencesForContext(personaId: string, personaName: string): string {
    const prefs = this.getHighConfidencePreferences(personaId)
    if (prefs.length === 0) return ""

    const persona = this.preferences[personaId]
    const stage = persona?.relationshipStage || "Just Met"
    const emoji = this.getRelationshipEmoji(stage)

    let context = `\n${emoji} Gelernte Präferenzen von ${personaName} (Beziehung: ${stage}):\n\n`

    // Group by category
    const grouped = new Map<PreferenceCategory, LearnedPreference[]>()
    prefs.forEach((pref) => {
      if (!grouped.has(pref.category)) grouped.set(pref.category, [])
      grouped.get(pref.category)!.push(pref)
    })

    grouped.forEach((preferences, category) => {
      const categoryName = {
        coding_style: "💻 Code-Stil",
        interests: "⭐ Interessen",
        communication_style: "💬 Kommunikation",
        tools: "🛠️ Tools",
        languages: "🌐 Sprachen",
        topics: "📚 Themen",
        work_patterns: "⏰ Arbeitsmuster",
        personal: "👤 Persönliches",
      }[category]

      context += `${categoryName}:\n`
      preferences.forEach((p) => {
        context += `  - ${p.key}: ${p.value}\n`
      })
    })

    context += `\nNutze diese Präferenzen, um deine Antworten zu personalisieren!`

    return context
  }

  /**
   * Get relationship stats
   */
  getRelationshipStats(personaId: string) {
    const persona = this.preferences[personaId]
    if (!persona) {
      return {
        depth: 0,
        stage: RELATIONSHIP_STAGES[0].name,
        emoji: RELATIONSHIP_STAGES[0].emoji,
        totalInteractions: 0,
        daysTogether: 0,
      }
    }

    const daysTogether = Math.floor((Date.now() - persona.firstInteraction) / (1000 * 60 * 60 * 24))

    return {
      depth: persona.relationshipDepth,
      stage: persona.relationshipStage,
      emoji: this.getRelationshipEmoji(persona.relationshipStage),
      totalInteractions: persona.totalInteractions,
      daysTogether,
      firstMet: persona.firstInteraction,
      lastSeen: persona.lastInteraction,
    }
  }

  /**
   * Clear all preferences for a persona
   */
  clearPersonaPreferences(personaId: string): void {
    delete this.preferences[personaId]
    this.savePreferences()
    console.log(`[PersonaPreferences] Cleared preferences for ${personaId}`)
  }
}

// Export singleton instance
export const personaPreferencesService = new PersonaPreferencesService()
