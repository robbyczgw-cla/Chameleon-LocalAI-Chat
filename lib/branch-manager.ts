/**
 * Branch Manager - Utilities for managing conversation branches
 *
 * Allows users to explore alternate conversation paths by branching from any message
 */

import type { Chat, Message, ConversationBranch } from "@/types"
import { generateUUID } from "@/lib/utils"

/**
 * Create a new branch from a specific message
 */
export function createBranch(
  chat: Chat,
  fromMessageId: string,
  branchName?: string
): { updatedChat: Chat; branchId: string } {
  const messageIndex = chat.messages.findIndex((m) => m.id === fromMessageId)

  if (messageIndex === -1) {
    throw new Error("Message not found")
  }

  // Create new branch with messages up to and including the branching point
  const branchId = generateUUID()
  const branchMessages = chat.messages.slice(0, messageIndex + 1)

  const newBranch: ConversationBranch = {
    id: branchId,
    name: branchName || `Branch ${new Date().toLocaleString()}`,
    messages: [],
    createdAt: Date.now(),
    parentMessageId: fromMessageId,
  }

  // Add branch to the message
  const message = chat.messages[messageIndex]
  const branches = message.branches || []
  branches.push(newBranch)

  const updatedMessages = [...chat.messages]
  updatedMessages[messageIndex] = {
    ...message,
    branches,
  }

  const updatedChat: Chat = {
    ...chat,
    messages: updatedMessages,
    currentBranchPath: [...(chat.currentBranchPath || []), branchId],
    updatedAt: Date.now(),
  }

  return { updatedChat, branchId }
}

/**
 * Switch to a specific branch
 */
export function switchToBranch(
  chat: Chat,
  branchId: string
): Chat {
  // Find the branch in the conversation tree
  const branch = findBranch(chat, branchId)

  if (!branch) {
    throw new Error("Branch not found")
  }

  // Build the branch path
  const branchPath = buildBranchPath(chat, branchId)

  return {
    ...chat,
    currentBranchPath: branchPath,
    updatedAt: Date.now(),
  }
}

/**
 * Get the currently active messages following the branch path
 */
export function getActiveMessages(chat: Chat): Message[] {
  if (!chat.currentBranchPath || chat.currentBranchPath.length === 0) {
    // No active branch, return main conversation
    return chat.messages
  }

  // Follow the branch path to get the correct messages
  let messages = chat.messages
  let currentMessages: Message[] = []

  for (const branchId of chat.currentBranchPath) {
    // Find the branch
    const branch = findBranchInMessages(messages, branchId)

    if (!branch) {
      // Branch not found, return what we have
      break
    }

    // Add messages up to the parent message
    const parentIndex = messages.findIndex((m) => m.id === branch.parentMessageId)
    if (parentIndex !== -1) {
      currentMessages = messages.slice(0, parentIndex + 1)
    }

    // Add branch messages
    currentMessages = [...currentMessages, ...branch.messages]
    messages = branch.messages
  }

  return currentMessages.length > 0 ? currentMessages : chat.messages
}

/**
 * Add a message to the current branch
 */
export function addMessageToBranch(
  chat: Chat,
  message: Message
): Chat {
  if (!chat.currentBranchPath || chat.currentBranchPath.length === 0) {
    // No active branch, add to main conversation
    return {
      ...chat,
      messages: [...chat.messages, message],
      updatedAt: Date.now(),
    }
  }

  // Add to the current branch
  const branchId = chat.currentBranchPath[chat.currentBranchPath.length - 1]
  const updatedMessages = addMessageToBranchInMessages(chat.messages, branchId, message)

  return {
    ...chat,
    messages: updatedMessages,
    updatedAt: Date.now(),
  }
}

/**
 * Return to the main conversation (exit all branches)
 */
export function returnToMainConversation(chat: Chat): Chat {
  return {
    ...chat,
    currentBranchPath: [],
    updatedAt: Date.now(),
  }
}

/**
 * Get all available branches in the conversation
 */
export function getAllBranches(chat: Chat): Array<{ branch: ConversationBranch; depth: number }> {
  const branches: Array<{ branch: ConversationBranch; depth: number }> = []

  function collectBranches(messages: Message[], depth: number) {
    for (const message of messages) {
      if (message.branches) {
        for (const branch of message.branches) {
          branches.push({ branch, depth })
          collectBranches(branch.messages, depth + 1)
        }
      }
    }
  }

  collectBranches(chat.messages, 0)
  return branches
}

/**
 * Delete a branch
 */
export function deleteBranch(chat: Chat, branchId: string): Chat {
  const updatedMessages = deleteBranchFromMessages(chat.messages, branchId)

  // If the deleted branch was in the current path, return to main
  const currentBranchPath = chat.currentBranchPath || []
  const newBranchPath = currentBranchPath.includes(branchId)
    ? []
    : currentBranchPath

  return {
    ...chat,
    messages: updatedMessages,
    currentBranchPath: newBranchPath,
    updatedAt: Date.now(),
  }
}

// Helper functions

function findBranch(chat: Chat, branchId: string): ConversationBranch | null {
  return findBranchInMessages(chat.messages, branchId)
}

function findBranchInMessages(messages: Message[], branchId: string): ConversationBranch | null {
  for (const message of messages) {
    if (message.branches) {
      for (const branch of message.branches) {
        if (branch.id === branchId) {
          return branch
        }
        const found = findBranchInMessages(branch.messages, branchId)
        if (found) return found
      }
    }
  }
  return null
}

function buildBranchPath(chat: Chat, branchId: string): string[] {
  const path: string[] = []

  function findPath(messages: Message[], targetId: string): boolean {
    for (const message of messages) {
      if (message.branches) {
        for (const branch of message.branches) {
          if (branch.id === targetId) {
            path.push(targetId)
            return true
          }
          if (findPath(branch.messages, targetId)) {
            path.unshift(branch.id)
            return true
          }
        }
      }
    }
    return false
  }

  findPath(chat.messages, branchId)
  return path
}

function addMessageToBranchInMessages(
  messages: Message[],
  branchId: string,
  message: Message
): Message[] {
  return messages.map((msg) => {
    if (msg.branches) {
      const updatedBranches = msg.branches.map((branch) => {
        if (branch.id === branchId) {
          return {
            ...branch,
            messages: [...branch.messages, message],
          }
        }
        return {
          ...branch,
          messages: addMessageToBranchInMessages(branch.messages, branchId, message),
        }
      })
      return { ...msg, branches: updatedBranches }
    }
    return msg
  })
}

function deleteBranchFromMessages(messages: Message[], branchId: string): Message[] {
  return messages.map((msg) => {
    if (msg.branches) {
      const updatedBranches = msg.branches
        .filter((branch) => branch.id !== branchId)
        .map((branch) => ({
          ...branch,
          messages: deleteBranchFromMessages(branch.messages, branchId),
        }))
      return { ...msg, branches: updatedBranches.length > 0 ? updatedBranches : undefined }
    }
    return msg
  })
}
