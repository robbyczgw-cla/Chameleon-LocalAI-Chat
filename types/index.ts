/**
 * Multimodal content types for vision-capable models
 */
export type MessageContent = string | MessageContentPart[]

export interface MessageContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: {
    url: string // data URL or HTTP URL
    detail?: "auto" | "low" | "high" // For GPT-4V
  }
}

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: MessageContent // Now supports both string and multimodal array
  timestamp: number
  imageUrl?: string // Generated image URL (for DALL-E, Stable Diffusion, etc.)
  reasoning?: string // Model's reasoning/thinking process when reasoning is enabled
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  attachments?: Attachment[] // File attachments (images, PDFs, etc.)
  stats?: {
    model?: string
    cost?: number // in USD
    responseTime?: number // in seconds
    tokensPerSecond?: number
    firstTokenTime?: number // TTFT in seconds
    stopReason?: string
    searchTime?: number // web search time in seconds
    searchResults?: number
    searchProvider?: string
  }
  branches?: ConversationBranch[] // Alternate conversation paths from this message
}

export interface ConversationBranch {
  id: string
  name: string
  messages: Message[]
  createdAt: number
  parentMessageId: string // The message this branch diverges from
}

export interface ConversationInsight {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  topics: string[]
  timestamp: number
  messageCount: number
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
  folderId?: string
  pinned?: boolean
  currentBranchPath?: string[] // Array of branch IDs representing the current branch path
  insights?: ConversationInsight // AI-generated conversation insights
  titleGeneratedAt?: number // Timestamp when AI generated the title (for animation)
}

export interface ChatFolder {
  id: string
  name: string
  createdAt: number
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  content?: string
}

export interface MCPServerConfig {
  id: string
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  enabled: boolean
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: string
  content: string
  variables?: string[]
  createdAt: number
}

export interface DocumentCollection {
  id: string
  name: string
  description: string
  documents: CollectionDocument[]
  createdAt: number
  updatedAt: number
}

export interface CollectionDocument {
  id: string
  name: string
  content: string
  type: string
  size: number
  addedAt: number
}

export interface ComparisonMode {
  enabled: boolean
  models: string[]
  layout: "2-column" | "3-column" | "4-column"
}

export interface ModelParameters {
  temperature: number
  topP: number
  topK?: number
  frequencyPenalty: number
  presencePenalty: number
  maxTokens: number
  stopSequences?: string[]
}

export interface VoiceSettings {
  enabled: boolean
  autoPlay: boolean
  voice: string
  rate: number
  pitch: number
  ttsProvider?: "browser" | "openai"
  openaiVoice?: string
}

export interface TavilySettings {
  searchDepth: "basic" | "advanced"
  maxResults: number
  includeImages: boolean
  includeAnswer: boolean
  includeDomains?: string[] // Filter to specific domains
  excludeDomains?: string[] // Block specific domains
  includeRawContent?: boolean // Get full HTML/text content
  topic?: "general" | "news" // Search focus
}

export interface SerperSettings {
  maxResults: number
  includeImages: boolean
  country: string // "at", "de", etc.
  language: string // "de", "en", etc.
  type?: "search" | "images" | "news" | "videos" | "places" | "shopping" // Search type
  timeRange?: "none" | "hour" | "day" | "week" | "month" | "year" // Time-based filtering (tbs parameter)
  autocorrect?: boolean // Enable/disable autocorrect
  page?: number // Pagination
}

export interface ExaSettings {
  maxResults: number // 1-100
  searchType: "neural" | "keyword" | "auto" // Search method
  useAutoprompt: boolean // Let Exa optimize query
  category?: "company" | "research paper" | "news" | "pdf" | "github" | "tweet" | "personal site" | "linkedin profile" | "financial report"
  includeFullText: boolean // Get full page content
  includeHighlights: boolean // Get relevant snippets
  includeSummary: boolean // Get AI-generated summary
  includeImages: boolean // Include images from results in response
  highlightsPerResult: number // Number of highlight sentences
  maxTextCharacters: number // Limit text length
  livecrawl: "never" | "fallback" | "always" // Fresh content crawling
  includeDomains?: string[] // Only search these domains
  excludeDomains?: string[] // Exclude these domains
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: string
  description: string
}

