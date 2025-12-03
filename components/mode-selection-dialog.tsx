"use client"

import { useState } from "react"
import { ChameleonLogo } from "@/components/chameleon-logo"
import {
  Sparkles,
  Zap,
  Heart,
  Settings2,
  Code2,
  Puzzle,
  ChevronRight,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Translations
const translations = {
  en: {
    welcome: "Welcome to Chameleon AI",
    subtitle: "Choose how you want to use Chameleon",
    simpleMode: "Simple Mode",
    simpleDesc: "Perfect for everyday conversations",
    simpleFeature1: "Clean, focused interface",
    simpleFeature2: "Guided setup wizard",
    simpleFeature3: "Quick persona selection",
    simpleFeature4: "Easy to use",
    advancedMode: "Advanced Mode",
    advancedDesc: "Full control for power users",
    advancedFeature1: "All features unlocked",
    advancedFeature2: "MCP integrations",
    advancedFeature3: "Advanced model settings",
    advancedFeature4: "Web search & analytics",
    recommended: "Recommended for beginners",
    chooseSimple: "Start Simple",
    chooseAdvanced: "Go Advanced",
    canSwitchLater: "You can switch modes anytime in Settings",
  },
  de: {
    welcome: "Willkommen bei Chameleon AI",
    subtitle: "Wähle wie du Chameleon nutzen möchtest",
    simpleMode: "Einfacher Modus",
    simpleDesc: "Perfekt für alltägliche Unterhaltungen",
    simpleFeature1: "Klare, fokussierte Oberfläche",
    simpleFeature2: "Geführter Einrichtungsassistent",
    simpleFeature3: "Schnelle Persona-Auswahl",
    simpleFeature4: "Einfach zu bedienen",
    advancedMode: "Erweiterter Modus",
    advancedDesc: "Volle Kontrolle für Power-User",
    advancedFeature1: "Alle Funktionen freigeschaltet",
    advancedFeature2: "MCP-Integrationen",
    advancedFeature3: "Erweiterte Modell-Einstellungen",
    advancedFeature4: "Websuche & Analysen",
    recommended: "Empfohlen für Einsteiger",
    chooseSimple: "Einfach starten",
    chooseAdvanced: "Erweitert starten",
    canSwitchLater: "Du kannst den Modus jederzeit in den Einstellungen wechseln",
  },
}

interface ModeSelectionDialogProps {
  open: boolean
  onSelectMode: (simpleMode: boolean) => void
}

export function ModeSelectionDialog({ open, onSelectMode }: ModeSelectionDialogProps) {
  const [selectedMode, setSelectedMode] = useState<"simple" | "advanced" | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Get translations based on browser language or default to English
  const browserLang = typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en"
  const lang = browserLang === "de" ? "de" : "en"
  const t = translations[lang]

  const handleSelectMode = (mode: "simple" | "advanced") => {
    setSelectedMode(mode)
    setIsTransitioning(true)

    // Small delay for visual feedback
    setTimeout(() => {
      // Mark that user has chosen a mode
      localStorage.setItem("chameleon-mode-selected", "true")
      onSelectMode(mode === "simple")
    }, 300)
  }

  if (!open) return null

  // Full-page component with inline styles for reliable rendering
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      className="bg-background"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '42rem',
          maxHeight: '90vh',
          margin: '0 1rem',
        }}
        className="overflow-hidden flex flex-col bg-background border rounded-lg shadow-lg"
      >
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b bg-gradient-to-br from-violet-500/10 to-purple-500/10">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <ChameleonLogo size={40} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">{t.welcome}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Mode Selection Cards */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Simple Mode Card */}
            <button
              onClick={() => handleSelectMode("simple")}
              disabled={isTransitioning}
              className={cn(
                "relative p-5 rounded-2xl border-2 text-left transition-all duration-200",
                "hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10",
                selectedMode === "simple"
                  ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20"
                  : "border-border",
                isTransitioning && selectedMode !== "simple" && "opacity-50"
              )}
            >
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-4">
                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full">
                  {t.recommended}
                </span>
              </div>

              <div className="flex items-start gap-4 mt-2">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1">{t.simpleMode}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.simpleDesc}</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <span>{t.simpleFeature1}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <span>{t.simpleFeature2}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <span>{t.simpleFeature3}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <span>{t.simpleFeature4}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {selectedMode === "simple" && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <span className={cn(
                  "flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors",
                  selectedMode === "simple"
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                    : "bg-muted hover:bg-violet-100 dark:hover:bg-violet-900/30"
                )}>
                  {t.chooseSimple}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>

            {/* Advanced Mode Card */}
            <button
              onClick={() => handleSelectMode("advanced")}
              disabled={isTransitioning}
              className={cn(
                "relative p-5 rounded-2xl border-2 text-left transition-all duration-200",
                "hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10",
                selectedMode === "advanced"
                  ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                  : "border-border",
                isTransitioning && selectedMode !== "advanced" && "opacity-50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1">{t.advancedMode}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.advancedDesc}</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-sm">
                      <Settings2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>{t.advancedFeature1}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Puzzle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>{t.advancedFeature2}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Code2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>{t.advancedFeature3}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>{t.advancedFeature4}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {selectedMode === "advanced" && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <span className={cn(
                  "flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors",
                  selectedMode === "advanced"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                    : "bg-muted hover:bg-blue-100 dark:hover:bg-blue-900/30"
                )}>
                  {t.chooseAdvanced}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t text-center">
          <p className="text-xs text-muted-foreground">{t.canSwitchLater}</p>
        </div>
      </div>
    </div>
  )
}
