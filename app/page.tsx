"use client"

import { useState, useEffect } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessages } from "@/components/chat-messages"
import { ChatInput } from "@/components/chat-input"
import { BranchNavigator } from "@/components/branch-navigator"
import { AppProvider, useApp } from "@/contexts/app-context"
import { ModelComparison } from "@/components/model-comparison"
import { StatsDashboard } from "@/components/stats-dashboard"
import { ModeWrapper } from "@/components/mode-wrapper"
import { keyboardShortcutService } from "@/lib/keyboard-shortcuts"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { PersonaLevelUpNotifier } from "@/components/persona-level-up-notifier"
import { FontApplier } from "@/components/font-applier"
import { cn } from "@/lib/utils"

function ChatApp() {
  const { chats, currentChatId, createChat, settings } = useApp()
  const [isComparisonMode, setIsComparisonMode] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const isEmpty = !currentChat || currentChat.messages.length === 0

  // Mobile bottom nav handlers
  const handleMobileNewChat = () => {
    createChat(settings.selectedModel)
  }

  const handleMobilePersonas = () => {
    window.dispatchEvent(new Event("openPersonas"))
  }

  const handleMobilePromptHelper = () => {
    window.dispatchEvent(new Event("openPromptHelper"))
  }

  const handleMobileSettings = () => {
    window.dispatchEvent(new Event("openSettings"))
  }

  const handleMobileProfile = () => {
    window.dispatchEvent(new Event("openProfile"))
  }

  const handleMobileMemory = () => {
    window.dispatchEvent(new Event("openMemory"))
  }

  const handleMobileComparison = () => {
    setIsComparisonMode((prev) => !prev)
  }

  const handleMobileSearch = () => {
    window.dispatchEvent(new Event("openSearch"))
  }

  const handleMobileCollections = () => {
    window.dispatchEvent(new Event("openDocCollections"))
  }

  const handleMobileAdvancedSettings = () => {
    window.dispatchEvent(new Event("openAdvancedSettings"))
  }

  const handleMobileDebate = () => {
    window.dispatchEvent(new Event("openDebate"))
  }

  const handleMobileInspector = () => {
    window.dispatchEvent(new Event("openInspector"))
  }

  const handleMobileStats = () => {
    setShowStatsPanel((prev) => !prev)
  }

  // Apply saved theme and performance mode on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("chameleon-theme") || "light"
    const html = document.documentElement
    html.classList.remove("dark", "cyberpunk", "girly-violet", "ocean-breeze", "retro-wave", "chameleon", "paper-mint")
    if (savedTheme !== "light") {
      html.classList.add(savedTheme)
    }
    // Apply performance mode if saved
    const savedPerformanceMode = localStorage.getItem("chameleon-performance-mode") === "true"
    if (savedPerformanceMode) {
      html.classList.add("performance-mode")
    }
  }, [])

  // Apply font family from settings
  useEffect(() => {
    const fontFamily = settings.fontFamily || "inter"
    document.documentElement.setAttribute("data-font", fontFamily)
  }, [settings.fontFamily])

  useEffect(() => {
    keyboardShortcutService.register("new-chat", () => {
      const event = new CustomEvent("newChat")
      window.dispatchEvent(event)
    })

    keyboardShortcutService.register("toggle-sidebar", () => {
      setShowSidebar((prev) => !prev)
    })

    keyboardShortcutService.register("toggle-theme", () => {
      const event = new CustomEvent("toggleTheme")
      window.dispatchEvent(event)
    })

    keyboardShortcutService.register("settings", () => {
      const event = new CustomEvent("openSettings")
      window.dispatchEvent(event)
    })

    keyboardShortcutService.register("prompt-library", () => {
      const event = new CustomEvent("openPromptLibrary")
      window.dispatchEvent(event)
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardShortcutService.handleKeyDown(e)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsMobileSidebarOpen((prev) => !prev)
    }
    const handleToggleDesktopSidebar = () => {
      setShowSidebar((prev) => !prev)
    }
    const handleToggleComparison = () => setIsComparisonMode((prev) => !prev)
    const handleToggleStats = () => setShowStatsPanel((prev) => !prev)
    window.addEventListener("toggleMobileSidebar" as any, handleToggleSidebar)
    window.addEventListener("toggleDesktopSidebar" as any, handleToggleDesktopSidebar)
    window.addEventListener("toggleComparison" as any, handleToggleComparison)
    window.addEventListener("toggleStats" as any, handleToggleStats)
    return () => {
      window.removeEventListener("toggleMobileSidebar" as any, handleToggleSidebar)
      window.removeEventListener("toggleDesktopSidebar" as any, handleToggleDesktopSidebar)
      window.removeEventListener("toggleComparison" as any, handleToggleComparison)
      window.removeEventListener("toggleStats" as any, handleToggleStats)
    }
  }, [])

  return (
    <div className={cn(
      "modern-shell",
      settings.theme === "paper-mint" && "paper-mint-bg",
      settings.experimental?.performanceMode && "ultra-performance-mode"
    )}>
      <FontApplier />
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

      <div className="relative z-10 flex h-[100dvh] overflow-hidden px-0 md:px-0 pb-[44px] md:pb-6 gap-0">
        <PersonaLevelUpNotifier />
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden smooth-transition animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 md:relative md:z-0 transition-transform duration-300 ease-in-out",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            !showSidebar && "md:hidden",
          )}
        >
          <ChatSidebar onClose={() => setIsMobileSidebarOpen(false)} />
        </div>

        <div className={cn("flex flex-1 flex-col min-w-0 overflow-hidden rounded-none md:rounded-none panel-elevated main-bridge-left border border-border/60 shadow-xl", settings.theme === "blueprint" && "animate-[rise_0.6s_ease-out]")}>
          <ChatHeader />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-2 md:px-4 pb-2 md:pb-4">
            {showStatsPanel ? (
              <StatsDashboard />
            ) : isComparisonMode ? (
              <ModelComparison />
            ) : isEmpty ? (
              /* Centered layout for empty state */
              <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
                <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
                  <ChatMessages currentPersona={settings.selectedPersona} />
                  <div className="w-full">
                    <ChatInput />
                  </div>
                </div>
              </div>
            ) : (
              /* Normal layout with messages */
              <>
                <div className="flex-1 overflow-hidden">
                  <ChatMessages currentPersona={settings.selectedPersona} />
                </div>
                <div className="flex-shrink-0 pb-4 md:pb-0">
                  <BranchNavigator />
                  <ChatInput />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          onMenuClick={() => setIsMobileSidebarOpen(prev => !prev)}
          onNewChatClick={handleMobileNewChat}
          onPersonasClick={handleMobilePersonas}
          onPromptHelperClick={handleMobilePromptHelper}
          onSettingsClick={handleMobileSettings}
          onProfileClick={handleMobileProfile}
          onMemoryClick={handleMobileMemory}
          onComparisonClick={handleMobileComparison}
          onSearchClick={handleMobileSearch}
          onDocCollectionsClick={handleMobileCollections}
          onAdvancedSettingsClick={handleMobileAdvancedSettings}
          onDebateClick={handleMobileDebate}
          onInspectorClick={handleMobileInspector}
          onStatsClick={handleMobileStats}
        />
      </div>
    </div>
  )
}

function LoadingWrapper() {
  const { isLoading, user } = useApp()

  if (isLoading) {
    return (
      <div className="modern-shell">
        <div className="mesh-layer" />
        <div className="grid-layer" />
        <div className="noise-layer" />
        <div className="relative z-10 flex h-screen items-center justify-center animate-fade-in px-4">
          <div className="flex flex-col items-center gap-6 animate-scale-in">
            <div className="flex h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-3xl bg-background/80 shadow-2xl border border-primary/20">
              <ChameleonLogo size={120} />
            </div>
            <div className="text-center space-y-2 animate-slide-in-up">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary/80 bg-clip-text text-transparent">
                Chameleon AI
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-medium animate-shimmer">Adapting to your conversation...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <ChatApp />
}

export default function Home() {
  return (
    <AppProvider>
      <ModeWrapper>
        <LoadingWrapper />
      </ModeWrapper>
    </AppProvider>
  )
}
