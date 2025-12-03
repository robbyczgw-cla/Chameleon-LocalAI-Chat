"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect, type ChangeEvent, lazy, Suspense } from "react"
import { useApp } from "@/contexts/app-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { SettingsDialogProps } from "@/types"
import { voiceService, OPENAI_TTS_VOICES } from "@/lib/voice"
import { memoryService } from "@/lib/memory-service"
import { ModeHelpDialog } from "@/components/mode-help-dialog"

// Lazy load heavy components for better initial bundle size
const MCPSettings = lazy(() => import("@/components/mcp-settings").then(m => ({ default: m.MCPSettings })))
const SystemPromptsManager = lazy(() => import("@/components/system-prompts-manager").then(m => ({ default: m.SystemPromptsManager })))
const UsageStatsWidget = lazy(() => import("@/components/usage-stats-widget").then(m => ({ default: m.UsageStatsWidget })))
const AIMemoryHub = lazy(() => import("@/components/ai-memory-hub").then(m => ({ default: m.AIMemoryHub })))
const ChatAnalytics = lazy(() => import("@/components/chat-analytics").then(m => ({ default: m.ChatAnalytics })))
const ExperimentalSettings = lazy(() => import("@/components/experimental-settings").then(m => ({ default: m.ExperimentalSettings })))
const BackupSettings = lazy(() => import("@/components/backup-settings").then(m => ({ default: m.BackupSettings })))

// Loading fallback for lazy components
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )
}
import { Brain, HelpCircle, BarChart3, FlaskRound, Mic, MicOff, CheckCircle2, XCircle, AlertCircle, Settings, Key, Search, Volume2, Puzzle, PieChart, Server, RefreshCw, Loader2, HardDrive } from "lucide-react"
import { fetchLMStudioModels, checkLMStudioConnection, DEFAULT_LM_STUDIO_ENDPOINT } from "@/lib/lmstudio"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"

interface ExtendedSettingsDialogProps extends SettingsDialogProps {
  hideOptions?: string[] // Array of tab IDs to hide: "prompts", "voice", "mcp", "mode"
}

