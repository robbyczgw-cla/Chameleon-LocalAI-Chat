"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import type { AppSettings } from "@/types"
import { getUserSelectedModels } from "@/lib/model-preferences"

/**
 * Settings Context for Chameleon AI Chat - Local-First Edition
 * Uses SQLite database via API routes for persistent storage
 */

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
  isSettingsLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  enableAutoSearch: false,
  apiKeys: {
    openRouter: "",
    tavily: "",
    serper: "",
    exa: "",
  },
  lmStudio: {
    enabled: true, // Enable LM Studio by default for local-first
    endpoint: "http://localhost:1234/v1",
    models: [],
  },
  selectedModel: "local/qwen/qwen3-8b", // Default to local model
  selectedModels: ["local/qwen/qwen3-8b"],
  searchProvider: "tavily",
  modelParameters: {
    temperature: 0.7,
    maxTokens: 8192,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },
  systemPrompt:
    "You are a friendly, helpful assistant. Provide clear, precise, and helpful answers. At the end of each response: Write 1-3 engaging questions to continue the discussion when appropriate (phrase them slightly differently each time), then add clickable next possible user prompts in categorized format:\n\n[FOLLOWUP]\n{\n  \"quick\": [\"Short user prompts from user perspective\"],\n  \"deep\": [\"Detailed user prompts for deeper explanations\"],\n  \"related\": [\"User prompts on related topics\"]\n}\n[/FOLLOWUP]\n\nIMPORTANT: The prompts are from the USER's perspective - what might the user ask/say next! Not all categories need to be used.",
  tavilySettings: {
    searchDepth: "basic",
    maxResults: 5,
    includeImages: false,
    includeAnswer: true,
  },
  serperSettings: {
    maxResults: 5,
    includeImages: false,
    country: "at",
    language: "de",
  },
  exaSettings: {
    maxResults: 5,
    searchType: "auto",
    useAutoprompt: true,
    includeFullText: true,
    includeHighlights: true,
    includeSummary: false,
    includeImages: false,
    highlightsPerResult: 3,
    maxTextCharacters: 3000,
    livecrawl: "fallback",
  },
  memorySettings: {
    enabled: false,
    autoExtract: true,
    importanceThreshold: 2,
    maxMemoriesInContext: 5,
  },
  showDetailedStats: false,
  fontSize: "medium",
  fontFamily: "inter",
  messageDensity: "comfortable",
  experimental: {
    performanceMode: true, // Default ON to prevent GPU issues
  },
}

/**
 * Deep merge settings objects, protecting API keys from being overwritten with empty values
 */
export function deepMergeSettings(defaults: AppSettings, parsed: Partial<AppSettings>): AppSettings {
  const mergedApiKeys = { ...defaults.apiKeys }
  if (parsed.apiKeys) {
    Object.keys(parsed.apiKeys).forEach((key) => {
      const value = (parsed.apiKeys as any)[key]
      if (value) {
        (mergedApiKeys as any)[key] = value
      }
    })
  }

  return {
    ...defaults,
    ...parsed,
    modelParameters: {
      ...defaults.modelParameters,
      ...(parsed.modelParameters || {}),
    },
    tavilySettings: {
      ...defaults.tavilySettings,
      ...(parsed.tavilySettings || {}),
    },
    serperSettings: {
      ...defaults.serperSettings,
      ...(parsed.serperSettings || {}),
    },
    exaSettings: {
      ...defaults.exaSettings,
      ...(parsed.exaSettings || {}),
    },
    apiKeys: mergedApiKeys,
    voiceSettings: {
      ...defaults.voiceSettings,
      ...(parsed.voiceSettings || {}),
    },
    memorySettings: {
      ...defaults.memorySettings,
      ...(parsed.memorySettings || {}),
    },
    experimental: {
      ...defaults.experimental,
      ...(parsed.experimental || {}),
    },
    lmStudio: {
      ...defaults.lmStudio,
      ...(parsed.lmStudio || {}),
    },
  }
}

interface SettingsProviderProps {
  children: ReactNode
  onSettingsChange?: (settings: AppSettings) => void
  initialSettings?: AppSettings
}