export interface UsageStats {
  totalTokens: number
  totalCost: number
  messageCount: number
  modelUsage: Record<string, number>
  lastUpdated: number
}

/**
 * Streaming Visualization Settings
 * Controls real-time streaming feedback and post-completion stats
 */
/**
 * Live streaming state during AI response generation
 * Used to show real-time progress in the chat UI
 */
export interface StreamingState {
  isStreaming: boolean
  phase: "idle" | "thinking" | "searching" | "reasoning" | "generating" | "complete"
  currentAction?: string

  // Search info
  searchQuery?: string
  searchProvider?: string
  searchResults?: number
  searchTime?: number

  // Reasoning info
  reasoningTokens?: number
  reasoningContent?: string

  // Token tracking
  tokenCount?: number
  tokensPerSecond?: number

  // Timing
  startTime?: number
  firstTokenTime?: number

  // Model info
  model?: string

  // Error handling
  error?: string
  retryCount?: number
}

export interface StreamingVisualizationSettings {
  // Core Information
  showCurrentAction?: boolean
  showToolParameters?: boolean
  showSearchProvider?: boolean

  // Search & Results
  showSearchResults?: boolean
  showResultSummary?: boolean

  // Reasoning & Thinking
  showReasoningTokens?: boolean
  showExtendedThinking?: boolean

  // Performance Metrics
  showDetailedStats?: boolean
  showTokenUsage?: boolean
  showLatencyMetrics?: boolean
  showStreamingSpeed?: boolean
  showCostEstimates?: boolean

  // Context & Progress
  showContextUsage?: boolean
  showProgressIndicators?: boolean
  showEstimatedTime?: boolean

  // Advanced Details
  showModelInfo?: boolean
  showGenerationId?: boolean
  showCacheStatus?: boolean
  showRetryAttempts?: boolean
  showToolChains?: boolean

  // Warnings & Errors
  showRateLimitWarnings?: boolean
  showErrorDetails?: boolean

  // Timing & Duration
  showPhaseDurations?: boolean
  showTimestamps?: boolean
}

/**
 * Response Analysis Settings
 * Controls AI response intelligence features
 */
export interface ResponseAnalysisSettings {
  enabled?: boolean
  showSentiment?: boolean
  showConfidence?: boolean
  showComplexity?: boolean
  showReadingTime?: boolean
  showCitations?: boolean
  showHedgingPhrases?: boolean
  showToneAnalysis?: boolean
}

/**
 * Interactive Features Settings
 * Controls follow-ups, insights, and conversation tools
 */
export interface InteractiveFeaturesSettings {
  showFollowUpSuggestions?: boolean
  followUpCategories?: ('quick' | 'deep' | 'related')[]
  showConversationInsights?: boolean
  autoGenerateInsights?: boolean
  insightsMinMessages?: number // default: 2
}

/**
 * Rich Content Rendering Settings
 * Controls diagrams, math, polls, tables, and embeds
 */
export interface RichContentSettings {
  enableMermaidDiagrams?: boolean
  mermaidFullscreenByDefault?: boolean
  mermaidDownloadButton?: boolean
  enableMathRendering?: boolean
  enableInteractivePolls?: boolean
  enableTimelines?: boolean
  enableProgressBars?: boolean
  enableRichTables?: boolean
  tableSearchEnabled?: boolean
  tableSortingEnabled?: boolean
  enableComparisonCards?: boolean
  enableRichMediaEmbeds?: boolean
  richMediaTypes?: ('youtube' | 'twitter' | 'codepen' | 'spotify' | 'github' | 'figma')[]
}

/**
 * Analytics & Dashboards Settings
 * Controls cost tracking, stats widgets, and context meters
 */
export interface AnalyticsSettings {
  showCostTracker?: boolean
  costTrackerTimeRange?: '7d' | '30d' | 'all'
  showChatAnalytics?: boolean
  showStatsWidget?: boolean
  showPersonalityAnalysis?: boolean
  showContextMeter?: boolean
  contextMeterMode?: 'compact' | 'full' | 'mini'
  autoShowCriticalContext?: boolean
}

/**
 * File & Media Preview Settings
 */
export interface PreviewSettings {
  enableInlineFilePreviews?: boolean
  enableImagePreviews?: boolean
  maxPreviewSizeKB?: number // default: 5000
  supportedFileTypes?: string[]
}