export function SettingsDialog({ open, onOpenChange, hideOptions = [] }: ExtendedSettingsDialogProps) {
  const { settings, updateSettings } = useApp()
  const [localSettings, setLocalSettings] = useState(settings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>("light")
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt' | 'testing'>('unknown')
  const [lmStudioStatus, setLmStudioStatus] = useState<'unknown' | 'checking' | 'connected' | 'disconnected'>('unknown')
  const [lmStudioRefreshing, setLmStudioRefreshing] = useState(false)
  const { toast } = useToast()

  // Test LM Studio connection and fetch models
  const testLMStudioConnection = async () => {
    const endpoint = localSettings.lmStudio?.endpoint || DEFAULT_LM_STUDIO_ENDPOINT
    setLmStudioStatus('checking')

    try {
      const isConnected = await checkLMStudioConnection(endpoint)
      if (isConnected) {
        setLmStudioStatus('connected')
        toast({
          title: "LM Studio Connected",
          description: "Successfully connected to LM Studio server.",
        })
      } else {
        setLmStudioStatus('disconnected')
        toast({
          title: "LM Studio Not Available",
          description: "Could not connect to LM Studio. Make sure it's running.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setLmStudioStatus('disconnected')
      toast({
        title: "Connection Failed",
        description: "Error connecting to LM Studio. Check the endpoint URL.",
        variant: "destructive",
      })
    }
  }

  // Refresh LM Studio models
  const refreshLMStudioModels = async () => {
    const endpoint = localSettings.lmStudio?.endpoint || DEFAULT_LM_STUDIO_ENDPOINT
    setLmStudioRefreshing(true)

    try {
      const models = await fetchLMStudioModels(endpoint)
      setLocalSettings({
        ...localSettings,
        lmStudio: {
          ...localSettings.lmStudio,
          enabled: true,
          endpoint,
          models,
        },
      })
      setLmStudioStatus('connected')
      toast({
        title: "Models Loaded",
        description: `Found ${models.length} model${models.length !== 1 ? 's' : ''} in LM Studio.`,
      })
    } catch (error) {
      setLmStudioStatus('disconnected')
      toast({
        title: "Failed to Load Models",
        description: "Could not fetch models from LM Studio. Make sure it's running.",
        variant: "destructive",
      })
    } finally {
      setLmStudioRefreshing(false)
    }
  }
  const currentLanguage = settings.language || "en"
  const { t, translations } = useTranslation(currentLanguage)

  // Test microphone permission
  const testMicrophonePermission = async () => {
    setMicPermission('testing')

    try {
      // First check the permission state if API is available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // @ts-ignore
          const result = await navigator.permissions.query({ name: 'microphone' })
          if (result.state === 'denied') {
            setMicPermission('denied')
            toast({
              title: "Microphone Blocked",
              description: "Open Chrome browser (not PWA), go to this site, and allow microphone access there.",
              variant: "destructive",
              duration: 8000,
            })
            return
          }
        } catch (e) {
          // Permission API not supported, continue with getUserMedia test
        }
      }

      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Success! Clean up immediately
      stream.getTracks().forEach(track => track.stop())

      setMicPermission('granted')
      toast({
        title: "Microphone Access Granted",
        description: "Voice input should now work!",
      })
    } catch (error: any) {
      console.error('[Settings] Microphone test error:', error)

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicPermission('denied')
        toast({
          title: "Microphone Permission Denied",
          description: "To fix: Open Chrome browser → go to this site URL → click the lock icon → allow Microphone → then return to PWA",
          variant: "destructive",
          duration: 10000,
        })
      } else if (error.name === 'NotFoundError') {
        setMicPermission('denied')
        toast({
          title: "No Microphone Found",
          description: "Please connect a microphone and try again.",
          variant: "destructive",
        })
      } else {
        setMicPermission('denied')
        toast({
          title: "Microphone Error",
          description: error.message || "Unknown error accessing microphone",
          variant: "destructive",
        })
      }
    }
  }

  // CRITICAL: Sync localSettings when dialog is open and settings change
  // This prevents stale state from overwriting memory toggle changes
  useEffect(() => {
    if (open) {
      console.log("[SettingsDialog] Syncing localSettings with global settings:", {
        globalMemoryEnabled: settings.memorySettings?.enabled,
        localMemoryEnabled: localSettings.memorySettings?.enabled
      })
      setLocalSettings(settings)
    }
  }, [open, settings]) // Sync when dialog opens OR when settings change while dialog is open

  // DEBUG: Log whenever localSettings changes
  useEffect(() => {
    console.log("[SettingsDialog] localSettings changed:", {
      memoryEnabled: localSettings.memorySettings?.enabled,
      hasApiKeys: !!localSettings.apiKeys?.openRouter
    })
  }, [localSettings])

  useEffect(() => {
    // Load voices - they load asynchronously on most browsers
    const loadVoices = () => {
      const availableVoices = voiceService.getVoices()
      if (availableVoices.length > 0) {
        // Sort voices: English first, then by name
        const sorted = availableVoices.sort((a, b) => {
          const aEn = a.lang.startsWith('en')
          const bEn = b.lang.startsWith('en')
          if (aEn && !bEn) return -1
          if (!aEn && bEn) return 1
          return a.name.localeCompare(b.name)
        })
        setVoices(sorted)
      }
    }

    if (voiceService.isSupported()) {
      // Try immediately
      loadVoices()
      // Also listen for voiceschanged event (required for Chrome)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
      // Fallback timeout for older browsers
      setTimeout(loadVoices, 500)
    }

    // Load theme from localStorage
    const savedTheme = localStorage.getItem("chameleon-theme") || "light"
    setCurrentTheme(savedTheme)
    applyTheme(savedTheme)

    // Listen for closeSettings event from Knowledge Base
    const handleCloseSettings = () => {
      onOpenChange(false)
    }
    window.addEventListener("closeSettings", handleCloseSettings)

    return () => {
      window.removeEventListener("closeSettings", handleCloseSettings)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [onOpenChange])

  const applyTheme = (theme: string) => {
    const html = document.documentElement
    // Remove all theme classes
    html.classList.remove("dark", "girly-violet", "ocean-breeze", "paper-mint", "clean-slate", "midnight-hologram", "cosmic-glass", "modern-light")
    // Add the selected theme
    if (theme !== "light") {
      html.classList.add(theme)
    }
    // Save to localStorage
    localStorage.setItem("chameleon-theme", theme)
  }

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    applyTheme(theme)
  }

  const handleSave = () => {
    console.log("[SettingsDialog] handleSave called, saving localSettings:", {
      memoryEnabled: localSettings.memorySettings?.enabled,
      hasApiKeys: !!localSettings.apiKeys
    })
    updateSettings(localSettings)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{translations.settings.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full flex-1 flex flex-col overflow-hidden">
          {/* Mobile: horizontal scroll, Desktop: 2 rows grid */}
          <div className="flex-shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto sm:overflow-x-visible">
            <TabsList className="inline-flex w-auto min-w-full h-auto gap-1 justify-start sm:grid sm:grid-cols-5 sm:w-full sm:gap-1.5">
              <TabsTrigger value="general" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Settings className="h-3.5 w-3.5 mr-1.5 inline-block" />
                {translations.settings.general}
              </TabsTrigger>
              <TabsTrigger value="memory" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Brain className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Memory
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="api" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Key className="h-3.5 w-3.5 mr-1.5 inline-block" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Search className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Search
              </TabsTrigger>
              {!hideOptions.includes("voice") && (
                <TabsTrigger value="voice" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                  <Volume2 className="h-3.5 w-3.5 mr-1.5 inline-block" />
                  Voice
                </TabsTrigger>
              )}
              {!hideOptions.includes("mcp") && (
                <TabsTrigger value="mcp" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                  <Puzzle className="h-3.5 w-3.5 mr-1.5 inline-block" />
                  MCP
                </TabsTrigger>
              )}
              <TabsTrigger value="statistics" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <PieChart className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="backup" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <HardDrive className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Backup
              </TabsTrigger>
              <TabsTrigger value="experimental" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <FlaskRound className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Labs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="general" className="space-y-4 mt-0">
              {/* Simple Mode Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="simple-mode" className="text-sm sm:text-base font-medium">Simple Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Clean, persona-focused interface. Perfect for everyday conversations.
                  </p>
                </div>
                <Switch
                  id="simple-mode"
                  checked={localSettings.simpleMode ?? false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, simpleMode: checked })
                  }
                  className="flex-shrink-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt" className="text-sm sm:text-base">
                  {translations.settings.systemPrompt}
                </Label>
                <Textarea
                  id="system-prompt"
                  placeholder={translations.settings.systemPromptPlaceholder}
                  value={localSettings.systemPrompt}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
                  rows={4}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {translations.settings.systemPromptHelp}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">{translations.settings.language}</Label>
                <select
                  value={localSettings.language || "en"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({ ...localSettings, language: e.target.value as "en" | "de" })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="en">{translations.settings.languageEnglish}</option>
                  <option value="de">{translations.settings.languageGerman}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">{translations.settings.fontSize}</Label>
                <select
                  value={localSettings.fontSize || "medium"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({ ...localSettings, fontSize: e.target.value as "small" | "medium" | "large" })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="small">{translations.settings.fontSizeSmall}</option>
                  <option value="medium">{translations.settings.fontSizeMedium}</option>
                  <option value="large">{translations.settings.fontSizeLarge}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Font Family</Label>
                <select
                  value={localSettings.fontFamily || "inter"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({
                      ...localSettings,
                      fontFamily: e.target.value as "inter" | "roboto" | "atkinson" | "opendyslexic" | "jetbrains" | "system",
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="inter">Inter (Default)</option>
                  <option value="roboto">Roboto</option>
                  <option value="atkinson">Atkinson Hyperlegible (Dyslexia-friendly)</option>
                  <option value="opendyslexic">OpenDyslexic</option>
                  <option value="jetbrains">JetBrains Mono</option>
                  <option value="system">System Font</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose a font that's comfortable for reading. Atkinson and OpenDyslexic are designed for accessibility.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Message Spacing</Label>
                <select
                  value={localSettings.messageDensity || "comfortable"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({
                      ...localSettings,
                      messageDensity: e.target.value as "compact" | "comfortable" | "spacious",
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="compact">Compact (more messages visible)</option>
                  <option value="comfortable">Comfortable (normal)</option>
                  <option value="spacious">Spacious (more breathing room)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Color Theme</Label>
                <select
                  value={currentTheme}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleThemeChange(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="light">☀️ Light - Bright & Classic</option>
                  <option value="dark">🌙 Dark - Dark & Modern</option>
                  <option value="cosmic-glass">🔮 Cosmic Glass - Deep Space & Neon</option>
                  <option value="modern-light">✨ Modern Light - Clean & Airy</option>
                  <option value="clean-slate">🧼 Clean Slate - Minimal & Neutral</option>
                  <option value="midnight-hologram">🌌 Midnight Hologram - Neon Cyan & Purple</option>
                  <option value="girly-violet">💜 Girly Violet - Soft & Purple</option>
                  <option value="ocean-breeze">🌊 Ocean Breeze - Fresh & Aqua</option>
                  <option value="paper-mint">📄 Paper Mint - Warm & Crisp</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose your favorite theme for the user interface
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="keyboard-shortcuts" className="text-sm sm:text-base">
                  Enable Keyboard Shortcuts
                </Label>
                <Switch
                  id="keyboard-shortcuts"
                  checked={localSettings.enableKeyboardShortcuts !== false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, enableKeyboardShortcuts: checked })
                  }
                />
              </div>


              {/* Exa Search Toggle */}
              {hideOptions.includes("mode") && (
                <div className="p-3 sm:p-4 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                        <span className="text-xl">🔍</span>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="use-exa" className="text-sm sm:text-base font-medium">Exa Semantic Search (experimentell)</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Nutze Exa für tiefe technische Recherche (semantische Suche, lange Kontext-Passagen)
                        </p>
                      </div>
                      <Switch
                        id="use-exa"
                        checked={localSettings.useExaSearch ?? false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({ ...localSettings, useExaSearch: checked })
                        }
                        className="flex-shrink-0"
                      />
                    </div>
                    <div className="text-xs space-y-1 p-2 bg-blue-100 dark:bg-blue-950/50 rounded">
                      <p className="font-medium">ℹ️ Was ist Exa?</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Semantische Suche via OpenRouter (model:online)</li>
                        <li>Lange, detaillierte Passagen von Hersteller-Seiten</li>
                        <li>Beste für: Technische Specs, Vergleiche, Forschung</li>
                        <li>Kosten: ~$0.02 pro Anfrage (10x teurer als Serper)</li>
                        <li>Kann mit Serper/Tavily kombiniert werden</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Help button - mobile only */}
              <div className="md:hidden p-3 sm:p-4 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setIsHelpOpen(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                  Hilfe & Tipps
                </Button>
              </div>

            </TabsContent>

            <TabsContent value="memory" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <AIMemoryHub />
              </Suspense>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <ChatAnalytics />
              </Suspense>
            </TabsContent>

            <TabsContent value="api" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="openrouter-key" className="text-sm sm:text-base">
                  OpenRouter API Key
                </Label>
                <Input
                  id="openrouter-key"
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={localSettings.apiKeys?.openRouter || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, openRouter: e.target.value },
                    })
                  }
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">
                    openrouter.ai/keys
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm sm:text-base">
                  OpenAI API Key (für Whisper Voice Input)
                </Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={localSettings.apiKeys?.openAI || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, openAI: e.target.value },
                    })
                  }
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Für Spracheingabe via Whisper API. Key von{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                    platform.openai.com/api-keys
                  </a> ($0.006/Minute)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tavily-key" className="text-sm sm:text-base">
                  Tavily API Key (for web search)
                </Label>
                <Input
                  id="tavily-key"
                  type="password"
                  placeholder="tvly-..."
                  value={localSettings.apiKeys?.tavily || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, tavily: e.target.value },
                    })
                  }
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="underline">
                    tavily.com
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serper-key" className="text-sm sm:text-base">
                  Serper API Key (Google Search - optional)
                </Label>
                <Input
                  id="serper-key"
                  type="password"
                  placeholder="..."
                  value={localSettings.apiKeys?.serper || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, serper: e.target.value },
                    })
                  }
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Get your API key from{" "}
                  <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="underline">
                    serper.dev
                  </a>{" "}
                  (10x cheaper, better DACH results)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exa-key" className="text-sm sm:text-base">
                  🔮 Exa API Key (Neural/Semantic Search)
                </Label>
                <Input
                  id="exa-key"
                  type="password"
                  placeholder="exa-..."
                  value={localSettings.apiKeys?.exa || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, exa: e.target.value },
                    })
                  }
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Get your API key from{" "}
                  <a href="https://exa.ai" target="_blank" rel="noopener noreferrer" className="underline">
                    exa.ai
                  </a>{" "}
                  - Best for RAG, semantic search & research (~$0.01/search)
                </p>
              </div>

              {/* LM Studio Local Models Section - Desktop only (not useful on mobile) */}
              <div className="hidden md:block space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-sm sm:text-base">LM Studio (Local Models)</h4>
                </div>

                <div className="rounded-lg border p-3 sm:p-4 bg-green-50 dark:bg-green-950/20">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="lmstudio-enabled" className="text-sm sm:text-base font-medium">Enable LM Studio</Label>
                        <p className="text-xs text-muted-foreground">
                          Connect to locally running LLMs via LM Studio
                        </p>
                      </div>
                      <Switch
                        id="lmstudio-enabled"
                        checked={localSettings.lmStudio?.enabled ?? false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            lmStudio: { ...localSettings.lmStudio, enabled: checked, endpoint: localSettings.lmStudio?.endpoint || DEFAULT_LM_STUDIO_ENDPOINT },
                          })
                        }
                        className="flex-shrink-0"
                      />
                    </div>

                    {localSettings.lmStudio?.enabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="lmstudio-endpoint" className="text-sm">
                            Server Endpoint
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="lmstudio-endpoint"
                              type="url"
                              placeholder="http://localhost:1234/v1"
                              value={localSettings.lmStudio?.endpoint || DEFAULT_LM_STUDIO_ENDPOINT}
                              onChange={(e) =>
                                setLocalSettings({
                                  ...localSettings,
                                  lmStudio: { ...localSettings.lmStudio, enabled: true, endpoint: e.target.value },
                                })
                              }
                              className="text-sm min-h-[44px] flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={testLMStudioConnection}
                              disabled={lmStudioStatus === 'checking'}
                              className="min-h-[44px] px-3"
                            >
                              {lmStudioStatus === 'checking' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : lmStudioStatus === 'connected' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : lmStudioStatus === 'disconnected' ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                "Test"
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Default: http://localhost:1234/v1 (LM Studio default port)
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-0.5">
                            <Label className="text-sm">Available Models</Label>
                            <p className="text-xs text-muted-foreground">
                              {localSettings.lmStudio?.models?.length
                                ? `${localSettings.lmStudio.models.length} model${localSettings.lmStudio.models.length !== 1 ? 's' : ''} loaded`
                                : "No models loaded yet"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshLMStudioModels}
                            disabled={lmStudioRefreshing}
                            className="min-h-[40px] gap-2"
                          >
                            {lmStudioRefreshing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            Refresh Models
                          </Button>
                        </div>

                        {localSettings.lmStudio?.models && localSettings.lmStudio.models.length > 0 && (
                          <div className="rounded-md border bg-background p-2 max-h-32 overflow-y-auto">
                            <ul className="space-y-1">
                              {localSettings.lmStudio.models.map((model) => (
                                <li key={model.id} className="text-xs flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  {model.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2 text-xs space-y-1">
                          <p className="font-medium">How to use:</p>
                          <ol className="list-decimal list-inside space-y-0.5 pl-1">
                            <li>Download & install <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" className="underline">LM Studio</a></li>
                            <li>Load a model in LM Studio</li>
                            <li>Start the local server (default port: 1234)</li>
                            <li>Click "Refresh Models" above</li>
                            <li>Select local models from the model dropdown</li>
                          </ol>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </TabsContent>

            <TabsContent value="search" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Websuche Einstellungen</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Konfigurieren Sie die Websuche für genauere und relevantere Ergebnisse.
                  </p>
                </div>

                {/* Auto Search Toggle */}
{/* Auto Search moved to Experimental tab */}

                <div className="space-y-2">
                  <Label htmlFor="search-provider" className="text-sm sm:text-base">
                    Search Provider
                  </Label>
                  <select
                    id="search-provider"
                    value={localSettings.searchProvider || "tavily"}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        searchProvider: e.target.value as "tavily" | "serper" | "exa",
                      })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                  >
                    <option value="tavily">🌐 Tavily - LLM-optimiert (~$0.01/search)</option>
                    <option value="serper">🔍 Serper - Google Search (~$0.001/search)</option>
                    <option value="exa">🔮 Exa - Neural/Semantic Search (~$0.01/search)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Wähle den Suchanbieter für die Web-Suche. Exa bietet semantische Suche für beste RAG-Ergebnisse.
                  </p>
                </div>

                {localSettings.searchProvider === "serper" && (
                  <div className="rounded-lg border p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">🔍 Serper (Google Search)</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm sm:text-base">
                          Max Ergebnisse: {localSettings.serperSettings?.maxResults || 5}
                        </Label>
                        <Slider
                          value={[localSettings.serperSettings?.maxResults || 5]}
                          onValueChange={([value]) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, maxResults: value } as any,
                            })
                          }
                          min={1}
                          max={10}
                          step={1}
                          className="touch-none"
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <Label htmlFor="serper-images" className="text-sm sm:text-base">
                          Produktbilder einbeziehen
                        </Label>
                        <Switch
                          id="serper-images"
                          checked={localSettings.serperSettings?.includeImages !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, includeImages: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serper-country" className="text-sm sm:text-base">
                          Land
                        </Label>
                        <select
                          id="serper-country"
                          value={localSettings.serperSettings?.country || "at"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, country: e.target.value } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="at">🇦🇹 Österreich</option>
                          <option value="de">🇩🇪 Deutschland</option>
                          <option value="ch">🇨🇭 Schweiz</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serper-language" className="text-sm sm:text-base">
                          Sprache
                        </Label>
                        <select
                          id="serper-language"
                          value={localSettings.serperSettings?.language || "de"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, language: e.target.value } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="de">Deutsch</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serper-type" className="text-sm sm:text-base">
                          Suchtyp
                        </Label>
                        <select
                          id="serper-type"
                          value={localSettings.serperSettings?.type || "search"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, type: e.target.value as any } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="search">🔍 Web Search</option>
                          <option value="news">📰 News</option>
                          <option value="images">🖼️ Images</option>
                          <option value="videos">🎥 Videos</option>
                          <option value="places">📍 Places</option>
                          <option value="shopping">🛒 Shopping</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serper-timerange" className="text-sm sm:text-base">
                          Zeitfilter
                        </Label>
                        <select
                          id="serper-timerange"
                          value={localSettings.serperSettings?.timeRange || "none"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, timeRange: e.target.value as any } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="none">⏰ Alle Ergebnisse</option>
                          <option value="hour">Letzte Stunde</option>
                          <option value="day">Letzter Tag</option>
                          <option value="week">Letzte Woche</option>
                          <option value="month">Letzter Monat</option>
                          <option value="year">Letztes Jahr</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <Label htmlFor="serper-autocorrect" className="text-sm sm:text-base">
                          Rechtschreibkorrektur
                        </Label>
                        <Switch
                          id="serper-autocorrect"
                          checked={localSettings.serperSettings?.autocorrect !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, autocorrect: checked } as any,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {localSettings.searchProvider === "exa" && (
                  <div className="rounded-lg border p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">🔮 Exa Neural Search</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Semantische Suche mit AI-Verständnis - optimal für RAG und Recherche
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm sm:text-base">
                          Max Ergebnisse: {localSettings.exaSettings?.maxResults || 5}
                        </Label>
                        <Slider
                          value={[localSettings.exaSettings?.maxResults || 5]}
                          onValueChange={([value]) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, maxResults: value } as any,
                            })
                          }
                          min={1}
                          max={20}
                          step={1}
                          className="touch-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exa-search-type" className="text-sm sm:text-base">
                          Suchmethode
                        </Label>
                        <select
                          id="exa-search-type"
                          value={localSettings.exaSettings?.searchType || "auto"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, searchType: e.target.value as any } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="auto">🤖 Auto - Kombination aus Neural & Keyword</option>
                          <option value="neural">🧠 Neural - Semantische Suche (Embeddings)</option>
                          <option value="keyword">🔤 Keyword - Traditionelle Stichwortsuche</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exa-category" className="text-sm sm:text-base">
                          Kategorie-Filter (optional)
                        </Label>
                        <select
                          id="exa-category"
                          value={localSettings.exaSettings?.category || ""}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, category: e.target.value || undefined } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="">Alle Kategorien</option>
                          <option value="news">📰 News</option>
                          <option value="research paper">📄 Research Papers</option>
                          <option value="github">💻 GitHub</option>
                          <option value="company">🏢 Unternehmen</option>
                          <option value="pdf">📑 PDFs</option>
                          <option value="tweet">🐦 Tweets</option>
                          <option value="linkedin profile">💼 LinkedIn</option>
                          <option value="personal site">🏠 Personal Sites</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="exa-autoprompt" className="text-sm sm:text-base">
                            Autoprompt
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Exa optimiert deine Suchanfrage automatisch
                          </p>
                        </div>
                        <Switch
                          id="exa-autoprompt"
                          checked={localSettings.exaSettings?.useAutoprompt !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, useAutoprompt: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="exa-fulltext" className="text-sm sm:text-base">
                            Volltext einbeziehen
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Kompletten Seiteninhalt für RAG laden
                          </p>
                        </div>
                        <Switch
                          id="exa-fulltext"
                          checked={localSettings.exaSettings?.includeFullText !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, includeFullText: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="exa-highlights" className="text-sm sm:text-base">
                            Highlights einbeziehen
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Relevante Textausschnitte extrahieren
                          </p>
                        </div>
                        <Switch
                          id="exa-highlights"
                          checked={localSettings.exaSettings?.includeHighlights !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, includeHighlights: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="exa-summary" className="text-sm sm:text-base">
                            AI-Zusammenfassung
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Generierte Zusammenfassung pro Ergebnis (+$0.001)
                          </p>
                        </div>
                        <Switch
                          id="exa-summary"
                          checked={localSettings.exaSettings?.includeSummary || false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, includeSummary: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <div>
                          <Label htmlFor="exa-images" className="text-sm sm:text-base cursor-pointer">
                            🖼️ Bilder einbeziehen
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Bilder aus Suchergebnissen anzeigen
                          </p>
                        </div>
                        <Switch
                          id="exa-images"
                          checked={localSettings.exaSettings?.includeImages || false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, includeImages: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exa-livecrawl" className="text-sm sm:text-base">
                          Livecrawl-Modus
                        </Label>
                        <select
                          id="exa-livecrawl"
                          value={localSettings.exaSettings?.livecrawl || "fallback"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, livecrawl: e.target.value as any } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="never">⚡ Nie - Nur aus Cache</option>
                          <option value="fallback">🔄 Fallback - Bei veraltetem Content</option>
                          <option value="always">🌐 Immer - Stets frische Daten</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Steuert, ob Exa Seiten live crawlt für aktuelle Inhalte
                        </p>
                      </div>

                      <div className="rounded-lg border p-3 bg-purple-100 dark:bg-purple-900/30">
                        <h5 className="font-medium text-sm mb-1">💡 Exa Tipps</h5>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Neural-Suche versteht Bedeutung, nicht nur Stichwörter</li>
                          <li>Kategorie-Filter für spezifische Quellen (GitHub, News, Papers)</li>
                          <li>Highlights sind ideal für prägnante RAG-Kontexte</li>
                          <li>Volltext für tiefgehende Analyse und längere Dokumente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {(!localSettings.searchProvider || localSettings.searchProvider === "tavily") && (
                  <div className="space-y-3">
                    <h4 className="font-medium mb-3 text-sm sm:text-base">📡 Tavily Einstellungen</h4>

                    <div className="space-y-2">
                      <Label htmlFor="search-depth" className="text-sm sm:text-base">
                        Suchtiefe
                      </Label>
                      <select
                        id="search-depth"
                        value={localSettings.tavilySettings?.searchDepth || "basic"}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: {
                              ...localSettings.tavilySettings,
                              searchDepth: e.target.value as "basic" | "advanced",
                            } as any,
                          })
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                      >
                        <option value="basic">Basic - Schneller, weniger detailliert</option>
                        <option value="advanced">Advanced - Langsamer, mehr Details</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Basic ist schneller und günstiger, Advanced liefert umfassendere Ergebnisse.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">
                        Maximale Ergebnisse: {localSettings.tavilySettings?.maxResults || 5}
                      </Label>
                      <Slider
                        value={[localSettings.tavilySettings?.maxResults || 5]}
                        onValueChange={([value]) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, maxResults: value } as any,
                          })
                        }
                        min={1}
                        max={10}
                        step={1}
                        className="touch-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Anzahl der Suchergebnisse, die in den Kontext einbezogen werden.
                      </p>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5 flex-1 pr-4">
                        <Label htmlFor="include-images" className="text-sm sm:text-base">
                          Bilder einbeziehen
                        </Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Relevante Bilder in Suchergebnissen anzeigen
                        </p>
                      </div>
                      <Switch
                        id="include-images"
                        checked={localSettings.tavilySettings?.includeImages || false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, includeImages: checked } as any,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5 flex-1 pr-4">
                        <Label htmlFor="include-answer" className="text-sm sm:text-sm">
                          KI-Antwort einbeziehen
                        </Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Tavily's KI-generierte Zusammenfassung der Suchergebnisse verwenden
                        </p>
                      </div>
                      <Switch
                        id="include-answer"
                        checked={localSettings.tavilySettings?.includeAnswer !== false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, includeAnswer: checked } as any,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tavily-topic" className="text-sm sm:text-base">
                        Suchfokus
                      </Label>
                      <select
                        id="tavily-topic"
                        value={localSettings.tavilySettings?.topic || "general"}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, topic: e.target.value as any } as any,
                          })
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                      >
                        <option value="general">🌐 Allgemein</option>
                        <option value="news">📰 News</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5 flex-1 pr-4">
                        <Label htmlFor="include-raw-content" className="text-sm sm:text-base">
                          Vollständiger Content
                        </Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Lädt kompletten HTML/Text-Inhalt (erhöht Token-Nutzung)
                        </p>
                      </div>
                      <Switch
                        id="include-raw-content"
                        checked={localSettings.tavilySettings?.includeRawContent || false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, includeRawContent: checked } as any,
                          })
                        }
                      />
                    </div>

                    <div className="rounded-lg border p-3 sm:p-4 bg-muted/50">
                      <h4 className="font-medium mb-2 text-sm sm:text-base">💡 Tipps für bessere Suchergebnisse</h4>
                      <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Verwenden Sie spezifische Suchbegriffe für genauere Ergebnisse</li>
                        <li>Advanced-Modus für komplexe Recherchen und Faktenprüfung</li>
                        <li>Mehr Ergebnisse = mehr Kontext, aber höhere Kosten</li>
                        <li>KI-Antwort liefert eine prägnante Zusammenfassung der Ergebnisse</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {!hideOptions.includes("voice") && (
              <TabsContent value="voice" className="space-y-4 mt-0">
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="voice-enabled" className="text-sm sm:text-base">
                    Enable Voice Features
                  </Label>
                  <Switch
                    id="voice-enabled"
                    checked={localSettings.voiceSettings?.enabled !== false}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        voiceSettings: { ...localSettings.voiceSettings, enabled: checked } as any,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="auto-play" className="text-sm sm:text-base">
                    Auto-play Responses
                  </Label>
                  <Switch
                    id="auto-play"
                    checked={localSettings.voiceSettings?.autoPlay || false}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        voiceSettings: { ...localSettings.voiceSettings, autoPlay: checked } as any,
                      })
                    }
                  />
                </div>

                {/* TTS Provider Selection */}
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">TTS Provider</Label>
                  <select
                    value={localSettings.voiceSettings?.ttsProvider || "browser"}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        voiceSettings: { ...localSettings.voiceSettings, ttsProvider: e.target.value } as any,
                      })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                  >
                    <option value="browser">Browser (Free, basic quality)</option>
                    <option value="openai">OpenAI (Requires API key, high quality)</option>
                  </select>
                </div>

                {/* Browser Voice Selection */}
                {(localSettings.voiceSettings?.ttsProvider || "browser") === "browser" && (
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Voice ({voices.length} available)</Label>
                    <div className="flex gap-2">
                      <select
                        value={localSettings.voiceSettings?.voice || ""}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            voiceSettings: { ...localSettings.voiceSettings, voice: e.target.value } as any,
                          })
                        }
                        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                      >
                        <option value="">System Default</option>
                        {voices.length === 0 && <option disabled>Loading voices...</option>}
                        {voices.map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang}){voice.localService ? '' : ' ☁️'}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-[44px] px-3"
                        onClick={() => {
                          const testText = "Hello! This is a test of the browser text-to-speech."
                          voiceService.speak(testText, {
                            rate: localSettings.voiceSettings?.rate || 1,
                            pitch: localSettings.voiceSettings?.pitch || 1,
                            voice: localSettings.voiceSettings?.voice,
                          })
                        }}
                      >
                        Test
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ☁️ = Online voice (higher quality). Choose an English voice for best results.
                    </p>
                  </div>
                )}

                {/* OpenAI Voice Selection */}
                {localSettings.voiceSettings?.ttsProvider === "openai" && (
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">OpenAI Voice</Label>
                    <div className="flex gap-2">
                      <select
                        value={localSettings.voiceSettings?.openaiVoice || "nova"}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            voiceSettings: { ...localSettings.voiceSettings, openaiVoice: e.target.value } as any,
                          })
                        }
                        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                      >
                        {OPENAI_TTS_VOICES.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} - {voice.description}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-[44px] px-3"
                        onClick={async () => {
                          const openAiKey = localSettings.apiKeys?.openAI
                          if (!openAiKey) {
                            toast({
                              title: "API Key Required",
                              description: "Please add your OpenAI API key in the API Keys tab",
                              variant: "destructive",
                            })
                            return
                          }
                          toast({ title: "🔊 Generating speech..." })
                          await voiceService.speakWithOpenAI(
                            "Hello! This is a test of the OpenAI text-to-speech voice.",
                            openAiKey,
                            {
                              voice: (localSettings.voiceSettings?.openaiVoice as any) || 'nova',
                              speed: localSettings.voiceSettings?.rate || 1,
                            }
                          )
                        }}
                      >
                        Test
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      High-quality neural voices. Requires OpenAI API key.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Speech Rate: {localSettings.voiceSettings?.rate || 1}</Label>
                  <Slider
                    value={[localSettings.voiceSettings?.rate || 1]}
                    onValueChange={([value]) =>
                      setLocalSettings({
                        ...localSettings,
                        voiceSettings: { ...localSettings.voiceSettings, rate: value } as any,
                      })
                    }
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="touch-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Speech Pitch: {localSettings.voiceSettings?.pitch || 1}</Label>
                  <Slider
                    value={[localSettings.voiceSettings?.pitch || 1]}
                    onValueChange={([value]) =>
                      setLocalSettings({
                        ...localSettings,
                        voiceSettings: { ...localSettings.voiceSettings, pitch: value } as any,
                      })
                    }
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="touch-none"
                  />
                </div>

                {/* Microphone Permission Test */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm sm:text-base font-medium">Microphone Permission</Label>
                  <p className="text-xs text-muted-foreground">
                    Voice input requires microphone access. Test it here:
                  </p>

                  <div className="flex items-center gap-3">
                    <Button
                      variant={micPermission === 'granted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={testMicrophonePermission}
                      disabled={micPermission === 'testing'}
                      className="min-h-[44px] gap-2"
                    >
                      {micPermission === 'testing' ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Testing...
                        </>
                      ) : micPermission === 'granted' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Microphone OK
                        </>
                      ) : micPermission === 'denied' ? (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          Test Again
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          Test Microphone
                        </>
                      )}
                    </Button>

                    {micPermission === 'granted' && (
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Ready to use
                      </span>
                    )}
                  </div>

                  {micPermission === 'denied' && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-2">
                      <p className="text-sm font-medium text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Microphone access blocked
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>To fix (PWA users):</strong></p>
                        <ol className="list-decimal list-inside space-y-1 pl-2">
                          <li>Open <strong>Chrome browser</strong> (not this app)</li>
                          <li>Go to this site's URL</li>
                          <li>Tap the <strong>lock icon</strong> in address bar</li>
                          <li>Tap <strong>Site settings</strong></li>
                          <li>Set <strong>Microphone</strong> to <strong>Allow</strong></li>
                          <li>Return to this app and test again</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {!hideOptions.includes("mcp") && (
              <TabsContent value="mcp" className="space-y-4 mt-0">
                <Suspense fallback={<TabLoadingFallback />}>
                  <MCPSettings />
                </Suspense>
              </TabsContent>
            )}

            <TabsContent value="statistics" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Nutzungsstatistiken</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verfolgen Sie Ihre API-Nutzung, Kosten und Chat-Aktivität im Detail.
                  </p>
                </div>
                <Suspense fallback={<TabLoadingFallback />}>
                  <UsageStatsWidget />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="backup" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <BackupSettings />
              </Suspense>
            </TabsContent>

            <TabsContent value="experimental" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <ExperimentalSettings />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-[44px]">
            Abbrechen
          </Button>
          <Button onClick={handleSave} className="min-h-[44px]">
            Änderungen speichern
          </Button>
        </div>
      </DialogContent>
      <ModeHelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </Dialog>
  )
}