export function SettingsProvider({
  children,
  onSettingsChange,
  initialSettings,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings || DEFAULT_SETTINGS)
  const [isSettingsLoading, setIsSettingsLoading] = useState(true)
  const lastSettingsSaveRef = useRef<string>("")
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load settings from SQLite on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadSettings = async () => {
      try {
        // Try to load from SQLite first
        const response = await fetch('/api/db/settings')
        if (response.ok) {
          const data = await response.json()
          if (data && Object.keys(data).length > 0) {
            const mergedSettings = deepMergeSettings(DEFAULT_SETTINGS, data)
            setSettings(mergedSettings)
            console.log("[SettingsContext] Loaded settings from SQLite")
            setIsSettingsLoading(false)
            return
          }
        }
      } catch (error) {
        console.error("[SettingsContext] Failed to load from SQLite:", error)
      }

      // Fall back to localStorage
      const savedSettings = localStorage.getItem("settings")
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)

          // Upgrade old prompts to include FOLLOWUP format
          const OLD_GENERIC_PROMPTS = [
            "You are a helpful AI assistant.",
            "You are a helpful AI assistant",
            "You are an AI assistant.",
            "You are an AI assistant",
          ]

          if (!parsed.systemPrompt ||
              OLD_GENERIC_PROMPTS.includes(parsed.systemPrompt) ||
              !parsed.systemPrompt.includes("[FOLLOWUP]")) {
            parsed.systemPrompt = DEFAULT_SETTINGS.systemPrompt
          }

          // Ensure minimum maxTokens
          if (parsed.maxTokens && parsed.maxTokens < 4096) {
            parsed.maxTokens = 16000
          }
          if (parsed.modelParameters?.maxTokens && parsed.modelParameters.maxTokens < 4096) {
            parsed.modelParameters.maxTokens = 16000
          }

          // Load selected models from model-preferences
          try {
            const userSelectedModels = getUserSelectedModels()
            if (userSelectedModels && userSelectedModels.length > 0) {
              parsed.selectedModels = userSelectedModels
            }
          } catch (prefError) {
            console.warn("[SettingsContext] Failed to load model preferences:", prefError)
          }

          const mergedSettings = deepMergeSettings(DEFAULT_SETTINGS, parsed)
          setSettings(mergedSettings)
        } catch (error) {
          console.error("[SettingsContext] Failed to parse settings:", error)
          localStorage.removeItem("settings")
        }
      }
      setIsSettingsLoading(false)
    }

    loadSettings()
  }, [])

  // Sync model preference changes
  useEffect(() => {
    const handleModelPreferencesChanged = () => {
      const userSelectedModels = getUserSelectedModels()
      if (userSelectedModels.length > 0) {
        setSettings((prev) => ({
          ...prev,
          selectedModels: userSelectedModels,
          selectedModel: userSelectedModels[0],
        }))
      }
    }

    window.addEventListener("modelPreferencesChanged", handleModelPreferencesChanged)
    return () => {
      window.removeEventListener("modelPreferencesChanged", handleModelPreferencesChanged)
    }
  }, [])

  // Save settings to SQLite and localStorage when they change
  useEffect(() => {
    if (isSettingsLoading) return

    const settingsString = JSON.stringify(settings)
    if (settingsString === lastSettingsSaveRef.current) return

    // Debounce saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      lastSettingsSaveRef.current = settingsString

      // Save to localStorage as backup
      try {
        localStorage.setItem("settings", settingsString)
      } catch (error) {
        console.error("[SettingsContext] Failed to save to localStorage:", error)
      }

      // Save to SQLite
      try {
        await fetch('/api/db/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: settingsString,
        })
        console.log("[SettingsContext] Settings saved to SQLite")
      } catch (error) {
        console.error("[SettingsContext] Failed to save to SQLite:", error)
      }

      // Notify parent context if needed
      onSettingsChange?.(settings)
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [settings, isSettingsLoading, onSettingsChange])

  const updateSettings = (updates: Partial<AppSettings>) => {
    const validatedUpdates = { ...updates }

    if (validatedUpdates.modelParameters?.maxTokens && validatedUpdates.modelParameters.maxTokens < 4096) {
      validatedUpdates.modelParameters.maxTokens = 4096
    }

    setSettings((prev) => {
      const merged = deepMergeSettings(prev, validatedUpdates)

      // API key protection - never allow keys to be cleared
      if (prev.apiKeys.openRouter && !merged.apiKeys.openRouter) {
        merged.apiKeys.openRouter = prev.apiKeys.openRouter
      }
      if (prev.apiKeys.tavily && !merged.apiKeys.tavily) {
        merged.apiKeys.tavily = prev.apiKeys.tavily
      }
      if (prev.apiKeys.serper && !merged.apiKeys.serper) {
        merged.apiKeys.serper = prev.apiKeys.serper
      }
      if (prev.apiKeys.exa && !merged.apiKeys.exa) {
        merged.apiKeys.exa = prev.apiKeys.exa
      }

      return merged
    })
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isSettingsLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
