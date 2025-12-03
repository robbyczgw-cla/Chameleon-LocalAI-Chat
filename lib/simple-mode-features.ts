/**
 * Simple Mode Features - Streaks, Achievements, Creative Corner
 * Pet companion feature removed for local-first edition
 */

// ==================== STREAKS ====================

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string // YYYY-MM-DD format
  totalDaysActive: number
  weeklyActivity: boolean[] // Last 7 days, index 0 = today
}

const STREAK_STORAGE_KEY = "chameleon-streaks"

export const streakService = {
  getStreaks(): StreakData {
    if (typeof window === "undefined") {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: "", totalDaysActive: 0, weeklyActivity: [] }
    }
    try {
      const stored = localStorage.getItem(STREAK_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: "", totalDaysActive: 0, weeklyActivity: [] }
  },

  saveStreaks(data: StreakData): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data))
  },

  recordActivity(): StreakData {
    const today = new Date().toISOString().split("T")[0]
    const data = this.getStreaks()

    if (data.lastActiveDate === today) {
      // Already recorded today
      return data
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
    let newStreak = data.currentStreak

    if (data.lastActiveDate === yesterday) {
      // Continuing streak
      newStreak += 1
    } else if (data.lastActiveDate !== today) {
      // Streak broken
      newStreak = 1
    }

    // Update weekly activity
    const weeklyActivity = [true, ...data.weeklyActivity.slice(0, 6)]

    // Check if we need to shift for missed days
    if (data.lastActiveDate && data.lastActiveDate !== yesterday && data.lastActiveDate !== today) {
      const lastDate = new Date(data.lastActiveDate)
      const daysSinceLast = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
      const missedDays = Math.min(daysSinceLast - 1, 6)
      const falseArray = new Array(missedDays).fill(false)
      weeklyActivity.splice(1, 0, ...falseArray)
      weeklyActivity.splice(7)
    }

    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(data.longestStreak, newStreak),
      lastActiveDate: today,
      totalDaysActive: data.totalDaysActive + 1,
      weeklyActivity,
    }

    this.saveStreaks(updated)
    return updated
  },

  getStreakEmoji(streak: number): string {
    if (streak >= 365) return "👑"
    if (streak >= 100) return "💎"
    if (streak >= 30) return "🌟"
    if (streak >= 7) return "🔥"
    if (streak >= 3) return "✨"
    return "⭐"
  },
}

// ==================== ACHIEVEMENTS ====================

export type AchievementId =
  | "first_message"
  | "first_image"
  | "messages_10"
  | "messages_100"
  | "messages_1000"
  | "night_owl"
  | "early_bird"
  | "persona_explorer"
  | "creative_writer"
  | "curious_mind"

export interface Achievement {
  id: AchievementId
  name: { en: string; de: string }
  description: { en: string; de: string }
  emoji: string
  unlockedAt?: number
  progress?: number
  maxProgress?: number
  secret?: boolean
}

const ACHIEVEMENTS_STORAGE_KEY = "chameleon-achievements"
const ACHIEVEMENTS_ENABLED_KEY = "chameleon-achievements-enabled"

export const defaultAchievements: Achievement[] = [
  {
    id: "first_message",
    name: { en: "First Steps", de: "Erste Schritte" },
    description: { en: "Send your first message", de: "Sende deine erste Nachricht" },
    emoji: "👋",
  },
  {
    id: "first_image",
    name: { en: "Artist", de: "Künstler" },
    description: { en: "Create your first image", de: "Erstelle dein erstes Bild" },
    emoji: "🎨",
  },
  {
    id: "messages_10",
    name: { en: "Conversationalist", de: "Gesprächig" },
    description: { en: "Send 10 messages", de: "Sende 10 Nachrichten" },
    emoji: "💬",
    maxProgress: 10,
  },
  {
    id: "messages_100",
    name: { en: "Chatterbox", de: "Plaudertasche" },
    description: { en: "Send 100 messages", de: "Sende 100 Nachrichten" },
    emoji: "🗣️",
    maxProgress: 100,
  },
  {
    id: "messages_1000",
    name: { en: "Power User", de: "Power-Nutzer" },
    description: { en: "Send 1000 messages", de: "Sende 1000 Nachrichten" },
    emoji: "⚡",
    maxProgress: 1000,
  },
  {
    id: "night_owl",
    name: { en: "Night Owl", de: "Nachteule" },
    description: { en: "Chat between 2-4 AM", de: "Chatte zwischen 2-4 Uhr nachts" },
    emoji: "🦉",
    secret: true,
  },
  {
    id: "early_bird",
    name: { en: "Early Bird", de: "Frühaufsteher" },
    description: { en: "Chat between 5-6 AM", de: "Chatte zwischen 5-6 Uhr morgens" },
    emoji: "🐦",
    secret: true,
  },
  {
    id: "persona_explorer",
    name: { en: "Persona Explorer", de: "Persona-Entdecker" },
    description: { en: "Try 5 different personas", de: "Probiere 5 verschiedene Personas" },
    emoji: "🎭",
    maxProgress: 5,
  },
  {
    id: "creative_writer",
    name: { en: "Creative Writer", de: "Kreativer Autor" },
    description: { en: "Use the Creative Corner 10 times", de: "Nutze die Kreativ-Ecke 10 mal" },
    emoji: "✍️",
    maxProgress: 10,
  },
  {
    id: "curious_mind",
    name: { en: "Curious Mind", de: "Wissbegierig" },
    description: { en: "Ask 50 questions", de: "Stelle 50 Fragen" },
    emoji: "🤔",
    maxProgress: 50,
  },
]

