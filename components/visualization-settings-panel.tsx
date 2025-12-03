"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Brain,
  MessageSquare,
  Palette,
  BarChart3,
  FileImage,
  Zap,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Settings2,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { UnifiedVisualizationSettings } from "@/types"

interface VisualizationSettingsPanelProps {
  settings: UnifiedVisualizationSettings
  onSettingsChange: (settings: UnifiedVisualizationSettings) => void
  language?: "en" | "de"
}

// Preset configurations
const PRESETS = {
  minimal: {
    responseAnalysis: {
      enabled: false,
    },
    interactiveFeatures: {
      showFollowUpSuggestions: true,
      showConversationInsights: false,
      autoGenerateInsights: false,
    },
    richContent: {
      enableMermaidDiagrams: true,
      mermaidDownloadButton: false,
      enableMathRendering: true,
      enableInteractivePolls: false,
      enableTimelines: false,
      enableProgressBars: true,
      enableRichTables: true,
      tableSearchEnabled: false,
      tableSortingEnabled: false,
      enableComparisonCards: false,
      enableRichMediaEmbeds: false,
    },
    analytics: {
      showCostTracker: false,
      showChatAnalytics: false,
      showStatsWidget: false,
      showContextMeter: true,
      contextMeterMode: 'mini' as const,
      autoShowCriticalContext: true,
    },
    previews: {
      enableInlineFilePreviews: true,
      enableImagePreviews: true,
    },
    performance: {
      lazyLoadDiagrams: true,
      disableAnimations: true,
    },
    streaming: {
      showDetailedStats: false,
      showCurrentAction: true,
      showToolParameters: false,
      showSearchProvider: true,
      showSearchResults: false,
      showResultSummary: true,
      showReasoningTokens: true,
      showExtendedThinking: false,
      showTokenUsage: false,
      showLatencyMetrics: false,
      showStreamingSpeed: false,
      showCostEstimates: false,
      showContextUsage: false,
      showProgressIndicators: true,
      showModelInfo: true,
      showPhaseDurations: false,
      showErrorDetails: true,
    },
  },
  balanced: {
    responseAnalysis: {
      enabled: true,
      showSentiment: true,
      showConfidence: true,
      showComplexity: true,
      showReadingTime: true,
      showCitations: false,
      showHedgingPhrases: false,
      showToneAnalysis: false,
    },
    interactiveFeatures: {
      showFollowUpSuggestions: true,
      followUpCategories: ['quick', 'deep', 'related'] as ('quick' | 'deep' | 'related')[],
      showConversationInsights: true,
      autoGenerateInsights: true,
      insightsMinMessages: 3,
    },
    richContent: {
      enableMermaidDiagrams: true,
      mermaidDownloadButton: true,
      enableMathRendering: true,
      enableInteractivePolls: true,
      enableTimelines: true,
      enableProgressBars: true,
      enableRichTables: true,
      tableSearchEnabled: true,
      tableSortingEnabled: true,
      enableComparisonCards: true,
      enableRichMediaEmbeds: false,
    },
    analytics: {
      showCostTracker: true,
      costTrackerTimeRange: '30d' as const,
      showChatAnalytics: true,
      showStatsWidget: true,
      showContextMeter: true,
      contextMeterMode: 'compact' as const,
      autoShowCriticalContext: true,
    },
    previews: {
      enableInlineFilePreviews: true,
      enableImagePreviews: true,
      maxPreviewSizeKB: 5000,
    },
    performance: {
      lazyLoadDiagrams: true,
      debounceRenderingMs: 300,
      maxVisibleAnalyticsCards: 10,
      disableAnimations: false,
    },
    streaming: {
      showDetailedStats: true,
      showCurrentAction: true,
      showToolParameters: true,
      showSearchProvider: true,
      showSearchResults: true,
      showResultSummary: true,
      showReasoningTokens: true,
      showExtendedThinking: true,
      showTokenUsage: true,
      showLatencyMetrics: true,
      showStreamingSpeed: true,
      showCostEstimates: true,
      showContextUsage: false,
      showProgressIndicators: true,
      showModelInfo: true,
      showPhaseDurations: true,
      showErrorDetails: true,
      showToolChains: true,
    },
  },
  maximum: {
    responseAnalysis: {
      enabled: true,
      showSentiment: true,
      showConfidence: true,
      showComplexity: true,
      showReadingTime: true,
      showCitations: true,
      showHedgingPhrases: true,
      showToneAnalysis: true,
    },
    interactiveFeatures: {
      showFollowUpSuggestions: true,
      followUpCategories: ['quick', 'deep', 'related'] as ('quick' | 'deep' | 'related')[],
      showConversationInsights: true,
      autoGenerateInsights: true,
      insightsMinMessages: 2,
    },
    richContent: {
      enableMermaidDiagrams: true,
      mermaidFullscreenByDefault: false,
      mermaidDownloadButton: true,
      enableMathRendering: true,
      enableInteractivePolls: true,
      enableTimelines: true,
      enableProgressBars: true,
      enableRichTables: true,
      tableSearchEnabled: true,
      tableSortingEnabled: true,
      enableComparisonCards: true,
      enableRichMediaEmbeds: true,
      richMediaTypes: ['youtube', 'twitter', 'github'] as ('youtube' | 'twitter' | 'codepen' | 'spotify' | 'github' | 'figma')[],
    },
    analytics: {
      showCostTracker: true,
      costTrackerTimeRange: 'all' as const,
      showChatAnalytics: true,
      showStatsWidget: true,
      showPersonalityAnalysis: true,
      showContextMeter: true,
      contextMeterMode: 'full' as const,
      autoShowCriticalContext: true,
    },
    previews: {
      enableInlineFilePreviews: true,
      enableImagePreviews: true,
      maxPreviewSizeKB: 10000,
    },
    performance: {
      lazyLoadDiagrams: false,
      debounceRenderingMs: 100,
      maxVisibleAnalyticsCards: 20,
      disableAnimations: false,
    },
    streaming: {
      showDetailedStats: true,
      showCurrentAction: true,
      showToolParameters: true,
      showSearchProvider: true,
      showSearchResults: true,
      showResultSummary: true,
      showReasoningTokens: true,
      showExtendedThinking: true,
      showTokenUsage: true,
      showLatencyMetrics: true,
      showStreamingSpeed: true,
      showCostEstimates: true,
      showContextUsage: true,
      showProgressIndicators: true,
      showEstimatedTime: true,
      showModelInfo: true,
      showGenerationId: true,
      showCacheStatus: true,
      showRetryAttempts: true,
      showToolChains: true,
      showRateLimitWarnings: true,
      showErrorDetails: true,
      showPhaseDurations: true,
      showTimestamps: true,
    },
  },
}

