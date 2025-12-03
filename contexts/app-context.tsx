"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import type { Chat, AppSettings, Message, ChatFolder, ComparisonSession, StreamingState } from "@/types"
import { generateUUID } from "@/lib/utils"
import { getUserSelectedModels } from "@/lib/model-preferences"
import { sanitizeChatsForStorage, safeSetLocalStorage, getLocalStorageUsage, forceCleanupLocalStorage } from "@/lib/storage-utils"
import { generateChatTitle } from "@/lib/title-generator"
import { stripImageDataFromContent } from "@/lib/multimodal-utils"
import { memoryService } from "@/lib/memory-service"

/**
 * App Context for Chameleon AI Chat - Local-First Edition
 * Uses SQLite database via API routes for persistent storage
 */

interface AppContextType {
  chats: Chat[]
  currentChatId: string | null
  settings: AppSettings
  folders: ChatFolder[]
  comparisonSessions: ComparisonSession[]
  user: null // Always null in local-first mode
  isLoading: boolean
  isChatLoading: boolean
  setIsChatLoading: (loading: boolean) => void
  streamingState: StreamingState
  updateStreamingState: (updates: Partial<StreamingState>) => void
  resetStreamingState: () => void
  createChat: (model?: string) => string
  deleteChat: (chatId: string) => void
  deleteAllChats: () => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  setCurrentChat: (chatId: string | null) => void
  addMessage: (chatId: string, message: Message) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  createFolder: (name: string) => string
  deleteFolder: (folderId: string) => void
  exportChat: (chatId: string) => string
  importChat: (data: string) => void
  exportAllChats: () => string
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>
  saveComparisonSession: (session: Omit<ComparisonSession, "id" | "timestamp">) => string
  deleteComparisonSession: (sessionId: string) => void
  deleteAllComparisonSessions: () => void
  updateComparisonSession: (sessionId: string, updates: Partial<ComparisonSession>) => void
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  apiKeys: {
    openRouter: "",
    tavily: "",
    serper: "",
    exa: "",
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
  messageDensity: "comfortable",
  experimental: {
    performanceMode: true, // Default to ON to prevent GPU issues
  },
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [folders, setFolders] = useState<ChatFolder[]>([])
  const [comparisonSessions, setComparisonSessions] = useState<ComparisonSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    phase: "idle",
  })
  const settingsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSettingsSaveRef = useRef<string>("")

  // Helper function to deeply merge settings objects
  const deepMergeSettings = (defaults: AppSettings, parsed: Partial<AppSettings>): AppSettings => {
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
    }
  }

  // Load data from SQLite on mount
  useEffect(() => {
    const loadData = async () => {
      console.log("[AppContext] Loading data from SQLite...")

      try {
        // Load chats from SQLite
        const chatsResponse = await fetch('/api/db/chats')
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json()
          setChats(chatsData)
          console.log(`[AppContext] Loaded ${chatsData.length} chats from SQLite`)
        }

        // Load settings from SQLite
        const settingsResponse = await fetch('/api/db/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          if (settingsData && Object.keys(settingsData).length > 0) {
            const merged = deepMergeSettings(DEFAULT_SETTINGS, settingsData)
            setSettings(merged)
            console.log("[AppContext] Loaded settings from SQLite")
          }
        }

        // Load folders from SQLite
        const foldersResponse = await fetch('/api/db/folders')
        if (foldersResponse.ok) {
          const foldersData = await foldersResponse.json()
          setFolders(foldersData)
        }

      } catch (error) {
        console.error("[AppContext] Error loading from SQLite:", error)
        // Fall back to localStorage if SQLite fails
        loadFromLocalStorage()
      }

      setIsLoading(false)
    }

    // Also clean up localStorage on mount
    if (typeof window !== "undefined") {
      forceCleanupLocalStorage()
    }

    loadData()
  }, [])

  // Load from localStorage as fallback
  const loadFromLocalStorage = () => {
    console.log("[AppContext] Falling back to localStorage...")
    const savedChats = localStorage.getItem("chats")
    const savedSettings = localStorage.getItem("settings")
    const savedFolders = localStorage.getItem("folders")

    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats))
      } catch (error) {
        console.error("[AppContext] Failed to parse chats from localStorage:", error)
      }
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        const mergedSettings = deepMergeSettings(DEFAULT_SETTINGS, parsed)
        setSettings(mergedSettings)
      } catch (error) {
        console.error("[AppContext] Failed to parse settings from localStorage:", error)
      }
    }

    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders))
      } catch (error) {
        console.error("[AppContext] Failed to parse folders from localStorage:", error)
      }
    }
  }

  // Sync memory service settings whenever app settings change
  useEffect(() => {
    if (settings.memorySettings) {
      memoryService.updateSettings(settings.memorySettings)
    }
  }, [settings.memorySettings])

  // Sync model preference changes back to app settings
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

  // Save settings to SQLite when they change
  useEffect(() => {
    if (isLoading) return

    const settingsString = JSON.stringify(settings)
    if (settingsString === lastSettingsSaveRef.current) return

    if (settingsSaveTimeoutRef.current) {
      clearTimeout(settingsSaveTimeoutRef.current)
    }

    settingsSaveTimeoutRef.current = setTimeout(async () => {
      lastSettingsSaveRef.current = settingsString

      // Save to localStorage as backup
      try {
        localStorage.setItem("settings", JSON.stringify(settings))
      } catch (error) {
        console.error("[AppContext] Failed to save settings to localStorage:", error)
      }

      // Save to SQLite
      try {
        await fetch('/api/db/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        })
        console.log("[AppContext] Settings saved to SQLite")
      } catch (error) {
        console.error("[AppContext] Failed to save settings to SQLite:", error)
      }
    }, 500)

    return () => {
      if (settingsSaveTimeoutRef.current) {
        clearTimeout(settingsSaveTimeoutRef.current)
      }
    }
  }, [settings, isLoading])

  // Save chats to localStorage as backup
  useEffect(() => {
    if (isLoading) return
    const sanitizedChats = sanitizeChatsForStorage(chats)
    safeSetLocalStorage("chats", sanitizedChats)
  }, [chats, isLoading])

  // Save folders to localStorage as backup
  useEffect(() => {
    if (isLoading) return
    safeSetLocalStorage("folders", folders)
  }, [folders, isLoading])

  const createChat = (model?: string): string => {
    const chatId = generateUUID()

    const newChat: Chat = {
      id: chatId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: model || settings.selectedModel,
    }

    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)

    // Save to SQLite
    fetch('/api/db/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChat),
    }).catch(console.error)

    return newChat.id
  }

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }

    // Delete from SQLite
    fetch(`/api/db/chats?id=${chatId}`, { method: 'DELETE' }).catch(console.error)
  }

  const deleteAllChats = () => {
    setChats([])
    setCurrentChatId(null)

    // Delete all from SQLite (atomic operation)
    fetch('/api/db/chats?all=true', { method: 'DELETE' }).catch(console.error)
  }

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, ...updates, updatedAt: Date.now() } : chat)))

    // Update in SQLite
    fetch('/api/db/chats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: chatId, ...updates }),
    }).catch(console.error)
  }

  const setCurrentChat = (chatId: string | null) => {
    setCurrentChatId(chatId)
  }

  const addMessage = (chatId: string, message: Message) => {
    // Extract text content from message
    let textContent = ""
    if (typeof message.content === "string") {
      textContent = message.content
    } else if (Array.isArray(message.content)) {
      const textPart = message.content.find((part: any) => part.type === "text")
      textContent = textPart?.text || "Image conversation"
    }

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, message]
          const isFirstUserMessage = chat.messages.length === 0 && message.role === "user"

          const tempTitle = isFirstUserMessage
            ? textContent.slice(0, 50) + (textContent.length > 50 ? "..." : "")
            : chat.title

          return {
            ...chat,
            messages: updatedMessages,
            title: tempTitle,
            updatedAt: Date.now(),
          }
        }
        return chat
      }),
    )

    // Save message to SQLite
    fetch('/api/db/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...message,
        chatId,
        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      }),
    }).catch(console.error)

    // Generate AI title for first user message
    const currentChat = chats.find((c) => c.id === chatId)
    const isFirstUserMessage = currentChat && currentChat.messages.length === 0 && message.role === "user"

    if (isFirstUserMessage && settings.apiKeys.openRouter && textContent.length >= 10) {
      generateChatTitle(textContent, settings.apiKeys.openRouter)
        .then(({ title: aiTitle, success }) => {
          if (success) {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === chatId ? { ...chat, title: aiTitle, titleGeneratedAt: Date.now() } : chat
              )
            )
            // Update in SQLite
            fetch('/api/db/chats', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: chatId, title: aiTitle, titleGeneratedAt: Date.now() }),
            }).catch(console.error)
          }
        })
        .catch(console.warn)
    }
  }

  const updateSettings = (updates: Partial<AppSettings>) => {
    const validatedUpdates = { ...updates }

    if (validatedUpdates.modelParameters?.maxTokens && validatedUpdates.modelParameters.maxTokens < 4096) {
      validatedUpdates.modelParameters.maxTokens = 4096
    }

    setSettings((prev) => {
      const merged = deepMergeSettings(prev, validatedUpdates)

      // Protect API keys from being cleared
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

  const createFolder = (name: string): string => {
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setFolders((prev) => [...prev, newFolder])

    // Save to SQLite
    fetch('/api/db/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFolder),
    }).catch(console.error)

    return newFolder.id
  }

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== folderId))
    setChats((prev) => prev.map((chat) => (chat.folderId === folderId ? { ...chat, folderId: undefined } : chat)))

    // Delete from SQLite
    fetch(`/api/db/folders?id=${folderId}`, { method: 'DELETE' }).catch(console.error)
  }

  const exportChat = (chatId: string): string => {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) throw new Error("Chat not found")
    return JSON.stringify(chat, null, 2)
  }

  const importChat = (data: string) => {
    try {
      const chat = JSON.parse(data) as Chat
      chat.id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      chat.createdAt = Date.now()
      chat.updatedAt = Date.now()
      setChats((prev) => [chat, ...prev])

      // Save to SQLite
      fetch('/api/db/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chat),
      }).catch(console.error)
    } catch (error) {
      throw new Error("Invalid chat data")
    }
  }

  const exportAllChats = (): string => {
    return JSON.stringify({ chats, folders, settings, comparisonSessions }, null, 2)
  }

  const saveComparisonSession = (session: Omit<ComparisonSession, "id" | "timestamp">): string => {
    if (!session.models || session.models.length === 0) {
      console.error("[AppContext] Cannot save comparison session: models array is required")
      return ""
    }

    const newSession: ComparisonSession = {
      ...session,
      id: generateUUID(),
      timestamp: Date.now(),
    }
    setComparisonSessions((prev) => [newSession, ...prev])
    return newSession.id
  }

  const deleteComparisonSession = (sessionId: string) => {
    setComparisonSessions((prev) => prev.filter((session) => session.id !== sessionId))
  }

  const deleteAllComparisonSessions = () => {
    setComparisonSessions([])
  }

  const updateComparisonSession = (sessionId: string, updates: Partial<ComparisonSession>) => {
    setComparisonSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, ...updates } : session)),
    )
  }

  const signOut = async () => {
    // Clear local storage and reload
    localStorage.clear()
    window.location.href = "/"
  }

  // Streaming state management
  const updateStreamingState = (updates: Partial<StreamingState>) => {
    setStreamingState((prev) => ({ ...prev, ...updates }))
  }

  const resetStreamingState = () => {
    setStreamingState({
      isStreaming: false,
      phase: "idle",
    })
  }

  return (
    <AppContext.Provider
      value={{
        chats,
        currentChatId,
        settings,
        folders,
        comparisonSessions,
        user: null,
        isLoading,
        isChatLoading,
        setIsChatLoading,
        streamingState,
        updateStreamingState,
        resetStreamingState,
        createChat,
        deleteChat,
        deleteAllChats,
        updateChat,
        setCurrentChat,
        addMessage,
        updateSettings,
        createFolder,
        deleteFolder,
        exportChat,
        importChat,
        exportAllChats,
        setChats,
        saveComparisonSession,
        deleteComparisonSession,
        deleteAllComparisonSessions,
        updateComparisonSession,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
