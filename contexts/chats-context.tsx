"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Chat, Message, ChatFolder, ComparisonSession } from "@/types"
import { generateUUID } from "@/lib/utils"
import { sanitizeChatsForStorage, safeSetLocalStorage } from "@/lib/storage-utils"

interface ChatsContextType {
  chats: Chat[]
  currentChatId: string | null
  folders: ChatFolder[]
  comparisonSessions: ComparisonSession[]
  isChatLoading: boolean
  setIsChatLoading: (loading: boolean) => void
  createChat: (model?: string) => string
  deleteChat: (chatId: string) => void
  deleteAllChats: () => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  setCurrentChat: (chatId: string | null) => void
  addMessage: (chatId: string, message: Message) => void
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
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined)

interface ChatsProviderProps {
  children: ReactNode
  defaultModel: string
  userId?: string | null
  onChatCreated?: (chat: Chat) => void
  onChatDeleted?: (chatId: string) => void
  onChatUpdated?: (chat: Chat) => void
  onMessageAdded?: (chatId: string, message: Message) => void
  onFolderCreated?: (folder: ChatFolder) => void
  onFolderDeleted?: (folderId: string) => void
  onComparisonSessionSaved?: (session: ComparisonSession) => void
  onComparisonSessionDeleted?: (sessionId: string) => void
}

export function ChatsProvider({
  children,
  defaultModel,
  userId,
  onChatCreated,
  onChatDeleted,
  onChatUpdated,
  onMessageAdded,
  onFolderCreated,
  onFolderDeleted,
  onComparisonSessionSaved,
  onComparisonSessionDeleted,
}: ChatsProviderProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [folders, setFolders] = useState<ChatFolder[]>([])
  const [comparisonSessions, setComparisonSessions] = useState<ComparisonSession[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const savedChats = localStorage.getItem("chats")
    const savedFolders = localStorage.getItem("folders")
    const savedComparisonSessions = localStorage.getItem("comparisonSessions")

    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats))
      } catch (error) {
        console.error("[ChatsContext] Failed to parse chats:", error)
        localStorage.removeItem("chats")
      }
    }

    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders))
      } catch (error) {
        console.error("[ChatsContext] Failed to parse folders:", error)
        localStorage.removeItem("folders")
      }
    }

    if (savedComparisonSessions) {
      try {
        setComparisonSessions(JSON.parse(savedComparisonSessions))
      } catch (error) {
        console.error("[ChatsContext] Failed to parse comparison sessions:", error)
        localStorage.removeItem("comparisonSessions")
      }
    }

    setIsInitialized(true)
  }, [])

  // Save chats to localStorage
  useEffect(() => {
    if (!isInitialized) return
    const sanitizedChats = sanitizeChatsForStorage(chats)
    safeSetLocalStorage("chats", sanitizedChats)
  }, [chats, isInitialized])

  // Save folders to localStorage
  useEffect(() => {
    if (!isInitialized) return
    safeSetLocalStorage("folders", folders)
  }, [folders, isInitialized])

  // Save comparison sessions to localStorage
  useEffect(() => {
    if (!isInitialized) return
    safeSetLocalStorage("comparisonSessions", comparisonSessions)
  }, [comparisonSessions, isInitialized])

  const createChat = (model?: string): string => {
    const chatId = generateUUID()

    const newChat: Chat = {
      id: chatId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: model || defaultModel,
    }

    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)

    onChatCreated?.(newChat)

    return newChat.id
  }

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }

    onChatDeleted?.(chatId)
  }

  const deleteAllChats = () => {
    setChats([])
    setCurrentChatId(null)
  }

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          const updatedChat = { ...chat, ...updates, updatedAt: Date.now() }
          onChatUpdated?.(updatedChat)
          return updatedChat
        }
        return chat
      })
    )
  }

  const setCurrentChat = (chatId: string | null) => {
    setCurrentChatId(chatId)
  }

  const addMessage = (chatId: string, message: Message) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, message]
          const title =
            chat.messages.length === 0 && message.role === "user"
              ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
              : chat.title

          onMessageAdded?.(chatId, message)

          return {
            ...chat,
            messages: updatedMessages,
            title,
            updatedAt: Date.now(),
          }
        }
        return chat
      })
    )
  }

  const createFolder = (name: string): string => {
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setFolders((prev) => [...prev, newFolder])

    onFolderCreated?.(newFolder)

    return newFolder.id
  }

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== folderId))
    setChats((prev) =>
      prev.map((chat) => (chat.folderId === folderId ? { ...chat, folderId: undefined } : chat))
    )

    onFolderDeleted?.(folderId)
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

      onChatCreated?.(chat)
    } catch {
      throw new Error("Invalid chat data")
    }
  }

  const exportAllChats = (): string => {
    return JSON.stringify({ chats, folders, comparisonSessions }, null, 2)
  }

  const saveComparisonSession = (session: Omit<ComparisonSession, "id" | "timestamp">): string => {
    if (!session.models || session.models.length === 0) {
      console.error("[ChatsContext] Cannot save comparison session: models array is required")
      return ""
    }

    const newSession: ComparisonSession = {
      ...session,
      id: generateUUID(),
      timestamp: Date.now(),
    }
    setComparisonSessions((prev) => [newSession, ...prev])

    onComparisonSessionSaved?.(newSession)

    return newSession.id
  }

  const deleteComparisonSession = (sessionId: string) => {
    setComparisonSessions((prev) => prev.filter((session) => session.id !== sessionId))

    onComparisonSessionDeleted?.(sessionId)
  }

  const deleteAllComparisonSessions = () => {
    setComparisonSessions([])
  }

  const updateComparisonSession = (sessionId: string, updates: Partial<ComparisonSession>) => {
    setComparisonSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, ...updates } : session))
    )
  }

  return (
    <ChatsContext.Provider
      value={{
        chats,
        currentChatId,
        folders,
        comparisonSessions,
        isChatLoading,
        setIsChatLoading,
        createChat,
        deleteChat,
        deleteAllChats,
        updateChat,
        setCurrentChat,
        addMessage,
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
      }}
    >
      {children}
    </ChatsContext.Provider>
  )
}

export function useChats() {
  const context = useContext(ChatsContext)
  if (context === undefined) {
    throw new Error("useChats must be used within a ChatsProvider")
  }
  return context
}