const translations = {
  en: {
    title: "Advanced Visualization",
    description: "Control all visualization features in one place",
    presets: "Quick Presets",
    minimal: "Minimal",
    balanced: "Balanced",
    maximum: "Maximum",
    minimalDesc: "Essential features only",
    balancedDesc: "Recommended for most users",
    maximumDesc: "Full transparency",

    // Categories
    responseIntelligence: "Response Intelligence",
    interactiveFeatures: "Interactive Features",
    richContent: "Rich Content Rendering",
    analytics: "Analytics & Dashboards",
    previews: "File & Media Previews",
    performance: "Performance & Optimization",

    // Response Analysis
    enableResponseAnalysis: "Enable Response Analysis",
    showSentiment: "Show Sentiment",
    showConfidence: "Show Confidence Level",
    showComplexity: "Show Complexity Score",
    showReadingTime: "Show Reading Time",
    showCitations: "Show Citation Count",
    showHedgingPhrases: "Show Hedging Phrases",
    showToneAnalysis: "Show Tone Analysis",

    // Interactive Features
    showFollowUps: "Show Follow-Up Suggestions",
    followUpCategories: "Follow-up categories",
    quick: "Quick",
    deep: "Deep",
    related: "Related",
    showInsights: "Show Conversation Insights",
    autoInsights: "Auto-Generate Insights",
    minMessages: "Minimum messages",

    // Rich Content
    enableMermaid: "Enable Mermaid Diagrams",
    mermaidFullscreen: "Fullscreen by default",
    mermaidDownload: "Download button",
    enableMath: "Enable Math Rendering (KaTeX)",
    enablePolls: "Enable Interactive Polls",
    enableTimelines: "Enable Timelines",
    enableProgress: "Enable Progress Bars",
    enableTables: "Enable Rich Tables",
    tableSearch: "Search functionality",
    tableSorting: "Column sorting",
    enableComparison: "Enable Comparison Cards",
    enableEmbeds: "Enable Rich Media Embeds",
    embedServices: "Enabled services",

    // Analytics
    showCostTracker: "Show Cost Tracker",
    timeRange: "Default time range",
    showChatAnalytics: "Show Chat Analytics",
    showStatsWidget: "Show Usage Statistics",
    showPersonality: "Show Personality Analysis",
    showContextMeter: "Show Context Window Meter",
    contextMode: "Display mode",
    autoShowCritical: "Auto-show on critical (>90%)",

    // Previews
    enableFilePreviews: "Enable Inline File Previews",
    enableImagePreviews: "Enable Image Previews",
    maxPreviewSize: "Max preview size (KB)",

    // Performance
    lazyLoad: "Lazy load diagrams",
    debounce: "Debounce rendering (ms)",
    maxCards: "Max visible analytics cards",
    disableAnimations: "Disable animations",

    // Streaming
    streamingVisualization: "Streaming Visualization",
    showDetailedStats: "Show Detailed Stats",
    showDetailedStatsDesc: "Token usage, cost, performance, search stats after each response",
    showCurrentAction: "Show Current Action",
    showToolParameters: "Show Tool Parameters",
    showSearchProvider: "Show Search Provider",
    showSearchResults: "Show Search Results Preview",
    showResultSummary: "Show Result Summary",
    showReasoningTokens: "Show Reasoning Tokens",
    showExtendedThinking: "Show Extended Thinking",
    showTokenUsage: "Show Token Usage (Real-time)",
    showLatencyMetrics: "Show Latency Metrics (TTFT)",
    showStreamingSpeed: "Show Streaming Speed",
    showCostEstimates: "Show Cost Estimates",
    showContextUsage: "Show Context Usage",
    showProgressIndicators: "Show Progress Indicators",
    showEstimatedTime: "Show Estimated Time",
    showModelInfo: "Show Model Info",
    showGenerationId: "Show Generation ID",
    showCacheStatus: "Show Cache Status",
    showRetryAttempts: "Show Retry Attempts",
    showToolChains: "Show Tool Chains",
    showRateLimitWarnings: "Show Rate Limit Warnings",
    showErrorDetails: "Show Error Details",
    showPhaseDurations: "Show Phase Durations",
    showTimestamps: "Show Timestamps",
  },
  de: {
    title: "Erweiterte Visualisierung",
    description: "Alle Visualisierungsfunktionen zentral steuern",
    presets: "Schnellvorlagen",
    minimal: "Minimal",
    balanced: "Ausgewogen",
    maximum: "Maximum",
    minimalDesc: "Nur wesentliche Funktionen",
    balancedDesc: "Empfohlen",
    maximumDesc: "Volle Transparenz",

    responseIntelligence: "Antwort-Intelligenz",
    interactiveFeatures: "Interaktive Funktionen",
    richContent: "Rich Content Rendering",
    analytics: "Analysen & Dashboards",
    previews: "Datei- & Medienvorschau",
    performance: "Leistung & Optimierung",

    enableResponseAnalysis: "Antwortanalyse aktivieren",
    showSentiment: "Stimmung anzeigen",
    showConfidence: "Konfidenz anzeigen",
    showComplexity: "Komplexität anzeigen",
    showReadingTime: "Lesezeit anzeigen",
    showCitations: "Zitate anzeigen",
    showHedgingPhrases: "Abschwächungen anzeigen",
    showToneAnalysis: "Tonanalyse anzeigen",

    showFollowUps: "Follow-Up Vorschläge anzeigen",
    followUpCategories: "Follow-Up Kategorien",
    quick: "Schnell",
    deep: "Tief",
    related: "Verwandt",
    showInsights: "Gesprächseinblicke anzeigen",
    autoInsights: "Einblicke automatisch generieren",
    minMessages: "Mindestanzahl Nachrichten",

    enableMermaid: "Mermaid Diagramme aktivieren",
    mermaidFullscreen: "Vollbild standardmäßig",
    mermaidDownload: "Download-Button",
    enableMath: "Mathe-Rendering (KaTeX)",
    enablePolls: "Interaktive Umfragen",
    enableTimelines: "Zeitleisten aktivieren",
    enableProgress: "Fortschrittsbalken aktivieren",
    enableTables: "Rich Tables aktivieren",
    tableSearch: "Suchfunktion",
    tableSorting: "Spaltensortierung",
    enableComparison: "Vergleichskarten aktivieren",
    enableEmbeds: "Rich Media Embeds",
    embedServices: "Aktivierte Dienste",

    showCostTracker: "Kostentracker anzeigen",
    timeRange: "Standard-Zeitraum",
    showChatAnalytics: "Chat-Analysen anzeigen",
    showStatsWidget: "Nutzungsstatistiken anzeigen",
    showPersonality: "Persönlichkeitsanalyse anzeigen",
    showContextMeter: "Kontextfenster-Anzeige",
    contextMode: "Anzeigemodus",
    autoShowCritical: "Auto-Anzeige bei kritisch (>90%)",

    enableFilePreviews: "Dateivorschau aktivieren",
    enableImagePreviews: "Bildvorschau aktivieren",
    maxPreviewSize: "Max. Vorschaugröße (KB)",

    lazyLoad: "Diagramme lazy laden",
    debounce: "Rendering verzögern (ms)",
    maxCards: "Max. sichtbare Analytics-Karten",
    disableAnimations: "Animationen deaktivieren",

    // Streaming
    streamingVisualization: "Streaming-Visualisierung",
    showDetailedStats: "Detaillierte Stats anzeigen",
    showDetailedStatsDesc: "Token-Nutzung, Kosten, Performance, Such-Statistiken nach jeder Antwort",
    showCurrentAction: "Aktuelle Aktion anzeigen",
    showToolParameters: "Tool-Parameter anzeigen",
    showSearchProvider: "Such-Provider anzeigen",
    showSearchResults: "Suchergebnisse-Vorschau",
    showResultSummary: "Ergebnis-Zusammenfassung",
    showReasoningTokens: "Reasoning-Tokens anzeigen",
    showExtendedThinking: "Erweitertes Denken anzeigen",
    showTokenUsage: "Token-Nutzung (Echtzeit)",
    showLatencyMetrics: "Latenz-Metriken (TTFT)",
    showStreamingSpeed: "Streaming-Geschwindigkeit",
    showCostEstimates: "Kosten-Schätzungen",
    showContextUsage: "Kontext-Nutzung anzeigen",
    showProgressIndicators: "Fortschrittsanzeigen",
    showEstimatedTime: "Geschätzte Zeit anzeigen",
    showModelInfo: "Modell-Info anzeigen",
    showGenerationId: "Generations-ID anzeigen",
    showCacheStatus: "Cache-Status anzeigen",
    showRetryAttempts: "Wiederholungsversuche anzeigen",
    showToolChains: "Tool-Ketten anzeigen",
    showRateLimitWarnings: "Rate-Limit-Warnungen",
    showErrorDetails: "Fehlerdetails anzeigen",
    showPhaseDurations: "Phasen-Dauer anzeigen",
    showTimestamps: "Zeitstempel anzeigen",
  },
}

