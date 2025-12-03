/**
 * Storage Utilities
 * Helper functions for managing localStorage with size limits
 */

import type { Chat, Message } from "@/types"

/**
 * Strip large data (image data URLs) from messages to reduce storage size
 * Keeps only metadata for attachments
 */
export function sanitizeChatsForStorage(chats: Chat[]): Chat[] {
  return chats.map(chat => ({
    ...chat,
    messages: chat.messages.map(sanitizeMessageForStorage),
  }))
}

/**
 * Remove image data URLs from message content and attachments
 * Keeps text content and attachment metadata, but removes base64 image data
 */
export function sanitizeMessageForStorage(message: Message): Message {
  const sanitized = { ...message }

  // If content is multimodal (array), remove image_url data
  if (Array.isArray(sanitized.content)) {
    sanitized.content = sanitized.content.map(part => {
      if (part.type === "image_url") {
        // Keep metadata but remove actual image data
        return {
          type: "image_url" as const,
          image_url: {
            url: "[IMAGE_DATA_REMOVED]", // Placeholder
            detail: part.image_url?.detail,
          },
        }
      }
      return part
    })
  }

  // Remove data URLs from attachments (keep only metadata)
  if (sanitized.attachments) {
    sanitized.attachments = sanitized.attachments.map(attachment => ({
      ...attachment,
      url: attachment.url.startsWith("data:") ? "[DATA_URL_REMOVED]" : attachment.url,
    }))
  }

  return sanitized
}

/**
 * Get localStorage usage in MB
 */
export function getLocalStorageUsage(): { used: number; available: number } {
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }

  const usedMB = (total / 1024 / 1024).toFixed(2)
  const availableMB = 5 // Approximate localStorage limit (varies by browser)

  return {
    used: parseFloat(usedMB),
    available: availableMB,
  }
}

/**
 * Safely set item in localStorage with quota handling
 */
export function safeSetLocalStorage(key: string, value: any): boolean {
  try {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value)
    localStorage.setItem(key, stringValue)
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("[Storage] LocalStorage quota exceeded for key:", key)
      console.error("[Storage] Current usage:", getLocalStorageUsage())

      // Try to clear old data and retry
      clearOldChatsFromStorage()

      try {
        const stringValue = typeof value === "string" ? value : JSON.stringify(value)
        localStorage.setItem(key, stringValue)
        return true
      } catch (retryError) {
        console.error("[Storage] Still failed after cleanup:", retryError)
        return false
      }
    }

    console.error("[Storage] Failed to save to localStorage:", error)
    return false
  }
}

/**
 * Clear old chats from localStorage to free up space
 * Keeps only the most recent 50 chats
 */
export function clearOldChatsFromStorage(): void {
  try {
    const chatsStr = localStorage.getItem("chats")
    if (!chatsStr) return

    const chats: Chat[] = JSON.parse(chatsStr)

    // Sort by updatedAt descending
    const sortedChats = chats.sort((a, b) => b.updatedAt - a.updatedAt)

    // Keep only the 50 most recent chats
    const recentChats = sortedChats.slice(0, 50)

    console.log(`[Storage] Cleaned up ${chats.length - recentChats.length} old chats`)

    localStorage.setItem("chats", JSON.stringify(recentChats))
  } catch (error) {
    console.error("[Storage] Failed to clean up old chats:", error)
  }
}

/**
 * Get size of a specific localStorage item in KB
 */
export function getItemSize(key: string): number {
  const item = localStorage.getItem(key)
  if (!item) return 0
  return (item.length / 1024).toFixed(2) as any
}

/**
 * Force cleanup of localStorage on app initialization
 * Sanitizes existing chats to remove image data
 */
export function forceCleanupLocalStorage(): void {
  try {
    console.log("[Storage] Starting forced cleanup...")

    // Get current chats
    const chatsStr = localStorage.getItem("chats")
    if (!chatsStr) {
      console.log("[Storage] No chats to clean up")
      return
    }

    const sizeBefore = (chatsStr.length / 1024 / 1024).toFixed(2)
    console.log(`[Storage] Chats size before cleanup: ${sizeBefore}MB`)

    const chats: Chat[] = JSON.parse(chatsStr)

    // Sanitize to remove image data
    const sanitizedChats = sanitizeChatsForStorage(chats)

    // Keep only 50 most recent
    const sorted = sanitizedChats.sort((a, b) => b.updatedAt - a.updatedAt)
    const recentChats = sorted.slice(0, 50)

    // Save cleaned data
    const cleanedStr = JSON.stringify(recentChats)
    const sizeAfter = (cleanedStr.length / 1024 / 1024).toFixed(2)

    localStorage.setItem("chats", cleanedStr)

    console.log(`[Storage] Cleanup complete! ${sizeBefore}MB → ${sizeAfter}MB`)
    console.log(`[Storage] Removed ${chats.length - recentChats.length} old chats`)
  } catch (error) {
    console.error("[Storage] Cleanup failed, clearing all chats:", error)
    // Last resort - clear everything
    localStorage.removeItem("chats")
  }
}