/**
 * Performance & Optimization Settings
 */
export interface PerformanceSettings {
  lazyLoadDiagrams?: boolean
  debounceRenderingMs?: number // default: 300
  maxVisibleAnalyticsCards?: number // default: 10
  disableAnimations?: boolean
}

/**
 * Unified Visualization Settings
 * Central control for all visualization features
 */
export interface UnifiedVisualizationSettings {
  responseAnalysis?: ResponseAnalysisSettings
  interactiveFeatures?: InteractiveFeaturesSettings
  richContent?: RichContentSettings
  analytics?: AnalyticsSettings
  previews?: PreviewSettings
  performance?: PerformanceSettings
  streaming?: StreamingVisualizationSettings
}

export interface ExperimentalSettings {
  // Response Analysis (deprecated - use unifiedVisualization.responseAnalysis.enabled)
  enableResponseAnalysis?: boolean
  // Performance Mode: Disable GPU-intensive effects (chameleon color-shift, memory blink, etc.)
  performanceMode?: boolean
  // Streaming Visualization Settings
  streamingVisualization?: StreamingVisualizationSettings
  // Unified Visualization Settings (new)
  unifiedVisualization?: UnifiedVisualizationSettings
  // Auto Search: AI decides when to search the web (tool calling) - EXPERIMENTAL
  enableAutoSearch?: boolean
}

export interface LMStudioSettings {
  enabled: boolean
  endpoint: string // e.g., "http://localhost:1234/v1"
  models?: LMStudioModel[] // Cached list of available models
}

export interface LMStudioModel {
  id: string
  name: string
  type?: string
  architecture?: string
}

export interface AppSettings {
  theme?: "light" | "dark"
  language?: "en" | "de" // UI language: English or German
  simpleMode?: boolean // Simple Mode: Clean UI focused on personas & profile
  apiKeys: {
    openRouter?: string
    openAI?: string
    tavily?: string
    serper?: string
    exa?: string
  }
  lmStudio?: LMStudioSettings // LM Studio local model support
  selectedModel: string
  selectedModels?: string[] // Array of user's selected OpenRouter models (persisted to database)
  selectedPersona?: import("@/lib/personas").Persona // Currently selected persona
  temperature?: number
  maxTokens?: number
  systemPrompt: string
  searchProvider?: "tavily" | "serper" | "exa" // Which search API to use
  mcpServers?: MCPServerConfig[]
  modelParameters?: ModelParameters
  voiceSettings?: VoiceSettings
  tavilySettings?: TavilySettings
  serperSettings?: SerperSettings
  exaSettings?: ExaSettings
  comparisonMode?: ComparisonMode
  memorySettings?: MemorySettings
  fontSize?: "small" | "medium" | "large"
  fontFamily?: "inter" | "roboto" | "atkinson" | "opendyslexic" | "jetbrains" | "system"
  messageDensity?: "compact" | "comfortable" | "spacious"
  sidebarPosition?: "left" | "right"
  codeTheme?: "github-dark" | "github-light" | "monokai" | "dracula"
  enableKeyboardShortcuts?: boolean
  showDetailedStats?: boolean // Show detailed LLM stats (tokens, cost, performance)
  useExaSearch?: boolean // Use Exa semantic search via OpenRouter :online
  experimental?: ExperimentalSettings // Experimental features
}

export interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface SystemPrompt {
  id: string
  name: string
  description: string
  prompt: string
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

export interface ComparisonSession {
  id: string
  models: string[]
  messages: any[]
  timestamp: number
}

export interface ComparisonPanel {
  model: string
  messages: Message[]
}

export interface Memory {
  id: string
  type: "preference" | "fact" | "context" | "skill" | "goal"
  content: string
  category?: string
  importance: 1 | 2 | 3 // 1=low, 2=medium, 3=high
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  source?: string // Which chat it came from
  metadata?: Record<string, any>
}

export interface MemorySettings {
  enabled: boolean
  autoExtract: boolean // Automatically extract memories from conversations
  maxMemoriesInContext: number // How many memories to include in prompts (default 5)
  importanceThreshold: 1 | 2 | 3 // Minimum importance to include (default 2)
  syncToDatabase: boolean // Save memories to Supabase for cross-device sync (less private)
}