export const achievementService = {
  isEnabled(): boolean {
    if (typeof window === "undefined") return true
    return localStorage.getItem(ACHIEVEMENTS_ENABLED_KEY) !== "false"
  },

  setEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return
    localStorage.setItem(ACHIEVEMENTS_ENABLED_KEY, enabled ? "true" : "false")
  },

  getAchievements(): Achievement[] {
    if (typeof window === "undefined") return defaultAchievements
    try {
      const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)
      if (stored) {
        const saved = JSON.parse(stored) as Achievement[]
        // Merge with defaults to include any new achievements
        return defaultAchievements.map((def) => {
          const saved_item = saved.find((s) => s.id === def.id)
          return saved_item ? { ...def, ...saved_item } : def
        })
      }
    } catch {}
    return defaultAchievements
  },

  saveAchievements(achievements: Achievement[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements))
  },

  unlock(id: AchievementId): { achievement: Achievement; isNew: boolean } | null {
    if (!this.isEnabled()) return null

    const achievements = this.getAchievements()
    const index = achievements.findIndex((a) => a.id === id)
    if (index === -1) return null

    const achievement = achievements[index]
    if (achievement.unlockedAt) {
      return { achievement, isNew: false }
    }

    achievements[index] = { ...achievement, unlockedAt: Date.now() }
    this.saveAchievements(achievements)
    return { achievement: achievements[index], isNew: true }
  },

  updateProgress(id: AchievementId, progress: number): { achievement: Achievement; isNew: boolean } | null {
    if (!this.isEnabled()) return null

    const achievements = this.getAchievements()
    const index = achievements.findIndex((a) => a.id === id)
    if (index === -1) return null

    const achievement = achievements[index]
    if (achievement.unlockedAt) {
      return { achievement, isNew: false }
    }

    const newProgress = Math.min(progress, achievement.maxProgress || progress)
    achievements[index] = { ...achievement, progress: newProgress }

    // Check if completed
    if (achievement.maxProgress && newProgress >= achievement.maxProgress) {
      achievements[index].unlockedAt = Date.now()
      this.saveAchievements(achievements)
      return { achievement: achievements[index], isNew: true }
    }

    this.saveAchievements(achievements)
    return { achievement: achievements[index], isNew: false }
  },

  getUnlocked(): Achievement[] {
    return this.getAchievements().filter((a) => a.unlockedAt)
  },

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const all = this.getAchievements().filter((a) => !a.secret)
    const unlocked = all.filter((a) => a.unlockedAt).length
    return {
      unlocked,
      total: all.length,
      percentage: Math.round((unlocked / all.length) * 100),
    }
  },
}

// ==================== CONVERSATION STARTERS ====================

export interface ConversationStarter {
  id: string
  emoji: string
  label: { en: string; de: string }
  prompt: { en: string; de: string }
  category: "fun" | "creative" | "helpful" | "learning"
}

