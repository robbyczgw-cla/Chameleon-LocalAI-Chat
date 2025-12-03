/**
 * Background Agents System
 * Autonomous agents that run periodic tasks in the background
 */

export type AgentType =
  | "tech-news"
  | "bitcoin-tracker"
  | "website-watcher"
  | "weather-alert"
  | "reddit-monitor"
  | "github-tracker"
  | "stock-watchlist"
  | "habit-reminder"
  | "quote-of-day"
  | "language-word"
  | "custom"

export type AgentStatus = "active" | "paused" | "error"

export type AgentFrequency = "hourly" | "daily" | "weekly" | "manual"

export interface BackgroundAgent {
  id: string
  name: string
  type: AgentType
  emoji: string
  description: string
  frequency: AgentFrequency
  status: AgentStatus
  config: Record<string, any> // Agent-specific configuration
  lastRun?: number // Timestamp of last execution
  nextRun?: number // Timestamp of next scheduled run
  results?: AgentResult[] // Recent results
  createdAt: number
}

export interface AgentResult {
  id: string
  timestamp: number
  success: boolean
  data?: any
  error?: string
  summary?: string // Human-readable summary
}

// Agent Templates
export const AGENT_TEMPLATES: Omit<BackgroundAgent, "id" | "createdAt" | "lastRun" | "nextRun" | "results">[] = [
  {
    name: "Daily Tech News",
    type: "tech-news",
    emoji: "📰",
    description: "Holt täglich die neuesten Tech-News von Hacker News, TechCrunch, etc.",
    frequency: "daily",
    status: "paused",
    config: {
      sources: ["hackernews", "techcrunch"],
      topics: ["AI", "Web Development", "Startups"],
      maxItems: 5,
    },
  },
  {
    name: "Bitcoin Tracker",
    type: "bitcoin-tracker",
    emoji: "₿",
    description: "Tracked Bitcoin-Preis und benachrichtigt bei großen Schwankungen",
    frequency: "hourly",
    status: "paused",
    config: {
      currency: "USD",
      alertThreshold: 5, // % change to alert
      trackCoins: ["BTC", "ETH"],
    },
  },
  {
    name: "Website Watcher",
    type: "website-watcher",
    emoji: "👁️",
    description: "Überwacht Websites auf Änderungen und benachrichtigt dich",
    frequency: "daily",
    status: "paused",
    config: {
      urls: [],
      checkInterval: 24, // hours
      notifyOnChange: true,
    },
  },
  {
    name: "Weather Alert",
    type: "weather-alert",
    emoji: "🌦️",
    description: "Daily weather forecast with alerts for rain, storms, or extreme temperatures",
    frequency: "daily",
    status: "paused",
    config: {
      location: "Vienna, Austria",
      alertOnRain: true,
      alertOnExtreme: true,
      units: "metric",
    },
  },
  {
    name: "Reddit Monitor",
    type: "reddit-monitor",
    emoji: "🔥",
    description: "Monitors subreddits for hot posts matching your interests",
    frequency: "hourly",
    status: "paused",
    config: {
      subreddits: ["programming", "webdev", "artificial"],
      keywords: [],
      minUpvotes: 100,
      maxItems: 5,
    },
  },
  {
    name: "GitHub Tracker",
    type: "github-tracker",
    emoji: "🐙",
    description: "Tracks stars, issues, and releases on your favorite repos",
    frequency: "daily",
    status: "paused",
    config: {
      repos: ["vercel/next.js", "facebook/react"],
      trackStars: true,
      trackReleases: true,
      trackIssues: false,
    },
  },
  {
    name: "Stock Watchlist",
    type: "stock-watchlist",
    emoji: "📈",
    description: "Track stock prices and get alerts on significant movements",
    frequency: "hourly",
    status: "paused",
    config: {
      symbols: ["AAPL", "GOOGL", "MSFT", "NVDA"],
      alertThreshold: 3, // % change
      currency: "USD",
    },
  },
  {
    name: "Habit Reminder",
    type: "habit-reminder",
    emoji: "✅",
    description: "Daily reminders for habits you want to build or maintain",
    frequency: "daily",
    status: "paused",
    config: {
      habits: ["Drink 8 glasses of water", "30 min exercise", "Read 20 pages"],
      reminderTime: "09:00",
      trackStreak: true,
    },
  },
  {
    name: "Quote of the Day",
    type: "quote-of-day",
    emoji: "💭",
    description: "Delivers an inspiring or thought-provoking quote every day",
    frequency: "daily",
    status: "paused",
    config: {
      categories: ["motivation", "wisdom", "humor", "philosophy"],
      author: null, // null = random, or specific author name
    },
  },
  {
    name: "Language Word",
    type: "language-word",
    emoji: "🗣️",
    description: "Learn a new word every day in your target language",
    frequency: "daily",
    status: "paused",
    config: {
      targetLanguage: "Spanish",
      nativeLanguage: "English",
      difficulty: "intermediate",
      includeExample: true,
    },
  },
]

