"use client"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Menu,
  Columns2,
  BookTemplate,
  FolderOpen,
  BarChart3,
  Sliders,
  Sparkles,
  Moon,
  Sun,
  Brain,
  User,
  Wand2,
  Search,
  PanelLeftClose,
  PanelLeft,
  Music,
  VolumeX,
  Swords,
  FileCode,
  Mic,
  Image,
  Lightbulb,
} from "lucide-react"
import { useEffect } from "react"
import { ModelSelector } from "@/components/model-selector"
import { SettingsDialog } from "@/components/settings-dialog"
// import { PromptLibraryDialog } from "@/components/prompt-library-dialog" // Hidden for now
import { DocumentCollectionsDialog } from "@/components/document-collections-dialog"
import { AdvancedSettingsDialog } from "@/components/advanced-settings-dialog"
import { MemoryManager } from "@/components/memory-manager"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { PersonasDialog } from "@/components/personas-dialog"
import { ChatSearch } from "@/components/chat-search"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChameleonLogoSimple } from "@/components/chameleon-logo"
import { cn } from "@/lib/utils"
import { ambientMusicService } from "@/lib/ambient-music"
import { AIDebateMode } from "@/components/ai-debate-mode"
import { QuickActionsMenu } from "@/components/quick-actions-menu"
import { PromptInspector } from "@/components/prompt-inspector"
import { usePromptInspectorStore } from "@/lib/prompt-inspector-store"
import { PromptHelperDialog } from "@/components/prompt-helper-dialog"

