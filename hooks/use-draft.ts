"use client"

import { useState, useEffect, useCallback, useRef } from "react"

const DRAFT_STORAGE_KEY = "chameleon-draft"
const DRAFT_DEBOUNCE_MS = 500

interface DraftData {
  chatId: string | null
  content: string
  savedAt: number
}

/**
 * Hook for auto-saving and restoring draft messages
 * Persists to localStorage with debounce to prevent excessive writes
 */
export function useDraft(chatId: string | null) {
  const [draft, setDraft] = useState("")
  const [isRestored, setIsRestored] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Restore draft from localStorage on mount or chat change
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedData = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedData) {
        const parsed: DraftData = JSON.parse(savedData)

        // Only restore if it's for the current chat (or no chat)
        if (parsed.chatId === chatId || (!parsed.chatId && !chatId)) {
          // Only restore if saved within the last 24 hours
          const ageMs = Date.now() - parsed.savedAt
          if (ageMs < 24 * 60 * 60 * 1000) {
            setDraft(parsed.content)
            console.log("[Draft] Restored draft:", parsed.content.substring(0, 50))
          } else {
            // Clear stale draft
            localStorage.removeItem(DRAFT_STORAGE_KEY)
          }
        }
      }
    } catch (error) {
      console.error("[Draft] Failed to restore draft:", error)
    }

    setIsRestored(true)
  }, [chatId])

  // Save draft to localStorage with debounce
  const saveDraft = useCallback((content: string) => {
    setDraft(content)

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce the save
    saveTimeoutRef.current = setTimeout(() => {
      if (typeof window === "undefined") return

      try {
        if (content.trim()) {
          const draftData: DraftData = {
            chatId,
            content,
            savedAt: Date.now(),
          }
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
          console.log("[Draft] Saved draft:", content.substring(0, 50))
        } else {
          // Clear draft if empty
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        }
      } catch (error) {
        console.error("[Draft] Failed to save draft:", error)
      }
    }, DRAFT_DEBOUNCE_MS)
  }, [chatId])

  // Clear draft (call after successful send)
  const clearDraft = useCallback(() => {
    setDraft("")
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      console.log("[Draft] Cleared draft")
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    draft,
    saveDraft,
    clearDraft,
    isRestored,
  }
}
