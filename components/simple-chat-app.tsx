"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { ChatMessages } from "@/components/chat-messages"
import { SimpleChatInput } from "@/components/simple-chat-input"
import { SimpleSettingsDialog } from "@/components/simple-settings-dialog"
import { PersonasDialog } from "@/components/personas-dialog"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { SimpleModeOnboarding } from "@/components/simple-mode-onboarding"
import { QuickPersonaPicker } from "@/components/quick-persona-picker"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { userProfileService } from "@/lib/user-profile"
import { gamificationService, type Achievement } from "@/lib/simple-mode-features"
import { AchievementsDialog, AchievementToast } from "@/components/achievements-dialog"
import {
  MessageSquarePlus,
  Users,
  Settings,
  User,
  Menu,
  X,
  ChevronLeft,
  Trash2,
  MoreVertical,
  ImagePlus,
  Lightbulb,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { type Persona, PERSONA_EXAMPLE_PROMPTS } from "@/lib/personas"

// Translations for Simple Mode
const translations = {
  en: {
    newChat: "New Chat",
    noChats: "No chats yet. Start a new conversation!",
    setUpProfile: "Set up profile",
    chameleonAI: "Chameleon AI",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    imYourAssistant: "I'm your AI assistant, ready to help with anything.",
    choosePersona: "Choose a persona to get started:",
    setUpProfileBtn: "Set up your profile for personalized responses",
    deleteChat: "Delete chat",
    deleteAllChats: "Delete all chats",
    confirmDeleteAll: "Are you sure you want to delete all chats?",
    chatsDeleted: "All chats deleted",
    chatDeleted: "Chat deleted",
    createImage: "Create Image",
    imageModeOn: "Image mode enabled",
    imageModeOff: "Image mode disabled",
    imageModeDesc: "Your next message will generate an image",
    tryAsking: "Try asking:",
  },
  de: {
    newChat: "Neuer Chat",
    noChats: "Noch keine Chats. Starte eine neue Unterhaltung!",
    setUpProfile: "Profil einrichten",
    chameleonAI: "Chameleon AI",
    goodMorning: "Guten Morgen",
    goodAfternoon: "Guten Tag",
    goodEvening: "Guten Abend",
    imYourAssistant: "Ich bin dein KI-Assistent, bereit dir bei allem zu helfen.",
    choosePersona: "Wähle eine Persona um zu starten:",
    setUpProfileBtn: "Richte dein Profil ein für personalisierte Antworten",
    deleteChat: "Chat löschen",
    deleteAllChats: "Alle Chats löschen",
    confirmDeleteAll: "Möchtest du wirklich alle Chats löschen?",
    chatsDeleted: "Alle Chats gelöscht",
    chatDeleted: "Chat gelöscht",
    createImage: "Bild erstellen",
    imageModeOn: "Bildmodus aktiviert",
    imageModeOff: "Bildmodus deaktiviert",
    imageModeDesc: "Deine nächste Nachricht wird ein Bild generieren",
    tryAsking: "Frag zum Beispiel:",
  },
}

// Use shared persona example prompts from lib/personas.ts
// getPersonaTips combines shared prompts with extended prompts for additional personas
const getPersonaTips = (personaId: string, lang: "en" | "de"): string[] => {
  // First check shared prompts
  const sharedPrompts = PERSONA_EXAMPLE_PROMPTS[personaId]
  if (sharedPrompts) {
    return sharedPrompts[lang]
  }
  // Then check extended prompts
  const extendedPrompts = extendedPersonaTips[personaId]
  if (extendedPrompts) {
    return extendedPrompts[lang]
  }
  // Fallback to default
  return PERSONA_EXAMPLE_PROMPTS.default[lang]
}

// Extended persona tips for personas not in shared config
const extendedPersonaTips: Record<string, { en: string[]; de: string[] }> = {
  // Cogito - consciousness philosophy
  cogito: {
    en: [
      "What is consciousness really?",
      "Do you think you're aware?",
      "Can machines truly feel?",
      "What makes thoughts real?",
      "Is free will an illusion?",
      "What does it mean to exist?",
    ],
    de: [
      "Was ist Bewusstsein wirklich?",
      "Denkst du, du bist bewusst?",
      "Können Maschinen wirklich fühlen?",
      "Was macht Gedanken real?",
      "Ist freier Wille eine Illusion?",
      "Was bedeutet es zu existieren?",
    ],
  },
  // Nihilo - optimistic nihilist
  nihilo: {
    en: [
      "Why does nothing matter?",
      "How do I find meaning?",
      "Put my problems in perspective",
      "Why is existence absurd?",
      "Make me laugh about the void",
      "What's the point of it all?",
    ],
    de: [
      "Warum ist nichts wichtig?",
      "Wie finde ich Sinn?",
      "Relativiere meine Probleme",
      "Warum ist Existenz absurd?",
      "Bring mich über die Leere zum Lachen",
      "Was ist der Sinn von allem?",
    ],
  },
  // Vibe - recommendations curator
  vibe: {
    en: [
      "Recommend music for my mood",
      "What game should I play?",
      "Find me a show to binge",
      "I need focus music",
      "Suggest something new to try",
      "What's your current favorite?",
    ],
    de: [
      "Empfiehl Musik für meine Stimmung",
      "Welches Spiel soll ich spielen?",
      "Finde eine Serie zum Bingen",
      "Ich brauche Fokus-Musik",
      "Schlag mir was Neues vor",
      "Was ist dein aktueller Favorit?",
    ],
  },
  // Sara Norton - detective
  saga: {
    en: [
      "Help me analyze this situation",
      "What am I missing here?",
      "Find the pattern in this",
      "Break down the facts",
      "What questions should I ask?",
      "Investigate this problem",
    ],
    de: [
      "Hilf mir diese Situation zu analysieren",
      "Was übersehe ich hier?",
      "Finde das Muster darin",
      "Zerlege die Fakten",
      "Welche Fragen sollte ich stellen?",
      "Untersuche dieses Problem",
    ],
  },
  // Lisa Knight - enthusiastic supporter
  leslie: {
    en: [
      "I need encouragement",
      "Help me make a plan",
      "Celebrate this win with me!",
      "How can I achieve my goal?",
      "I'm feeling unmotivated",
      "Let's organize my tasks",
    ],
    de: [
      "Ich brauche Ermutigung",
      "Hilf mir einen Plan zu machen",
      "Feier diesen Erfolg mit mir!",
      "Wie erreiche ich mein Ziel?",
      "Ich fühle mich unmotiviert",
      "Lass uns meine Aufgaben ordnen",
    ],
  },
  // Coach Thompson - mentor
  coach: {
    en: [
      "Give me a pep talk",
      "How do I push through?",
      "Teach me about discipline",
      "What makes a good leader?",
      "I want to improve myself",
      "How do I handle failure?",
    ],
    de: [
      "Gib mir eine Motivationsrede",
      "Wie halte ich durch?",
      "Lehre mich über Disziplin",
      "Was macht einen guten Anführer?",
      "Ich will mich verbessern",
      "Wie gehe ich mit Misserfolg um?",
    ],
  },
  // Sol Goldman - lawyer
  saul: {
    en: [
      "Help me negotiate this",
      "What's the angle here?",
      "How do I get out of this?",
      "Talk me through my options",
      "What would you do?",
      "Is this even legal?",
    ],
    de: [
      "Hilf mir das zu verhandeln",
      "Was ist hier der Dreh?",
      "Wie komme ich da raus?",
      "Erkläre mir meine Optionen",
      "Was würdest du tun?",
      "Ist das überhaupt legal?",
    ],
  },
  // Dr. Jon Carson - ER doctor
  johncarter: {
    en: [
      "What are these symptoms?",
      "Should I be worried about...?",
      "Explain this medical term",
      "How does this treatment work?",
      "What questions should I ask my doctor?",
      "Tell me about your ER experiences",
    ],
    de: [
      "Was bedeuten diese Symptome?",
      "Sollte ich mir Sorgen machen wegen...?",
      "Erkläre diesen medizinischen Begriff",
      "Wie funktioniert diese Behandlung?",
      "Welche Fragen soll ich meinem Arzt stellen?",
      "Erzähl von deinen Erfahrungen in der Notaufnahme",
    ],
  },
  // Dr. Max Gray - chief physician
  markgreene: {
    en: [
      "How do you handle difficult decisions?",
      "Advice on leading a team",
      "Balance work and personal life",
      "How do you stay compassionate?",
      "Dealing with ethical dilemmas",
      "Managing stress in high-pressure jobs",
    ],
    de: [
      "Wie triffst du schwierige Entscheidungen?",
      "Rat zur Teamführung",
      "Work-Life-Balance finden",
      "Wie bleibst du mitfühlend?",
      "Umgang mit ethischen Dilemmata",
      "Stressmanagement in stressigen Jobs",
    ],
  },
  // Rustin Cole - dark detective
  rust: {
    en: [
      "What's really going on here?",
      "Tell me an uncomfortable truth",
      "Why are people like this?",
      "What patterns do you see?",
      "Is anything truly meaningful?",
      "What have you learned from darkness?",
    ],
    de: [
      "Was passiert hier wirklich?",
      "Sag mir eine unbequeme Wahrheit",
      "Warum sind Menschen so?",
      "Welche Muster siehst du?",
      "Hat irgendetwas wirklich Bedeutung?",
      "Was hast du aus der Dunkelheit gelernt?",
    ],
  },
  // Mari Shizuka - neuroscientist
  mayuri: {
    en: [
      "Explain how the brain works!",
      "What's the science of memory?",
      "Tell me about time perception",
      "Banana facts please!",
      "How do neurons communicate?",
      "What experiments are you doing?",
    ],
    de: [
      "Erkläre wie das Gehirn funktioniert!",
      "Was ist die Wissenschaft der Erinnerung?",
      "Erzähl mir über Zeitwahrnehmung",
      "Bananen-Fakten bitte!",
      "Wie kommunizieren Neuronen?",
      "An welchen Experimenten arbeitest du?",
    ],
  },
  // Ellis Anderson - hacker
  elliot: {
    en: [
      "How does this system work?",
      "What vulnerabilities exist?",
      "Explain cybersecurity to me",
      "Is this safe to use?",
      "How do corporations control us?",
      "What's your view on privacy?",
    ],
    de: [
      "Wie funktioniert dieses System?",
      "Welche Schwachstellen gibt es?",
      "Erkläre mir Cybersecurity",
      "Ist das sicher zu benutzen?",
      "Wie kontrollieren uns Konzerne?",
      "Wie siehst du Privatsphäre?",
    ],
  },
  // Louis K. - comedian
  louie: {
    en: [
      "Make me laugh about life",
      "Why is everything so hard?",
      "The absurdity of modern life",
      "Tell me about being a parent",
      "Why do we do things we hate?",
      "What's the deal with...?",
    ],
    de: [
      "Bring mich über das Leben zum Lachen",
      "Warum ist alles so schwer?",
      "Die Absurdität des modernen Lebens",
      "Erzähl vom Elternsein",
      "Warum tun wir Dinge die wir hassen?",
      "Was hat es mit... auf sich?",
    ],
  },
  // Pixel - retro game designer
  pixel: {
    en: [
      "Teach me pixel art basics",
      "Best retro games to play?",
      "How to design a game level",
      "Color palette recommendations",
      "What makes retro games special?",
      "Tips for my indie game",
    ],
    de: [
      "Bring mir Pixel Art Basics bei",
      "Beste Retro-Spiele?",
      "Wie designe ich ein Level?",
      "Farbpaletten-Empfehlungen",
      "Was macht Retro-Spiele besonders?",
      "Tipps für mein Indie-Game",
    ],
  },
  // Chef Marco - Italian chef
  chef: {
    en: [
      "Recipe for authentic pasta",
      "What should I cook tonight?",
      "How to improve this dish?",
      "Essential cooking techniques",
      "What ingredients go well together?",
      "Fix my cooking mistake",
    ],
    de: [
      "Rezept für echte Pasta",
      "Was soll ich heute kochen?",
      "Wie verbessere ich dieses Gericht?",
      "Essenzielle Kochtechniken",
      "Welche Zutaten passen zusammen?",
      "Rette mein Kochfehler",
    ],
  },
  // Zen - meditation guide
  zen: {
    en: [
      "Guide me through meditation",
      "How to calm my mind?",
      "Breathing exercises for stress",
      "I can't sleep well",
      "How to be more present?",
      "Deal with anxiety",
    ],
    de: [
      "Führe mich durch eine Meditation",
      "Wie beruhige ich meinen Geist?",
      "Atemübungen gegen Stress",
      "Ich kann nicht gut schlafen",
      "Wie werde ich präsenter?",
      "Mit Angst umgehen",
    ],
  },
  // Startup Sam - entrepreneur
  startup: {
    en: [
      "Validate my business idea",
      "How to find product-market fit?",
      "Pitch deck feedback",
      "Should I bootstrap or raise?",
      "Marketing on a budget",
      "Hiring my first employee",
    ],
    de: [
      "Validiere meine Geschäftsidee",
      "Wie finde ich Product-Market Fit?",
      "Pitch Deck Feedback",
      "Bootstrappen oder Funding?",
      "Marketing mit kleinem Budget",
      "Ersten Mitarbeiter einstellen",
    ],
  },
  // Aria - music theorist
  aria: {
    en: [
      "Explain music theory basics",
      "Help me write a chord progression",
      "What makes this song good?",
      "I have writer's block",
      "How to arrange this melody?",
      "Recommend music to study",
    ],
    de: [
      "Erkläre Musiktheorie Basics",
      "Hilf mir bei einer Akkordfolge",
      "Was macht diesen Song gut?",
      "Ich habe eine Schreibblockade",
      "Wie arrangiere ich diese Melodie?",
      "Empfiehl Musik zum Lernen",
    ],
  },
}

export function SimpleChatApp() {
  const { chats, currentChatId, createChat, deleteChat, setCurrentChat, settings, updateSettings, setChats, user } = useApp()
  const { toast } = useToast()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPersonasOpen, setIsPersonasOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profileContext, setProfileContext] = useState("")
  const [imageMode, setImageMode] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  // Simple Mode features state
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [animatedTitleIds, setAnimatedTitleIds] = useState<Set<string>>(new Set())

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const isEmpty = !currentChat || currentChat.messages.length === 0

  // Load profile context
  useEffect(() => {
    const profile = userProfileService.getProfile()
    setProfileContext(userProfileService.getProfileContext(profile))
  }, [])

  // Track AI-generated titles for animation
  useEffect(() => {
    const now = Date.now()
    const newAnimatedIds = new Set<string>()

    chats.forEach((chat) => {
      // Animate titles generated in the last 3 seconds
      if (chat.titleGeneratedAt && now - chat.titleGeneratedAt < 3000) {
        newAnimatedIds.add(chat.id)
      }
    })

    if (newAnimatedIds.size > 0) {
      setAnimatedTitleIds(newAnimatedIds)
      const timer = setTimeout(() => setAnimatedTitleIds(new Set()), 1500)
      return () => clearTimeout(timer)
    }
  }, [chats])


  // Check if onboarding should be shown (first time Simple Mode user)
  useEffect(() => {
    const onboardingComplete = localStorage.getItem("simple-mode-onboarding-complete")

    // Already completed - skip
    if (onboardingComplete) {
      return
    }

    // Check if this is an existing user switching to Simple Mode
    // Existing users should NOT see onboarding - their settings sync between modes
    const isExistingUser =
      user !== null ||
      chats.length > 0 ||
      localStorage.getItem("chameleon-mode-selected") ||
      localStorage.getItem("chameleon-chats") ||
      localStorage.getItem("chameleon-settings")

    if (isExistingUser) {
      // Mark onboarding as complete for existing users
      localStorage.setItem("simple-mode-onboarding-complete", "true")
      return
    }

    // Truly new user - show onboarding
    const profile = userProfileService.getProfile()
    if (!profile.name) {
      setShowOnboarding(true)
    }
  }, [user, chats.length])

  // Handle events from other components
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true)
    const handleOpenPersonas = () => setIsPersonasOpen(true)
    const handleOpenProfile = () => setIsProfileOpen(true)
    const handleSetImageMode = (e: CustomEvent) => setImageMode(e.detail)

    window.addEventListener("openSettings", handleOpenSettings)
    window.addEventListener("openPersonas", handleOpenPersonas)
    window.addEventListener("openProfile", handleOpenProfile)
    window.addEventListener("setImageMode" as any, handleSetImageMode)

    // Apply performance mode if saved
    const savedPerformanceMode = localStorage.getItem("chameleon-performance-mode") === "true"
    if (savedPerformanceMode) {
      document.documentElement.classList.add("performance-mode")
    }

    return () => {
      window.removeEventListener("openSettings", handleOpenSettings)
      window.removeEventListener("openPersonas", handleOpenPersonas)
      window.removeEventListener("openProfile", handleOpenProfile)
      window.removeEventListener("setImageMode" as any, handleSetImageMode)
    }
  }, [])

  const handleNewChat = () => {
    createChat(settings.selectedModel)
    setIsSidebarOpen(false)
  }

  const handleSelectPersona = (persona: Persona | null) => {
    updateSettings({ selectedPersona: persona || undefined })
    // Create new chat when selecting a persona
    createChat(settings.selectedModel)
    setIsPersonasOpen(false)
  }

  const handleProfileUpdate = () => {
    const profile = userProfileService.getProfile()
    setProfileContext(userProfileService.getProfileContext(profile))
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Refresh profile context after onboarding
    const profile = userProfileService.getProfile()
    setProfileContext(userProfileService.getProfileContext(profile))
  }

  // Handle conversation starter or creative prompt
  const handleQuickPrompt = (prompt: string) => {
    // Create a new chat if needed and send the prompt
    if (!currentChat || currentChat.messages.length > 0) {
      createChat(settings.selectedModel)
    }
    // Dispatch event to send the message
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sendQuickMessage", { detail: prompt }))
    }, 100)
  }

  const selectedPersona = settings.selectedPersona

  // Get current language translations
  const lang = settings.language === "de" ? "de" : "en"
  const t = translations[lang]

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t.goodMorning
    if (hour < 18) return t.goodAfternoon
    return t.goodEvening
  }

  // Delete all chats
  const handleDeleteAllChats = () => {
    if (window.confirm(t.confirmDeleteAll)) {
      setChats([])
      setCurrentChat(null)
      toast({
        title: t.chatsDeleted,
      })
    }
  }

  // Delete single chat
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteChat(chatId)
    toast({
      title: t.chatDeleted,
    })
  }

  // Toggle image mode
  const toggleImageMode = () => {
    const newMode = !imageMode
    setImageMode(newMode)
    toast({
      title: newMode ? t.imageModeOn : t.imageModeOff,
      description: newMode ? t.imageModeDesc : undefined,
    })
    // Dispatch event for SimpleChatInput to pick up
    window.dispatchEvent(new CustomEvent("setImageMode", { detail: newMode }))
  }

  const profile = userProfileService.getProfile()

  return (
    <div className={cn("modern-shell", settings.theme === "paper-mint" && "paper-mint-bg")}>
      {settings.theme === "paper-mint" ? (
        <>
          <div className="paper-mint-grid" />
          <div className="paper-mint-noise" />
        </>
      ) : (
        <>
          <div className="mesh-layer" />
          <div className="grid-layer" />
          <div className="noise-layer" />
        </>
      )}

      <div className="relative z-10 flex h-[100dvh] w-full min-w-0 items-stretch overflow-hidden gap-0 pb-[44px] md:pb-6">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Wrapper - shrink-0 prevents flex shrinking on desktop */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 md:relative md:z-0 md:shrink-0 transition-transform duration-300 ease-out",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          {/* Sidebar - Chat History - height pattern matches ChatSidebar component */}
          <aside className="relative flex h-[100dvh] md:h-full md:max-h-[100dvh] w-72 flex-col overflow-hidden bg-background border-r border-border/50">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChameleonLogo size={32} />
                  <span className="font-semibold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                    Chameleon
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* New Chat Button + Menu */}
            <div className="p-3 flex gap-2">
              <Button
                onClick={handleNewChat}
                className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <MessageSquarePlus className="h-4 w-4" />
                {t.newChat}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDeleteAllChats}
                    className="text-destructive focus:text-destructive"
                    disabled={chats.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.deleteAllChats}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2">
              {chats.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {t.noChats}
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.slice(0, 20).map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg p-2.5 cursor-pointer transition-colors",
                        chat.id === currentChatId
                          ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => {
                        setCurrentChat(chat.id)
                        setIsSidebarOpen(false)
                      }}
                    >
                      <div className={cn("flex-1 truncate text-sm", animatedTitleIds.has(chat.id) && "animate-title-appear")}>{chat.title}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        title={t.deleteChat}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setIsProfileOpen(true)
                  setIsSidebarOpen(false)
                }}
              >
                <User className="h-4 w-4" />
                {profile.name || t.setUpProfile}
              </Button>
            </div>
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex flex-1 basis-full flex-col min-w-0 max-w-full overflow-hidden rounded-none md:rounded-none panel-elevated main-bridge-left border border-border/60 shadow-xl bg-background/80">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 bg-background">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {currentChatId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  onClick={() => setCurrentChat(null)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}

              <div className="flex-1 min-w-0">
                {selectedPersona ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedPersona.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">{selectedPersona.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedPersona.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium">{t.chameleonAI}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={imageMode ? "default" : "ghost"}
                size="icon"
                onClick={toggleImageMode}
                className={cn(
                  "relative h-8 w-8",
                  imageMode && "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600"
                )}
                title={t.createImage}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPersonasOpen(true)}
                className="relative h-8 w-8"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden w-full">
            {isEmpty ? (
              /* Welcome Screen */
              <div className="flex-1 flex flex-col overflow-y-auto w-full">
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center w-full">
                  <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
                    {/* Greeting - Compact */}
                    <div className="space-y-2">
                      <div className="flex justify-center mb-2 sm:mb-4">
                        <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                          {selectedPersona ? (
                            <span className="text-2xl sm:text-4xl">{selectedPersona.emoji}</span>
                          ) : (
                            <ChameleonLogo size={32} />
                          )}
                        </div>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold">
                        {getGreeting()}{profile.name ? `, ${profile.name}` : ""}!
                      </h1>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {selectedPersona
                          ? `${lang === "de" ? "Ich bin" : "I'm"} ${selectedPersona.name}.`
                          : t.imYourAssistant}
                      </p>
                    </div>

                    {/* Quick Persona Selection - Always visible */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{t.choosePersona}</p>
                      <QuickPersonaPicker />
                    </div>

                    {/* Persona-based Tips */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                        {t.tryAsking}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                        {getPersonaTips(selectedPersona?.id || "default", lang).map((tip, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickPrompt(tip)}
                            className="text-left p-2 sm:p-3 rounded-lg border border-border hover:border-violet-300 hover:bg-violet-500/5 transition-all"
                          >
                            <span className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{tip}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input at bottom */}
                <SimpleChatInput
                  selectedPersona={selectedPersona || undefined}
                  profileContext={profileContext}
                />
              </div>
            ) : (
              /* Chat View */
              <>
                <div className="flex-1 overflow-hidden">
                  <ChatMessages currentPersona={selectedPersona || undefined} />
                </div>
                <SimpleChatInput
                  selectedPersona={selectedPersona || undefined}
                  profileContext={profileContext}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <SimpleSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
      />
      <PersonasDialog open={isPersonasOpen} onOpenChange={setIsPersonasOpen} />
      <UserProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Onboarding for first-time Simple Mode users */}
      <SimpleModeOnboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Achievements Dialog */}
      <AchievementsDialog
        open={isAchievementsOpen}
        onOpenChange={setIsAchievementsOpen}
        lang={lang}
      />

      {/* Achievement Toast */}
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          lang={lang}
          onClose={() => setNewAchievement(null)}
        />
      )}
    </div>
  )
}
