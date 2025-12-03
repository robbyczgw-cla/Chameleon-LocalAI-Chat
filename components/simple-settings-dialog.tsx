"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect, type ChangeEvent } from "react"
import { useApp } from "@/contexts/app-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { User, Palette, Key, Volume2, Sparkles, Settings2, ChevronRight, Search, Trophy } from "lucide-react"
import { userProfileService, type UserProfile } from "@/lib/user-profile"
import { voiceService, OPENAI_TTS_VOICES } from "@/lib/voice"
import { useToast } from "@/hooks/use-toast"

// Translations for Simple Settings
const translations = {
  en: {
    settings: "Settings",
    profile: "Profile",
    look: "Look",
    search: "Search",
    voice: "Voice",
    api: "API",
    welcomeBack: "Welcome back",
    setYourName: "Set your name below",
    yourName: "Your Name",
    whatShouldICall: "What should I call you?",
    whatDoYouDo: "What do you do?",
    occupationPlaceholder: "e.g., Student, Developer, Designer",
    interests: "Interests",
    editProfileToAdd: "Edit profile to add interests",
    editFullProfile: "Edit Full Profile",
    language: "Language",
    theme: "Theme",
    textSize: "Text Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    performanceMode: "Performance Mode",
    performanceModeDesc: "Reduce GPU usage (less blur effects)",
    webSearchInfo: "Web search lets the AI find current information from the internet.",
    serperApiKey: "Serper API Key (Google Search)",
    enterSerperKey: "Enter your Serper API key...",
    getFreeKey: "Get free key from",
    freeSearches: "(2,500 free searches)",
    includeImages: "Include Images",
    showImagesInSearch: "Show images in search results",
    webSearchReady: "Web search is ready! Use the globe icon in chat to search.",
    enableVoice: "Enable Voice",
    readMessagesAloud: "Read messages aloud",
    voiceType: "Voice Type",
    browserVoice: "Browser Voice (Free)",
    openaiVoice: "OpenAI Voice (Premium)",
    requiresOpenAI: "Requires OpenAI API key",
    browserVoiceLabel: "Browser Voice",
    systemDefault: "System Default",
    apiKeysInfo: "API keys are needed for AI chat and voice features.",
    openRouterKey: "OpenRouter API Key",
    getFrom: "Get from",
    openAIKeyOptional: "OpenAI API Key (Optional)",
    forVoiceInput: "For voice input & premium TTS",
    switchToAdvanced: "Switch to Advanced Mode",
    advancedMode: "Advanced Mode",
    canSwitchBack: "You can switch back to Simple Mode in Settings.",
    achievements: "Achievements",
    viewAchievements: "View your achievements and streaks",
    cancel: "Cancel",
    save: "Save",
    settingsSaved: "Settings saved!",
    preferencesUpdated: "Your preferences have been updated.",
  },
  de: {
    settings: "Einstellungen",
    profile: "Profil",
    look: "Aussehen",
    search: "Suche",
    voice: "Stimme",
    api: "API",
    welcomeBack: "Willkommen zurück",
    setYourName: "Gib deinen Namen unten ein",
    yourName: "Dein Name",
    whatShouldICall: "Wie soll ich dich nennen?",
    whatDoYouDo: "Was machst du?",
    occupationPlaceholder: "z.B. Student, Entwickler, Designer",
    interests: "Interessen",
    editProfileToAdd: "Profil bearbeiten um Interessen hinzuzufügen",
    editFullProfile: "Vollständiges Profil bearbeiten",
    language: "Sprache",
    theme: "Design",
    textSize: "Textgröße",
    small: "Klein",
    medium: "Mittel",
    large: "Groß",
    performanceMode: "Performance-Modus",
    performanceModeDesc: "GPU-Last reduzieren (weniger Blur-Effekte)",
    webSearchInfo: "Die Websuche ermöglicht der KI, aktuelle Informationen aus dem Internet zu finden.",
    serperApiKey: "Serper API Key (Google Suche)",
    enterSerperKey: "Serper API Key eingeben...",
    getFreeKey: "Kostenlosen Key holen von",
    freeSearches: "(2.500 kostenlose Suchen)",
    includeImages: "Bilder einschließen",
    showImagesInSearch: "Bilder in Suchergebnissen anzeigen",
    webSearchReady: "Websuche bereit! Nutze das Globus-Symbol im Chat zum Suchen.",
    enableVoice: "Sprache aktivieren",
    readMessagesAloud: "Nachrichten vorlesen",
    voiceType: "Stimmtyp",
    browserVoice: "Browser-Stimme (Kostenlos)",
    openaiVoice: "OpenAI Stimme (Premium)",
    requiresOpenAI: "Benötigt OpenAI API Key",
    browserVoiceLabel: "Browser-Stimme",
    systemDefault: "Systemstandard",
    apiKeysInfo: "API Keys werden für KI-Chat und Sprachfunktionen benötigt.",
    openRouterKey: "OpenRouter API Key",
    getFrom: "Holen von",
    openAIKeyOptional: "OpenAI API Key (Optional)",
    forVoiceInput: "Für Spracheingabe & Premium TTS",
    switchToAdvanced: "Zum erweiterten Modus wechseln",
    advancedMode: "Erweiterter Modus",
    canSwitchBack: "Du kannst in den Einstellungen zurück zum einfachen Modus wechseln.",
    achievements: "Erfolge",
    viewAchievements: "Deine Erfolge und Streaks ansehen",
    cancel: "Abbrechen",
    save: "Speichern",
    settingsSaved: "Einstellungen gespeichert!",
    preferencesUpdated: "Deine Einstellungen wurden aktualisiert.",
  },
}

