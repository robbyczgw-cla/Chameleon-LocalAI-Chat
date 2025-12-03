"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { SimpleChatApp } from "@/components/simple-chat-app"
import { ModeSelectionDialog } from "@/components/mode-selection-dialog"

interface ModeWrapperProps {
  children: React.ReactNode
}

export function ModeWrapper({ children }: ModeWrapperProps) {
  const { settings, updateSettings, isLoading, chats, user } = useApp()
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [hasCheckedModeSelection, setHasCheckedModeSelection] = useState(false)

  // Check if user needs to select a mode (first-time user)
  // This effect re-runs when user/chats change, so if we detect an existing user later, we hide the dialog
  useEffect(() => {
    if (isLoading) return

    const modeSelected = localStorage.getItem("chameleon-mode-selected")

    // Already selected - never show dialog
    if (modeSelected) {
      setShowModeSelection(false)
      setHasCheckedModeSelection(true)
      return
    }

    // Check if this is an existing user using MULTIPLE methods:
    // 1. User is authenticated (has Supabase session)
    // 2. User has chats in context (from Supabase sync)
    // 3. User has any localStorage data
    const isExistingUser =
      user !== null ||
      chats.length > 0 ||
      localStorage.getItem("chameleon-chats") ||
      localStorage.getItem("chameleon-settings") ||
      localStorage.getItem("chameleon-folders") ||
      localStorage.getItem("chameleon-api-keys")

    if (isExistingUser) {
      // Existing user - mark mode as selected and HIDE dialog (even if it was shown)
      localStorage.setItem("chameleon-mode-selected", "true")
      setShowModeSelection(false)
      setHasCheckedModeSelection(true)
      return
    }

    // Truly new user - show mode selection
    setShowModeSelection(true)
    setHasCheckedModeSelection(true)
  }, [isLoading, user, chats.length])

  // Handle mode selection
  const handleModeSelection = (simpleMode: boolean) => {
    // Update settings with the selected mode
    updateSettings({ simpleMode })

    // If Simple Mode selected, the onboarding will be triggered by SimpleChatApp
    // For Advanced Mode, no onboarding needed

    setShowModeSelection(false)
  }

  // Don't render during loading to prevent flash
  if (isLoading || !hasCheckedModeSelection) {
    return null
  }

  // Show mode selection dialog for first-time users
  if (showModeSelection) {
    return (
      <ModeSelectionDialog
        open={showModeSelection}
        onSelectMode={handleModeSelection}
      />
    )
  }

  // Simple Mode: Clean, persona-focused interface
  if (settings.simpleMode) {
    return <SimpleChatApp />
  }

  // Advanced Mode: Full-featured interface (default)
  return <>{children}</>
}