export const conversationStarters: ConversationStarter[] = [
  {
    id: "joke",
    emoji: "😂",
    label: { en: "Tell me a joke", de: "Erzähl mir einen Witz" },
    prompt: { en: "Tell me a funny joke!", de: "Erzähl mir einen lustigen Witz!" },
    category: "fun",
  },
  {
    id: "compliment",
    emoji: "💝",
    label: { en: "Give me a compliment", de: "Mach mir ein Kompliment" },
    prompt: { en: "Give me a nice, genuine compliment to brighten my day!", de: "Mach mir ein nettes, aufrichtiges Kompliment um meinen Tag zu verschönern!" },
    category: "fun",
  },
  {
    id: "motivation",
    emoji: "💪",
    label: { en: "Motivate me", de: "Motiviere mich" },
    prompt: { en: "Give me some motivation and encouragement!", de: "Gib mir etwas Motivation und Ermutigung!" },
    category: "helpful",
  },
  {
    id: "fact",
    emoji: "🧠",
    label: { en: "Random fun fact", de: "Zufälliger Fun Fact" },
    prompt: { en: "Tell me an interesting and surprising fun fact!", de: "Erzähl mir einen interessanten und überraschenden Fun Fact!" },
    category: "learning",
  },
  {
    id: "story",
    emoji: "📖",
    label: { en: "Tell me a short story", de: "Erzähl mir eine kurze Geschichte" },
    prompt: { en: "Tell me a creative and engaging short story (about 200 words).", de: "Erzähl mir eine kreative und fesselnde Kurzgeschichte (ca. 200 Wörter)." },
    category: "creative",
  },
  {
    id: "poem",
    emoji: "🎭",
    label: { en: "Write me a poem", de: "Schreib mir ein Gedicht" },
    prompt: { en: "Write me a beautiful, creative poem about something unexpected.", de: "Schreib mir ein schönes, kreatives Gedicht über etwas Unerwartetes." },
    category: "creative",
  },
  {
    id: "riddle",
    emoji: "🔮",
    label: { en: "Give me a riddle", de: "Gib mir ein Rätsel" },
    prompt: { en: "Give me a fun riddle to solve! Don't reveal the answer until I ask.", de: "Gib mir ein lustiges Rätsel zum Lösen! Verrate die Antwort erst, wenn ich frage." },
    category: "fun",
  },
  {
    id: "cook",
    emoji: "🍳",
    label: { en: "What should I cook?", de: "Was soll ich kochen?" },
    prompt: { en: "Suggest a delicious and easy recipe I could make today!", de: "Schlage mir ein leckeres und einfaches Rezept vor, das ich heute machen könnte!" },
    category: "helpful",
  },
  {
    id: "movie",
    emoji: "🎬",
    label: { en: "Recommend a movie", de: "Empfiehl mir einen Film" },
    prompt: { en: "Recommend me a great movie to watch tonight! Tell me why it's worth watching.", de: "Empfiehl mir einen tollen Film für heute Abend! Sag mir, warum er sehenswert ist." },
    category: "fun",
  },
  {
    id: "relax",
    emoji: "🧘",
    label: { en: "Help me relax", de: "Hilf mir zu entspannen" },
    prompt: { en: "Guide me through a quick relaxation exercise to help me calm down.", de: "Führe mich durch eine kurze Entspannungsübung um mir beim Beruhigen zu helfen." },
    category: "helpful",
  },
  {
    id: "quote",
    emoji: "💭",
    label: { en: "Inspiring quote", de: "Inspirierendes Zitat" },
    prompt: { en: "Share an inspiring quote and explain why it's meaningful.", de: "Teile ein inspirierendes Zitat und erkläre warum es bedeutsam ist." },
    category: "learning",
  },
  {
    id: "adventure",
    emoji: "🗺️",
    label: { en: "Random adventure", de: "Zufälliges Abenteuer" },
    prompt: { en: "Start an interactive text adventure game with me! Give me choices.", de: "Starte ein interaktives Text-Abenteuer mit mir! Gib mir Auswahlmöglichkeiten." },
    category: "creative",
  },
]

export const getStartersForInterests = (interests: string[], lang: "en" | "de"): ConversationStarter[] => {
  // Return all starters, but could be personalized based on interests in the future
  return conversationStarters
}

// ==================== CREATIVE CORNER ====================

export interface CreativeAction {
  id: string
  emoji: string
  label: { en: string; de: string }
  description: { en: string; de: string }
  promptTemplate: { en: string; de: string }
}

