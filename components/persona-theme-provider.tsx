"use client"

import { useApp } from "@/contexts/app-context"
import { PERSONAS } from "@/lib/personas"
import { PersonasStorageService } from "@/lib/personas-storage"

export interface PersonaTheme {
  id: string
  gradient: string
  userMessageBg: string
  assistantMessageBg: string
  accentColor: string
}

/**
 * Maps persona colors to chat theme colors
 * Each persona has a unique gradient that's applied throughout the chat UI
 */
export function getPersonaTheme(personaId: string): PersonaTheme {
  // Check built-in personas first
  const builtInPersona = PERSONAS.find((p) => p.id === personaId)
  if (builtInPersona) {
    return {
      id: personaId,
      gradient: builtInPersona.color,
      userMessageBg: getColorFromGradient(builtInPersona.color, "start"),
      assistantMessageBg: getColorFromGradient(builtInPersona.color, "end"),
      accentColor: builtInPersona.color.split(" ")[0], // First color in gradient
    }
  }

  // Check custom personas
  const allPersonas = PersonasStorageService.getAllPersonas(PERSONAS)
  const customPersona = allPersonas.find((p) => p.id === personaId)
  if (customPersona) {
    return {
      id: personaId,
      gradient: customPersona.color,
      userMessageBg: getColorFromGradient(customPersona.color, "start"),
      assistantMessageBg: getColorFromGradient(customPersona.color, "end"),
      accentColor: customPersona.color.split(" ")[0],
    }
  }

  // Fallback to Cami (friendly chameleon) theme
  return {
    id: "friendly",
    gradient: "from-green-500 to-blue-500",
    userMessageBg: "bg-green-500",
    assistantMessageBg: "bg-blue-100 dark:bg-blue-950",
    accentColor: "text-green-500",
  }
}

/**
 * Extracts the start or end color from a Tailwind gradient
 */
function getColorFromGradient(gradient: string, position: "start" | "end"): string {
  const colors = gradient.split(" ")
  if (position === "start") {
    // Extract from "from-blue-500" format
    const fromColor = colors.find((c) => c.startsWith("from-"))
    return fromColor ? `bg-${fromColor.replace("from-", "")}` : "bg-blue-500"
  } else {
    // Extract from "to-purple-600" format
    const toColor = colors.find((c) => c.startsWith("to-"))
    return toColor
      ? `bg-${toColor.replace("to-", "")}`
      : "bg-purple-600 dark:bg-purple-900"
  }
}

/**
 * React hook to get current persona theme
 */
export function usePersonaTheme(): PersonaTheme {
  const { settings } = useApp()

  // Try to extract persona from system prompt or use default
  // For now, we'll look for the active persona in the chat
  // You can extend this to track active persona explicitly
  const personaId = localStorage.getItem("activePersonaId") || "friendly"

  return getPersonaTheme(personaId)
}

/**
 * Provider component that wraps the chat
 * Applies persona theme via CSS variables
 */
export function PersonaThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePersonaTheme()

  return (
    <div
      style={{
        "--persona-gradient": theme.gradient,
        "--persona-user-bg": theme.userMessageBg,
        "--persona-assistant-bg": theme.assistantMessageBg,
        "--persona-accent": theme.accentColor,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
