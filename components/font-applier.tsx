"use client"

import { useEffect } from "react"
import { useApp } from "@/contexts/app-context"

/**
 * Applies font family and font size settings to the document
 */
export function FontApplier() {
  const { settings } = useApp()

  useEffect(() => {
    const fontFamily = settings.fontFamily || "inter"
    const fontSize = settings.fontSize || "medium"

    // Apply font family via data-font attribute
    document.documentElement.setAttribute("data-font", fontFamily)

    // Apply font size via data-font-size attribute
    document.documentElement.setAttribute("data-font-size", fontSize)

    console.log("[FontApplier] Applied font settings:", { fontFamily, fontSize })
  }, [settings.fontFamily, settings.fontSize])

  return null
}