interface SimpleSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenAchievements?: () => void
}

export function SimpleSettingsDialog({ open, onOpenChange, onOpenAchievements }: SimpleSettingsDialogProps) {
  const { settings, updateSettings, user } = useApp()
  const [localSettings, setLocalSettings] = useState(settings)
  const [profile, setProfile] = useState<UserProfile>({})
  const [currentTheme, setCurrentTheme] = useState<string>("light")
  const [performanceMode, setPerformanceMode] = useState<boolean>(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const { toast } = useToast()

  // Get translations based on language
  const lang = settings.language === "de" ? "de" : "en"
  const t = translations[lang]

  useEffect(() => {
    if (open) {
      setLocalSettings(settings)
      setProfile(userProfileService.getProfile())
      const savedTheme = localStorage.getItem("chameleon-theme") || "light"
      setCurrentTheme(savedTheme)

      // Load performance mode setting
      const savedPerformanceMode = localStorage.getItem("chameleon-performance-mode") === "true"
      setPerformanceMode(savedPerformanceMode)

      // Load voices
      if (voiceService.isSupported()) {
        const availableVoices = voiceService.getVoices()
        if (availableVoices.length > 0) {
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
    }
  }, [open, settings])

  const applyTheme = (theme: string) => {
    const html = document.documentElement
    html.classList.remove("dark", "girly-violet", "ocean-breeze", "paper-mint", "clean-slate", "midnight-hologram", "cosmic-glass", "modern-light")
    if (theme !== "light") {
      html.classList.add(theme)
    }
    localStorage.setItem("chameleon-theme", theme)
  }

  const handlePerformanceModeChange = (enabled: boolean) => {
    setPerformanceMode(enabled)
    const html = document.documentElement
    if (enabled) {
      html.classList.add("performance-mode")
    } else {
      html.classList.remove("performance-mode")
    }
    localStorage.setItem("chameleon-performance-mode", String(enabled))
  }

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    applyTheme(theme)
  }

  const handleSave = async () => {
    // Save profile
    try {
      await userProfileService.saveProfile(profile, user?.id)
    } catch (error) {
      console.error("[SimpleSettings] Profile save error:", error)
    }

    // Save settings
    updateSettings(localSettings)

    toast({
      title: t.settingsSaved,
      description: t.preferencesUpdated,
    })
    onOpenChange(false)
  }

  const switchToAdvancedMode = () => {
    updateSettings({ simpleMode: false })
    onOpenChange(false)
    toast({
      title: t.advancedMode,
      description: t.canSwitchBack,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,900px)] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              {t.settings}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full min-w-0">
          <TabsList className="grid grid-cols-5 gap-1 w-full">
            <TabsTrigger value="profile" className="text-xs gap-1 px-2">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.profile}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs gap-1 px-2">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.look}</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs gap-1 px-2">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.search}</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs gap-1 px-2">
              <Volume2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.voice}</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1 px-2">
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.api}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 mt-0">
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {profile.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.welcomeBack}</p>
                    <p className="font-semibold">{profile.name || t.setYourName}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">{t.yourName}</Label>
                    <Input
                      id="name"
                      placeholder={t.whatShouldICall}
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="occupation" className="text-sm">{t.whatDoYouDo}</Label>
                    <Input
                      id="occupation"
                      placeholder={t.occupationPlaceholder}
                      value={profile.occupation || ""}
                      onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">{t.interests}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.interests || []).map((interest, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {(!profile.interests || profile.interests.length === 0) && (
                        <p className="text-xs text-muted-foreground">{t.editProfileToAdd}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => window.dispatchEvent(new Event("openProfile"))}
              >
                <span>{t.editFullProfile}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm">{t.language}</Label>
                <select
                  value={localSettings.language || "en"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({ ...localSettings, language: e.target.value as "en" | "de" })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t.theme}</Label>
                <select
                  value={currentTheme}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleThemeChange(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="cosmic-glass">Cosmic Glass</option>
                  <option value="modern-light">Modern Light</option>
                  <option value="girly-violet">Girly Violet</option>
                  <option value="ocean-breeze">Ocean Breeze</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t.textSize}</Label>
                <select
                  value={localSettings.fontSize || "medium"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({ ...localSettings, fontSize: e.target.value as "small" | "medium" | "large" })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                >
                  <option value="small">{t.small}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="large">{t.large}</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm">{t.performanceMode}</Label>
                  <p className="text-xs text-muted-foreground">{t.performanceModeDesc}</p>
                </div>
                <Switch
                  checked={performanceMode}
                  onCheckedChange={handlePerformanceModeChange}
                />
              </div>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4 mt-0">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {t.webSearchInfo}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serper-key" className="text-sm">{t.serperApiKey}</Label>
                <Input
                  id="serper-key"
                  type="password"
                  placeholder={t.enterSerperKey}
                  value={localSettings.apiKeys?.serper || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, serper: e.target.value },
                      searchProvider: "serper", // Auto-select Serper when key is added
                    })
                  }
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t.getFreeKey} <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="underline">serper.dev</a> {t.freeSearches}
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm">{t.includeImages}</Label>
                  <p className="text-xs text-muted-foreground">{t.showImagesInSearch}</p>
                </div>
                <Switch
                  checked={localSettings.serperSettings?.includeImages || false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      serperSettings: { ...localSettings.serperSettings, includeImages: checked } as any,
                    })
                  }
                />
              </div>

              {localSettings.apiKeys?.serper && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <span>✓</span> {t.webSearchReady}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="space-y-4 mt-0">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm">{t.enableVoice}</Label>
                  <p className="text-xs text-muted-foreground">{t.readMessagesAloud}</p>
                </div>
                <Switch
                  checked={localSettings.voiceSettings?.enabled !== false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      voiceSettings: { ...localSettings.voiceSettings, enabled: checked } as any,
                    })
                  }
                />
              </div>

              {localSettings.voiceSettings?.enabled !== false && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">{t.voiceType}</Label>
                    <select
                      value={localSettings.voiceSettings?.ttsProvider || "browser"}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          voiceSettings: { ...localSettings.voiceSettings, ttsProvider: e.target.value } as any,
                        })
                      }
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                    >
                      <option value="browser">{t.browserVoice}</option>
                      <option value="openai">{t.openaiVoice}</option>
                    </select>
                  </div>

                  {localSettings.voiceSettings?.ttsProvider === "openai" ? (
                    <div className="space-y-2">
                      <Label className="text-sm">{t.openaiVoice}</Label>
                      <select
                        value={localSettings.voiceSettings?.openaiVoice || "nova"}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            voiceSettings: { ...localSettings.voiceSettings, openaiVoice: e.target.value } as any,
                          })
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                      >
                        {OPENAI_TTS_VOICES.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} - {voice.description}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">{t.requiresOpenAI}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm">{t.browserVoiceLabel}</Label>
                      <select
                        value={localSettings.voiceSettings?.voice || ""}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            voiceSettings: { ...localSettings.voiceSettings, voice: e.target.value } as any,
                          })
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                      >
                        <option value="">{t.systemDefault}</option>
                        {voices.slice(0, 15).map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="space-y-4 mt-0">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t.apiKeysInfo}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openrouter-key" className="text-sm">{t.openRouterKey}</Label>
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
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t.getFrom} <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm">{t.openAIKeyOptional}</Label>
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
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">{t.forVoiceInput}</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex flex-col gap-2 pt-3 border-t flex-shrink-0 mt-2">
          {onOpenAchievements && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground hover:text-foreground"
              onClick={() => {
                onOpenChange(false)
                onOpenAchievements()
              }}
            >
              <Trophy className="h-4 w-4 mr-2 text-amber-500" />
              {t.achievements}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground hover:text-foreground"
            onClick={switchToAdvancedMode}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {t.switchToAdvanced}
          </Button>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              {t.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