export function ChatHeader() {
  const { settings, updateSettings, chats, currentChatId } = useApp()
  const [mounted, setMounted] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false) // Hidden for now
  const [isDocCollectionsOpen, setIsDocCollectionsOpen] = useState(false)
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false)
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPersonasOpen, setIsPersonasOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [isDebateOpen, setIsDebateOpen] = useState(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [isPromptHelperOpen, setIsPromptHelperOpen] = useState(false)
  const { inspectorData } = usePromptInspectorStore()

  // Mobile toggle states
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isImageModeActive, setIsImageModeActive] = useState(false)
  const [isReasoningActive, setIsReasoningActive] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("chameleon-reasoning-enabled") === "true"
  })

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const [isTitleAnimated, setIsTitleAnimated] = useState(false)

  // Track AI-generated title animation for header
  useEffect(() => {
    if (currentChat?.titleGeneratedAt) {
      const now = Date.now()
      // Animate if title was generated in the last 3 seconds
      if (now - currentChat.titleGeneratedAt < 3000) {
        setIsTitleAnimated(true)
        const timer = setTimeout(() => setIsTitleAnimated(false), 1500)
        return () => clearTimeout(timer)
      }
    }
    setIsTitleAnimated(false)
  }, [currentChat?.title, currentChat?.titleGeneratedAt])

  useEffect(() => {
    setMounted(true)
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark")
    }

    // Load music state from localStorage (default: off)
    const savedMusicState = localStorage.getItem("chameleon-ambient-music")
    if (savedMusicState === "enabled") {
      const currentTheme = localStorage.getItem("chameleon-theme") || "light"
      console.log("[ChatHeader] Auto-starting music on mount, theme:", currentTheme)

      ambientMusicService.play(currentTheme).then(() => {
        if (ambientMusicService.getIsPlaying()) {
          setIsMusicPlaying(true)
          console.log("[ChatHeader] Music auto-started successfully")
        } else {
          console.warn("[ChatHeader] Music auto-start failed")
          setIsMusicPlaying(false)
          localStorage.setItem("chameleon-ambient-music", "disabled")
        }
      }).catch((error) => {
        console.error("[ChatHeader] Music auto-start error:", error)
        setIsMusicPlaying(false)
        localStorage.setItem("chameleon-ambient-music", "disabled")
      })
    }
  }, [settings.theme])

  // Update music theme when theme changes
  useEffect(() => {
    if (isMusicPlaying && mounted) {
      const currentTheme = localStorage.getItem("chameleon-theme") || "light"
      ambientMusicService.play(currentTheme)
    }
  }, [settings.theme, mounted, isMusicPlaying])

  // Add keyboard shortcuts (Ctrl+K for search, Ctrl+Shift+P for prompt helper)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && !e.shiftKey) {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      // Ctrl+Shift+P for prompt helper
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault()
        setIsPromptHelperOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Listen for mobile bottom nav events
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true)
    const handleOpenPersonas = () => setIsPersonasOpen(true)
    const handleOpenSettings = () => setIsSettingsOpen(true)
    const handleOpenDocCollections = () => setIsDocCollectionsOpen(true)
    const handleOpenPromptHelper = () => setIsPromptHelperOpen(true)
    const handleOpenProfile = () => setIsProfileOpen(true)
    const handleOpenMemory = () => setIsMemoryOpen(true)
    const handleOpenAdvancedSettings = () => setIsAdvancedSettingsOpen(true)
    const handleOpenDebate = () => setIsDebateOpen(true)
    const handleOpenInspector = () => setIsInspectorOpen(true)

    window.addEventListener("openSearch", handleOpenSearch)
    window.addEventListener("openPersonas", handleOpenPersonas)
    window.addEventListener("openSettings", handleOpenSettings)
    window.addEventListener("openDocCollections", handleOpenDocCollections)
    window.addEventListener("openPromptHelper", handleOpenPromptHelper)
    window.addEventListener("openProfile", handleOpenProfile)
    window.addEventListener("openMemory", handleOpenMemory)
    window.addEventListener("openAdvancedSettings", handleOpenAdvancedSettings)
    window.addEventListener("openDebate", handleOpenDebate)
    window.addEventListener("openInspector", handleOpenInspector)

    return () => {
      window.removeEventListener("openSearch", handleOpenSearch)
      window.removeEventListener("openPersonas", handleOpenPersonas)
      window.removeEventListener("openSettings", handleOpenSettings)
      window.removeEventListener("openDocCollections", handleOpenDocCollections)
      window.removeEventListener("openPromptHelper", handleOpenPromptHelper)
      window.removeEventListener("openProfile", handleOpenProfile)
      window.removeEventListener("openMemory", handleOpenMemory)
      window.removeEventListener("openAdvancedSettings", handleOpenAdvancedSettings)
      window.removeEventListener("openDebate", handleOpenDebate)
      window.removeEventListener("openInspector", handleOpenInspector)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = settings.theme === "dark" ? "light" : "dark"
    updateSettings({ theme: newTheme })
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const toggleComparisonMode = () => {
    window.dispatchEvent(new CustomEvent("toggleComparison"))
  }

  const toggleStatsPanel = () => {
    window.dispatchEvent(new CustomEvent("toggleStats"))
  }

  const toggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggleMobileSidebar"))
  }

  const toggleDesktopSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggleDesktopSidebar"))
  }

  const toggleMusic = async () => {
    const currentTheme = localStorage.getItem("chameleon-theme") || "light"
    console.log("[ChatHeader] Toggling music, current theme:", currentTheme)

    if (isMusicPlaying) {
      ambientMusicService.stop()
      setIsMusicPlaying(false)
      localStorage.setItem("chameleon-ambient-music", "disabled")
      console.log("[ChatHeader] Music stopped")
    } else {
      try {
        await ambientMusicService.play(currentTheme)
        setIsMusicPlaying(true)
        localStorage.setItem("chameleon-ambient-music", "enabled")
        console.log("[ChatHeader] Music enabled")

        // Check if actually playing after a short delay
        setTimeout(() => {
          if (!ambientMusicService.getIsPlaying()) {
            console.warn("[ChatHeader] Music failed to start - check browser console for details")
            setIsMusicPlaying(false)
            localStorage.setItem("chameleon-ambient-music", "disabled")
          }
        }, 1000)
      } catch (error) {
        console.error("[ChatHeader] Failed to start music:", error)
        setIsMusicPlaying(false)
        localStorage.setItem("chameleon-ambient-music", "disabled")
      }
    }
  }

  if (!mounted) return null

  return (
    <>
      <header className="flex h-14 md:h-16 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-3 sm:px-4 md:px-5 shadow-sm mobile-header-glass">
        {/* Mobile: Modern compact header */}
        <div className="flex md:hidden items-center gap-3 min-w-0 flex-1">
          {/* Logo and title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 shadow-sm border border-primary/10 flex-shrink-0 transition-transform active:scale-95">
              <ChameleonLogoSimple className="text-primary" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={cn(
                "text-sm font-bold text-foreground truncate leading-tight",
                isTitleAnimated && "animate-title-appear"
              )}>
                {currentChat?.title || "Chameleon"}
              </h1>
              <p className="text-[10px] text-muted-foreground/70 truncate">
                AI Chat Assistant
              </p>
            </div>
          </div>
          {/* Mobile toggles - modern pill style */}
          <div className="flex items-center gap-1 flex-shrink-0 p-1 rounded-2xl bg-muted/50">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8 rounded-xl transition-all duration-200",
                isVoiceActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={() => {
                setIsVoiceActive(!isVoiceActive)
                window.dispatchEvent(new CustomEvent("toggleVoice"))
              }}
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8 rounded-xl transition-all duration-200",
                isImageModeActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={() => {
                setIsImageModeActive(!isImageModeActive)
                window.dispatchEvent(new CustomEvent("toggleImageMode"))
              }}
              title="Image mode"
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8 rounded-xl transition-all duration-200",
                isReasoningActive
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={() => {
                setIsReasoningActive(!isReasoningActive)
                window.dispatchEvent(new CustomEvent("toggleReasoning"))
              }}
              title="Reasoning"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop: Full header with all controls */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-10 w-10 hover:bg-primary/10 hover:scale-105 transition-all rounded-xl"
            onClick={toggleDesktopSidebar}
            title="Toggle Sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 shadow-lg border border-primary/10 flex-shrink-0">
              <ChameleonLogoSimple className="text-green-600" size={20} />
            </div>
            <h1 className={cn(
              "text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent truncate",
              isTitleAnimated && "animate-title-appear"
            )}>
              {currentChat?.title || "Chameleon AI"}
            </h1>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-0.5 sm:gap-1 md:gap-1.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={settings.theme === "dark" ? "Hell-Modus" : "Dunkel-Modus"}
            className="hidden sm:flex hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            {settings.theme === "dark" ? (
              <Sun className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
            ) : (
              <Moon className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsProfileOpen(true)}
            title="Profil"
            className="hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <User className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMemoryOpen(true)}
            title="Memory System"
            className={cn(
              "hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg relative",
              settings.memorySettings?.enabled && "text-purple-500"
            )}
          >
            <Brain className="h-4 w-4 md:h-4.5 md:w-4.5" />
            {settings.memorySettings?.enabled && (
              <span className={cn(
                "absolute top-1.5 right-1.5 h-2 w-2 bg-purple-500 rounded-full shadow-sm shadow-purple-500/50",
                !settings.experimental?.performanceMode && "animate-pulse"
              )} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleComparisonMode}
            title="Modellvergleich"
            className="hidden md:flex hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Columns2 className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          {/* Prompt Library - Hidden for now */}
          {/*
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPromptLibraryOpen(true)}
            title="Prompt-Bibliothek"
            className="hover:bg-primary/10 h-8 w-8 sm:h-9 sm:w-9"
          >
            <BookTemplate className="h-4 w-4" />
          </Button>
          */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPersonasOpen(true)}
            title="Personas Manager"
            className="hidden md:flex hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Wand2 className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          {/* Search button removed - use sidebar search instead (Ctrl+K still works) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDocCollectionsOpen(true)}
            title="Document Collections"
            className="hidden md:flex hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <FolderOpen className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPromptHelperOpen(true)}
            title="Prompt Helper (Strg+Shift+P)"
            className="hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Sparkles className="h-4 w-4 md:h-4.5 md:w-4.5 text-yellow-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAdvancedSettingsOpen(true)}
            title="Erweiterte Parameter"
            className="hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Sliders className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          {/* AI Debate Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDebateOpen(true)}
            title="AI Debate Mode"
            className="hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Swords className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          {/* Prompt Inspector */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsInspectorOpen(true)}
            title="Prompt Inspector"
            className={cn(
              "hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg relative",
              inspectorData && "text-blue-500"
            )}
          >
            <FileCode className="h-4 w-4 md:h-4.5 md:w-4.5" />
            {inspectorData && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500/50" />
            )}
          </Button>
          {/* Quick Actions Menu */}
          <QuickActionsMenu
            onDocCollectionsClick={() => setIsDocCollectionsOpen(true)}
          />
          {/* Model Selector - Desktop only */}
          <div className="hidden md:block">
            <ModelSelector />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Einstellungen"
            className="hover:bg-primary/10 h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Settings className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
        </div>
      </header>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      {/* Prompt Library Dialog - Hidden for now */}
      {/*
      <PromptLibraryDialog
        open={isPromptLibraryOpen}
        onOpenChange={setIsPromptLibraryOpen}
        onSelectTemplate={(content) => {
          const event = new CustomEvent("insertPrompt", { detail: content })
          window.dispatchEvent(event)
        }}
      />
      */}
      <DocumentCollectionsDialog
        open={isDocCollectionsOpen}
        onOpenChange={setIsDocCollectionsOpen}
        onSelectCollection={(collectionId) => {
          const event = new CustomEvent("attachCollection", { detail: collectionId })
          window.dispatchEvent(event)
        }}
      />
      <AdvancedSettingsDialog open={isAdvancedSettingsOpen} onOpenChange={setIsAdvancedSettingsOpen} />
      <Dialog open={isMemoryOpen} onOpenChange={setIsMemoryOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <MemoryManager />
        </DialogContent>
      </Dialog>
      <UserProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <PersonasDialog open={isPersonasOpen} onOpenChange={setIsPersonasOpen} />
      <ChatSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <Dialog open={isDebateOpen} onOpenChange={setIsDebateOpen}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              AI Debate Mode
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <AIDebateMode />
          </div>
        </DialogContent>
      </Dialog>
      <PromptHelperDialog
        open={isPromptHelperOpen}
        onOpenChange={setIsPromptHelperOpen}
        onUsePrompt={(prompt) => {
          // Dispatch event to insert prompt into chat input
          const event = new CustomEvent("insertPrompt", { detail: prompt })
          window.dispatchEvent(event)
        }}
      />
      <PromptInspector
        open={isInspectorOpen}
        onOpenChange={setIsInspectorOpen}
        data={inspectorData}
      />
    </>
  )
}