class BackgroundAgentsService {
  private agents: BackgroundAgent[] = []
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private readonly STORAGE_KEY = "chameleon-background-agents"

  constructor() {
    this.loadAgents()
  }

  private loadAgents() {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.agents = JSON.parse(stored)
        console.log("[BackgroundAgents] Loaded", this.agents.length, "agents")

        // Restart active agents
        this.agents.forEach(agent => {
          if (agent.status === "active") {
            this.scheduleAgent(agent)
          }
        })
      }
    } catch (error) {
      console.error("[BackgroundAgents] Failed to load agents:", error)
    }
  }

  private saveAgents() {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.agents))
    } catch (error) {
      console.error("[BackgroundAgents] Failed to save agents:", error)
    }
  }

  getAllAgents(): BackgroundAgent[] {
    return [...this.agents]
  }

  getAgent(id: string): BackgroundAgent | undefined {
    return this.agents.find(a => a.id === id)
  }

  createAgent(template: typeof AGENT_TEMPLATES[0]): BackgroundAgent {
    const agent: BackgroundAgent = {
      ...template,
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      results: [],
    }

    this.agents.push(agent)
    this.saveAgents()

    console.log("[BackgroundAgents] Created agent:", agent.name)
    return agent
  }

  updateAgent(id: string, updates: Partial<BackgroundAgent>) {
    const index = this.agents.findIndex(a => a.id === id)
    if (index === -1) return

    this.agents[index] = { ...this.agents[index], ...updates }
    this.saveAgents()

    // Reschedule if needed
    if (updates.status === "active" && this.agents[index].status === "active") {
      this.scheduleAgent(this.agents[index])
    } else if (updates.status === "paused") {
      this.unscheduleAgent(id)
    }
  }

  deleteAgent(id: string) {
    this.unscheduleAgent(id)
    this.agents = this.agents.filter(a => a.id !== id)
    this.saveAgents()
    console.log("[BackgroundAgents] Deleted agent:", id)
  }

  startAgent(id: string) {
    this.updateAgent(id, { status: "active" })
  }

  pauseAgent(id: string) {
    this.updateAgent(id, { status: "paused" })
  }

  async runAgentNow(id: string): Promise<AgentResult> {
    const agent = this.getAgent(id)
    if (!agent) {
      throw new Error("Agent not found")
    }

    console.log("[BackgroundAgents] Running agent manually:", agent.name)
    return await this.executeAgent(agent)
  }

  private scheduleAgent(agent: BackgroundAgent) {
    // Clear existing schedule
    this.unscheduleAgent(agent.id)

    const intervalMs = this.getIntervalMs(agent.frequency)
    if (intervalMs === 0) return // Manual execution only

    console.log("[BackgroundAgents] Scheduling agent:", agent.name, "every", agent.frequency)

    const interval = setInterval(async () => {
      await this.executeAgent(agent)
    }, intervalMs)

    this.intervals.set(agent.id, interval)

    // Update next run time
    this.updateAgent(agent.id, {
      nextRun: Date.now() + intervalMs
    })
  }

  private unscheduleAgent(id: string) {
    const interval = this.intervals.get(id)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(id)
      console.log("[BackgroundAgents] Unscheduled agent:", id)
    }
  }

  private getIntervalMs(frequency: AgentFrequency): number {
    switch (frequency) {
      case "hourly": return 60 * 60 * 1000
      case "daily": return 24 * 60 * 60 * 1000
      case "weekly": return 7 * 24 * 60 * 60 * 1000
      case "manual": return 0
      default: return 0
    }
  }

  private async executeAgent(agent: BackgroundAgent): Promise<AgentResult> {
    const result: AgentResult = {
      id: `result_${Date.now()}`,
      timestamp: Date.now(),
      success: false,
    }

    try {
      console.log("[BackgroundAgents] Executing agent:", agent.name)

      // Execute based on agent type
      switch (agent.type) {
        case "tech-news":
          result.data = await this.fetchTechNews(agent.config)
          result.summary = `Found ${result.data.length} tech news articles`
          break

        case "bitcoin-tracker":
          result.data = await this.trackBitcoin(agent.config)
          result.summary = `BTC: $${result.data.price.toLocaleString()} (${result.data.change > 0 ? '+' : ''}${result.data.change.toFixed(2)}%)`
          break

        case "website-watcher":
          result.data = await this.watchWebsites(agent.config)
          result.summary = `Checked ${result.data.checked} websites, ${result.data.changed} changed`
          break

        case "weather-alert":
          result.data = await this.fetchWeather(agent.config)
          result.summary = `${result.data.condition} ${result.data.temp}°${result.data.units === 'metric' ? 'C' : 'F'} - ${result.data.alert || 'No alerts'}`
          break

        case "reddit-monitor":
          result.data = await this.fetchRedditHot(agent.config)
          result.summary = `Found ${result.data.length} hot posts`
          break

        case "github-tracker":
          result.data = await this.trackGitHub(agent.config)
          result.summary = `${result.data.repos.length} repos tracked, ${result.data.newReleases} new releases`
          break

        case "stock-watchlist":
          result.data = await this.fetchStocks(agent.config)
          result.summary = result.data.map((s: any) => `${s.symbol}: $${s.price.toFixed(2)}`).join(', ')
          break

        case "habit-reminder":
          result.data = await this.getHabitReminder(agent.config)
          result.summary = `${result.data.habits.length} habits to complete today. Streak: ${result.data.streak} days`
          break

        case "quote-of-day":
          result.data = await this.fetchQuote(agent.config)
          result.summary = `"${result.data.quote.substring(0, 50)}..." - ${result.data.author}`
          break

        case "language-word":
          result.data = await this.fetchLanguageWord(agent.config)
          result.summary = `${result.data.word} (${result.data.translation})`
          break

        default:
          throw new Error(`Unknown agent type: ${agent.type}`)
      }

      result.success = true
      console.log("[BackgroundAgents] Agent completed successfully:", agent.name)
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.summary = `Error: ${result.error}`
      console.error("[BackgroundAgents] Agent failed:", agent.name, error)

      // Update agent status to error
      this.updateAgent(agent.id, { status: "error" })
    }

    // Store result
    const updatedAgent = this.getAgent(agent.id)
    if (updatedAgent) {
      const results = updatedAgent.results || []
      results.unshift(result)

      // Keep only last 10 results
      if (results.length > 10) {
        results.length = 10
      }

      this.updateAgent(agent.id, {
        results,
        lastRun: Date.now(),
      })
    }

    return result
  }

  private async fetchTechNews(config: any): Promise<any[]> {
    // Placeholder - in production, fetch from actual APIs
    // For now, return mock data
    const mockNews = [
      { title: "New AI Breakthrough in Language Models", source: "TechCrunch", url: "#" },
      { title: "Startup Raises $50M for Developer Tools", source: "Hacker News", url: "#" },
      { title: "React 19 Released with New Features", source: "Dev.to", url: "#" },
    ]

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return mockNews.slice(0, config.maxItems || 5)
  }

  private async trackBitcoin(config: any): Promise<any> {
    // Placeholder - in production, fetch from CoinGecko or similar
    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockPrice = 42000 + Math.random() * 5000
    const mockChange = (Math.random() - 0.5) * 10

    return {
      price: mockPrice,
      change: mockChange,
      currency: config.currency || "USD",
    }
  }

  private async watchWebsites(config: any): Promise<any> {
    // Placeholder - in production, fetch and compare website content
    await new Promise(resolve => setTimeout(resolve, 800))

    const urls = config.urls || []
    const changed = Math.floor(Math.random() * urls.length)

    return {
      checked: urls.length,
      changed,
      changes: changed > 0 ? [{ url: urls[0], diff: "Content updated" }] : [],
    }
  }

  private async fetchWeather(config: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600))
    const conditions = ["☀️ Sunny", "⛅ Partly Cloudy", "🌧️ Rainy", "❄️ Snowy", "🌤️ Clear"]
    const temp = config.units === "metric" ? Math.floor(10 + Math.random() * 20) : Math.floor(50 + Math.random() * 40)
    const alerts = [null, null, null, "🌧️ Rain expected this afternoon", "⚠️ High UV index"]

    return {
      location: config.location,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      temp,
      units: config.units,
      alert: alerts[Math.floor(Math.random() * alerts.length)],
    }
  }

  private async fetchRedditHot(config: any): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 700))
    const mockPosts = [
      { title: "TIL about an amazing programming technique", subreddit: "programming", upvotes: 2500 },
      { title: "What's the best framework in 2024?", subreddit: "webdev", upvotes: 1800 },
      { title: "New breakthrough in machine learning", subreddit: "artificial", upvotes: 3200 },
      { title: "My side project hit 10k users!", subreddit: "startups", upvotes: 950 },
    ]
    return mockPosts.slice(0, config.maxItems || 5)
  }

  private async trackGitHub(config: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800))
    const repos = (config.repos || []).map((repo: string) => ({
      name: repo,
      stars: Math.floor(50000 + Math.random() * 50000),
      newStars: Math.floor(Math.random() * 100),
      latestRelease: "v" + Math.floor(1 + Math.random() * 20) + ".0.0",
    }))
    return {
      repos,
      newReleases: Math.floor(Math.random() * repos.length),
    }
  }

  private async fetchStocks(config: any): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return (config.symbols || []).map((symbol: string) => ({
      symbol,
      price: 100 + Math.random() * 200,
      change: (Math.random() - 0.5) * 10,
    }))
  }

  private async getHabitReminder(config: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      habits: config.habits || [],
      streak: Math.floor(Math.random() * 30),
      completedToday: Math.floor(Math.random() * (config.habits?.length || 3)),
    }
  }

  private async fetchQuote(config: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 400))
    const quotes = [
      { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
      { quote: "Stay hungry, stay foolish.", author: "Steve Jobs" },
      { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
      { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    ]
    return quotes[Math.floor(Math.random() * quotes.length)]
  }

  private async fetchLanguageWord(config: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const words: Record<string, any[]> = {
      Spanish: [
        { word: "serendipity", translation: "serendipia", example: "Fue serendipia encontrarte aquí." },
        { word: "butterfly", translation: "mariposa", example: "La mariposa vuela en el jardín." },
        { word: "sunrise", translation: "amanecer", example: "El amanecer es hermoso." },
      ],
      German: [
        { word: "butterfly", translation: "Schmetterling", example: "Der Schmetterling ist bunt." },
        { word: "longing", translation: "Sehnsucht", example: "Ich habe Sehnsucht nach dir." },
      ],
      French: [
        { word: "butterfly", translation: "papillon", example: "Le papillon est dans le jardin." },
        { word: "dream", translation: "rêve", example: "C'est un beau rêve." },
      ],
    }
    const langWords = words[config.targetLanguage] || words.Spanish
    return langWords[Math.floor(Math.random() * langWords.length)]
  }
}

// Export singleton
export const backgroundAgentsService = new BackgroundAgentsService()