export const creativeActions: CreativeAction[] = [
  {
    id: "story_generator",
    emoji: "📚",
    label: { en: "Story Generator", de: "Geschichten-Generator" },
    description: { en: "Create unique stories", de: "Erstelle einzigartige Geschichten" },
    promptTemplate: {
      en: "Write a creative {genre} story about {topic}. Make it engaging with vivid descriptions and interesting characters.",
      de: "Schreibe eine kreative {genre}-Geschichte über {topic}. Mache sie fesselnd mit lebhaften Beschreibungen und interessanten Charakteren.",
    },
  },
  {
    id: "poem_writer",
    emoji: "🎭",
    label: { en: "Poem Writer", de: "Gedicht-Schreiber" },
    description: { en: "Compose beautiful poems", de: "Verfasse schöne Gedichte" },
    promptTemplate: {
      en: "Write a {style} poem about {topic}. Make it {mood} and memorable.",
      de: "Schreibe ein {style} Gedicht über {topic}. Mache es {mood} und unvergesslich.",
    },
  },
  {
    id: "name_generator",
    emoji: "✨",
    label: { en: "Name Generator", de: "Namen-Generator" },
    description: { en: "Generate creative names", de: "Generiere kreative Namen" },
    promptTemplate: {
      en: "Generate 10 creative and unique names for a {type}. Include a brief explanation for each.",
      de: "Generiere 10 kreative und einzigartige Namen für {type}. Füge eine kurze Erklärung für jeden hinzu.",
    },
  },
  {
    id: "joke_maker",
    emoji: "😂",
    label: { en: "Joke Maker", de: "Witze-Macher" },
    description: { en: "Create funny jokes", de: "Erstelle lustige Witze" },
    promptTemplate: {
      en: "Tell me 3 original, funny jokes about {topic}. Make them clever and family-friendly.",
      de: "Erzähle mir 3 originelle, lustige Witze über {topic}. Mache sie clever und familienfreundlich.",
    },
  },
  {
    id: "song_lyrics",
    emoji: "🎵",
    label: { en: "Song Lyrics", de: "Liedtexte" },
    description: { en: "Write song lyrics", de: "Schreibe Liedtexte" },
    promptTemplate: {
      en: "Write {style} song lyrics about {topic}. Include a catchy chorus.",
      de: "Schreibe {style} Liedtexte über {topic}. Füge einen eingängigen Refrain hinzu.",
    },
  },
  {
    id: "letter_writer",
    emoji: "💌",
    label: { en: "Letter Writer", de: "Brief-Schreiber" },
    description: { en: "Write heartfelt letters", de: "Schreibe herzliche Briefe" },
    promptTemplate: {
      en: "Help me write a {type} letter to {recipient}. Make it sincere and {tone}.",
      de: "Hilf mir einen {type} Brief an {recipient} zu schreiben. Mache ihn aufrichtig und {tone}.",
    },
  },
]

// ==================== GAMIFICATION SETTINGS ====================

export interface GamificationSettings {
  achievementsEnabled: boolean
  streaksEnabled: boolean
  notificationsEnabled: boolean
}

const GAMIFICATION_SETTINGS_KEY = "chameleon-gamification-settings"

export const gamificationService = {
  getSettings(): GamificationSettings {
    if (typeof window === "undefined") {
      return { achievementsEnabled: true, streaksEnabled: true, notificationsEnabled: true }
    }
    try {
      const stored = localStorage.getItem(GAMIFICATION_SETTINGS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Return only the relevant settings (migration from old format with pet)
        return {
          achievementsEnabled: parsed.achievementsEnabled ?? true,
          streaksEnabled: parsed.streaksEnabled ?? true,
          notificationsEnabled: parsed.notificationsEnabled ?? true,
        }
      }
    } catch {}
    return { achievementsEnabled: true, streaksEnabled: true, notificationsEnabled: true }
  },

  saveSettings(settings: GamificationSettings): void {
    if (typeof window === "undefined") return
    localStorage.setItem(GAMIFICATION_SETTINGS_KEY, JSON.stringify(settings))
    // Also update achievement service
    achievementService.setEnabled(settings.achievementsEnabled)
  },

  isFeatureEnabled(feature: keyof GamificationSettings): boolean {
    return this.getSettings()[feature] as boolean
  },
}

// ==================== STATS TRACKING ====================

export interface SimpleStats {
  totalMessages: number
  totalImages: number
  personasUsed: string[]
  creativeCornerUses: number
  questionsAsked: number
}

const SIMPLE_STATS_KEY = "chameleon-simple-stats"

export const simpleStatsService = {
  getStats(): SimpleStats {
    if (typeof window === "undefined") {
      return { totalMessages: 0, totalImages: 0, personasUsed: [], creativeCornerUses: 0, questionsAsked: 0 }
    }
    try {
      const stored = localStorage.getItem(SIMPLE_STATS_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return { totalMessages: 0, totalImages: 0, personasUsed: [], creativeCornerUses: 0, questionsAsked: 0 }
  },

  saveStats(stats: SimpleStats): void {
    if (typeof window === "undefined") return
    localStorage.setItem(SIMPLE_STATS_KEY, JSON.stringify(stats))
  },

  recordMessage(isQuestion: boolean = false): SimpleStats {
    const stats = this.getStats()
    stats.totalMessages += 1
    if (isQuestion) {
      stats.questionsAsked += 1
    }
    this.saveStats(stats)
    return stats
  },

  recordImage(): SimpleStats {
    const stats = this.getStats()
    stats.totalImages += 1
    this.saveStats(stats)
    return stats
  },

  recordPersona(personaId: string): SimpleStats {
    const stats = this.getStats()
    if (!stats.personasUsed.includes(personaId)) {
      stats.personasUsed.push(personaId)
    }
    this.saveStats(stats)
    return stats
  },

  recordCreativeCorner(): SimpleStats {
    const stats = this.getStats()
    stats.creativeCornerUses += 1
    this.saveStats(stats)
    return stats
  },
}