interface SettingSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function SettingSection({ title, icon, children, defaultOpen = false }: SettingSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-7 pr-3 pb-3 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

interface SettingToggleProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  indent?: boolean
}

function SettingToggle({ label, checked, onCheckedChange, indent = false }: SettingToggleProps) {
  return (
    <div className={cn("flex items-center justify-between py-1", indent && "pl-4")}>
      <Label className={cn("text-sm", indent && "text-muted-foreground")}>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function VisualizationSettingsPanel({
  settings,
  onSettingsChange,
  language = "en",
}: VisualizationSettingsPanelProps) {
  const t = translations[language]

  const updateSettings = (path: string[], value: any) => {
    const newSettings = JSON.parse(JSON.stringify(settings || {}))
    let current = newSettings
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {}
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    onSettingsChange(newSettings)
  }

  const applyPreset = (preset: keyof typeof PRESETS) => {
    onSettingsChange(PRESETS[preset])
  }

  // Helper to get nested value with default
  const getValue = <T,>(path: string[], defaultValue: T): T => {
    let current: any = settings
    for (const key of path) {
      if (current === undefined || current === null) return defaultValue
      current = current[key]
    }
    return current ?? defaultValue
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold">{t.title}</h3>
          <p className="text-xs text-muted-foreground">{t.description}</p>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t.presets}</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("minimal")}
            className="flex-1"
          >
            <Settings2 className="h-3 w-3 mr-1" />
            {t.minimal}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("balanced")}
            className="flex-1"
          >
            <Settings2 className="h-3 w-3 mr-1" />
            {t.balanced}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("maximum")}
            className="flex-1"
          >
            <Settings2 className="h-3 w-3 mr-1" />
            {t.maximum}
          </Button>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        {/* Response Intelligence */}
        <SettingSection
          title={t.responseIntelligence}
          icon={<Brain className="h-4 w-4 text-purple-500" />}
          defaultOpen
        >
          <SettingToggle
            label={t.enableResponseAnalysis}
            checked={getValue(["responseAnalysis", "enabled"], false)}
            onCheckedChange={(v) => updateSettings(["responseAnalysis", "enabled"], v)}
          />
          {getValue(["responseAnalysis", "enabled"], false) && (
            <>
              <SettingToggle
                label={t.showSentiment}
                checked={getValue(["responseAnalysis", "showSentiment"], true)}
                onCheckedChange={(v) => updateSettings(["responseAnalysis", "showSentiment"], v)}
                indent
              />
              <SettingToggle
                label={t.showConfidence}
                checked={getValue(["responseAnalysis", "showConfidence"], true)}
                onCheckedChange={(v) => updateSettings(["responseAnalysis", "showConfidence"], v)}
                indent
              />
              <SettingToggle
                label={t.showComplexity}
                checked={getValue(["responseAnalysis", "showComplexity"], true)}
                onCheckedChange={(v) => updateSettings(["responseAnalysis", "showComplexity"], v)}
                indent
              />
              <SettingToggle
                label={t.showReadingTime}
                checked={getValue(["responseAnalysis", "showReadingTime"], true)}
                onCheckedChange={(v) => updateSettings(["responseAnalysis", "showReadingTime"], v)}
                indent
              />
              <SettingToggle
                label={t.showCitations}
                checked={getValue(["responseAnalysis", "showCitations"], false)}
                onCheckedChange={(v) => updateSettings(["responseAnalysis", "showCitations"], v)}
                indent
              />
              <SettingToggle
                label={t.showToneAnalysis}
                checked={getValue(["responseAnalysis", "showToneAnalysis"], false)}
                onCheckedChange={(v) => updateSettings(["responseAnalysis", "showToneAnalysis"], v)}
                indent
              />
            </>
          )}
        </SettingSection>

        {/* Interactive Features */}
        <SettingSection
          title={t.interactiveFeatures}
          icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
        >
          <SettingToggle
            label={t.showFollowUps}
            checked={getValue(["interactiveFeatures", "showFollowUpSuggestions"], true)}
            onCheckedChange={(v) => updateSettings(["interactiveFeatures", "showFollowUpSuggestions"], v)}
          />
          <SettingToggle
            label={t.showInsights}
            checked={getValue(["interactiveFeatures", "showConversationInsights"], true)}
            onCheckedChange={(v) => updateSettings(["interactiveFeatures", "showConversationInsights"], v)}
          />
          {getValue(["interactiveFeatures", "showConversationInsights"], true) && (
            <>
              <SettingToggle
                label={t.autoInsights}
                checked={getValue(["interactiveFeatures", "autoGenerateInsights"], true)}
                onCheckedChange={(v) => updateSettings(["interactiveFeatures", "autoGenerateInsights"], v)}
                indent
              />
              <div className="pl-4 flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">{t.minMessages}</Label>
                <Slider
                  value={[getValue(["interactiveFeatures", "insightsMinMessages"], 2)]}
                  onValueChange={([v]) => updateSettings(["interactiveFeatures", "insightsMinMessages"], v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground w-4">
                  {getValue(["interactiveFeatures", "insightsMinMessages"], 2)}
                </span>
              </div>
            </>
          )}
        </SettingSection>

        {/* Rich Content */}
        <SettingSection
          title={t.richContent}
          icon={<Palette className="h-4 w-4 text-green-500" />}
        >
          <SettingToggle
            label={t.enableMermaid}
            checked={getValue(["richContent", "enableMermaidDiagrams"], true)}
            onCheckedChange={(v) => updateSettings(["richContent", "enableMermaidDiagrams"], v)}
          />
          {getValue(["richContent", "enableMermaidDiagrams"], true) && (
            <SettingToggle
              label={t.mermaidDownload}
              checked={getValue(["richContent", "mermaidDownloadButton"], true)}
              onCheckedChange={(v) => updateSettings(["richContent", "mermaidDownloadButton"], v)}
              indent
            />
          )}
          <SettingToggle
            label={t.enableMath}
            checked={getValue(["richContent", "enableMathRendering"], true)}
            onCheckedChange={(v) => updateSettings(["richContent", "enableMathRendering"], v)}
          />
          <SettingToggle
            label={t.enablePolls}
            checked={getValue(["richContent", "enableInteractivePolls"], true)}
            onCheckedChange={(v) => updateSettings(["richContent", "enableInteractivePolls"], v)}
          />
          <SettingToggle
            label={t.enableTimelines}
            checked={getValue(["richContent", "enableTimelines"], true)}
            onCheckedChange={(v) => updateSettings(["richContent", "enableTimelines"], v)}
          />
          <SettingToggle
            label={t.enableProgress}
            checked={getValue(["richContent", "enableProgressBars"], true)}
            onCheckedChange={(v) => updateSettings(["richContent", "enableProgressBars"], v)}
          />
          <SettingToggle
            label={t.enableTables}
            checked={getValue(["richContent", "enableRichTables"], true)}
            onCheckedChange={(v) => updateSettings(["richContent", "enableRichTables"], v)}
          />
          {getValue(["richContent", "enableRichTables"], true) && (
            <>
              <SettingToggle
                label={t.tableSearch}
                checked={getValue(["richContent", "tableSearchEnabled"], true)}
                onCheckedChange={(v) => updateSettings(["richContent", "tableSearchEnabled"], v)}
                indent
              />
              <SettingToggle
                label={t.tableSorting}
                checked={getValue(["richContent", "tableSortingEnabled"], true)}
                onCheckedChange={(v) => updateSettings(["richContent", "tableSortingEnabled"], v)}
                indent
              />
            </>
          )}
          <SettingToggle
            label={t.enableComparison}
            checked={getValue(["richContent", "enableComparisonCards"], true)}
            onCheckedChange={(v) => updateSettings(["richContent", "enableComparisonCards"], v)}
          />
          <SettingToggle
            label={t.enableEmbeds}
            checked={getValue(["richContent", "enableRichMediaEmbeds"], false)}
            onCheckedChange={(v) => updateSettings(["richContent", "enableRichMediaEmbeds"], v)}
          />
        </SettingSection>

        {/* Analytics */}
        <SettingSection
          title={t.analytics}
          icon={<BarChart3 className="h-4 w-4 text-orange-500" />}
        >
          <SettingToggle
            label={t.showCostTracker}
            checked={getValue(["analytics", "showCostTracker"], true)}
            onCheckedChange={(v) => updateSettings(["analytics", "showCostTracker"], v)}
          />
          {getValue(["analytics", "showCostTracker"], true) && (
            <div className="pl-4 flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">{t.timeRange}</Label>
              <Select
                value={getValue(["analytics", "costTrackerTimeRange"], "30d")}
                onValueChange={(v) => updateSettings(["analytics", "costTrackerTimeRange"], v)}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <SettingToggle
            label={t.showChatAnalytics}
            checked={getValue(["analytics", "showChatAnalytics"], true)}
            onCheckedChange={(v) => updateSettings(["analytics", "showChatAnalytics"], v)}
          />
          <SettingToggle
            label={t.showStatsWidget}
            checked={getValue(["analytics", "showStatsWidget"], true)}
            onCheckedChange={(v) => updateSettings(["analytics", "showStatsWidget"], v)}
          />
          <SettingToggle
            label={t.showContextMeter}
            checked={getValue(["analytics", "showContextMeter"], true)}
            onCheckedChange={(v) => updateSettings(["analytics", "showContextMeter"], v)}
          />
          {getValue(["analytics", "showContextMeter"], true) && (
            <>
              <div className="pl-4 flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">{t.contextMode}</Label>
                <Select
                  value={getValue(["analytics", "contextMeterMode"], "compact")}
                  onValueChange={(v) => updateSettings(["analytics", "contextMeterMode"], v)}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mini">Mini</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SettingToggle
                label={t.autoShowCritical}
                checked={getValue(["analytics", "autoShowCriticalContext"], true)}
                onCheckedChange={(v) => updateSettings(["analytics", "autoShowCriticalContext"], v)}
                indent
              />
            </>
          )}
        </SettingSection>

        {/* File Previews */}
        <SettingSection
          title={t.previews}
          icon={<FileImage className="h-4 w-4 text-cyan-500" />}
        >
          <SettingToggle
            label={t.enableFilePreviews}
            checked={getValue(["previews", "enableInlineFilePreviews"], true)}
            onCheckedChange={(v) => updateSettings(["previews", "enableInlineFilePreviews"], v)}
          />
          <SettingToggle
            label={t.enableImagePreviews}
            checked={getValue(["previews", "enableImagePreviews"], true)}
            onCheckedChange={(v) => updateSettings(["previews", "enableImagePreviews"], v)}
          />
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t.maxPreviewSize}</Label>
            <Slider
              value={[getValue(["previews", "maxPreviewSizeKB"], 5000)]}
              onValueChange={([v]) => updateSettings(["previews", "maxPreviewSizeKB"], v)}
              min={1000}
              max={20000}
              step={1000}
              className="w-32"
            />
            <span className="text-xs text-muted-foreground w-12">
              {Math.round(getValue(["previews", "maxPreviewSizeKB"], 5000) / 1000)}MB
            </span>
          </div>
        </SettingSection>

        {/* Performance */}
        <SettingSection
          title={t.performance}
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
        >
          <SettingToggle
            label={t.lazyLoad}
            checked={getValue(["performance", "lazyLoadDiagrams"], true)}
            onCheckedChange={(v) => updateSettings(["performance", "lazyLoadDiagrams"], v)}
          />
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t.debounce}</Label>
            <Slider
              value={[getValue(["performance", "debounceRenderingMs"], 300)]}
              onValueChange={([v]) => updateSettings(["performance", "debounceRenderingMs"], v)}
              min={0}
              max={1000}
              step={50}
              className="w-32"
            />
            <span className="text-xs text-muted-foreground w-12">
              {getValue(["performance", "debounceRenderingMs"], 300)}ms
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t.maxCards}</Label>
            <Slider
              value={[getValue(["performance", "maxVisibleAnalyticsCards"], 10)]}
              onValueChange={([v]) => updateSettings(["performance", "maxVisibleAnalyticsCards"], v)}
              min={5}
              max={50}
              step={5}
              className="w-32"
            />
            <span className="text-xs text-muted-foreground w-8">
              {getValue(["performance", "maxVisibleAnalyticsCards"], 10)}
            </span>
          </div>
          <SettingToggle
            label={t.disableAnimations}
            checked={getValue(["performance", "disableAnimations"], false)}
            onCheckedChange={(v) => updateSettings(["performance", "disableAnimations"], v)}
          />
        </SettingSection>

        {/* Streaming Visualization */}
        <SettingSection
          title={t.streamingVisualization}
          icon={<Activity className="h-4 w-4 text-emerald-500" />}
        >
          {/* Primary: Show Detailed Stats */}
          <div className="space-y-1 pb-2 border-b">
            <SettingToggle
              label={t.showDetailedStats}
              checked={getValue(["streaming", "showDetailedStats"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showDetailedStats"], v)}
            />
            <p className="text-xs text-muted-foreground pl-0">{t.showDetailedStatsDesc}</p>
          </div>

          {/* Core Information */}
          <div className="pt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Core</p>
            <SettingToggle
              label={t.showCurrentAction}
              checked={getValue(["streaming", "showCurrentAction"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showCurrentAction"], v)}
            />
            <SettingToggle
              label={t.showToolParameters}
              checked={getValue(["streaming", "showToolParameters"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showToolParameters"], v)}
            />
            <SettingToggle
              label={t.showSearchProvider}
              checked={getValue(["streaming", "showSearchProvider"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showSearchProvider"], v)}
            />
          </div>

          {/* Search & Results */}
          <div className="pt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Search</p>
            <SettingToggle
              label={t.showSearchResults}
              checked={getValue(["streaming", "showSearchResults"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showSearchResults"], v)}
            />
            <SettingToggle
              label={t.showResultSummary}
              checked={getValue(["streaming", "showResultSummary"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showResultSummary"], v)}
            />
          </div>

          {/* Reasoning & Thinking */}
          <div className="pt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reasoning</p>
            <SettingToggle
              label={t.showReasoningTokens}
              checked={getValue(["streaming", "showReasoningTokens"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showReasoningTokens"], v)}
            />
            <SettingToggle
              label={t.showExtendedThinking}
              checked={getValue(["streaming", "showExtendedThinking"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showExtendedThinking"], v)}
            />
          </div>

          {/* Performance Metrics */}
          <div className="pt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Performance</p>
            <SettingToggle
              label={t.showTokenUsage}
              checked={getValue(["streaming", "showTokenUsage"], false)}
              onCheckedChange={(v) => updateSettings(["streaming", "showTokenUsage"], v)}
            />
            <SettingToggle
              label={t.showLatencyMetrics}
              checked={getValue(["streaming", "showLatencyMetrics"], false)}
              onCheckedChange={(v) => updateSettings(["streaming", "showLatencyMetrics"], v)}
            />
            <SettingToggle
              label={t.showStreamingSpeed}
              checked={getValue(["streaming", "showStreamingSpeed"], false)}
              onCheckedChange={(v) => updateSettings(["streaming", "showStreamingSpeed"], v)}
            />
            <SettingToggle
              label={t.showCostEstimates}
              checked={getValue(["streaming", "showCostEstimates"], false)}
              onCheckedChange={(v) => updateSettings(["streaming", "showCostEstimates"], v)}
            />
          </div>

          {/* Progress & Context */}
          <div className="pt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress</p>
            <SettingToggle
              label={t.showProgressIndicators}
              checked={getValue(["streaming", "showProgressIndicators"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showProgressIndicators"], v)}
            />
            <SettingToggle
              label={t.showContextUsage}
              checked={getValue(["streaming", "showContextUsage"], false)}
              onCheckedChange={(v) => updateSettings(["streaming", "showContextUsage"], v)}
            />
            <SettingToggle
              label={t.showPhaseDurations}
              checked={getValue(["streaming", "showPhaseDurations"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showPhaseDurations"], v)}
            />
          </div>

          {/* Advanced */}
          <div className="pt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Advanced</p>
            <SettingToggle
              label={t.showModelInfo}
              checked={getValue(["streaming", "showModelInfo"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showModelInfo"], v)}
            />
            <SettingToggle
              label={t.showToolChains}
              checked={getValue(["streaming", "showToolChains"], false)}
              onCheckedChange={(v) => updateSettings(["streaming", "showToolChains"], v)}
            />
            <SettingToggle
              label={t.showErrorDetails}
              checked={getValue(["streaming", "showErrorDetails"], true)}
              onCheckedChange={(v) => updateSettings(["streaming", "showErrorDetails"], v)}
            />
          </div>
        </SettingSection>
      </div>
    </div>
  )
}
