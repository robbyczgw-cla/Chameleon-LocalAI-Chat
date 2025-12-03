"use client"

import { useState, useCallback, useEffect } from "react"

interface ScreenshotOptions {
  type?: "fullscreen" | "selection" | "window"
  format?: "png" | "jpg"
  delay?: number
}

interface ScreenshotResult {
  success: boolean
  image?: string // data URL
  format?: string
  size?: number
  error?: string
  cancelled?: boolean
}

interface UseScreenshotReturn {
  takeScreenshot: (options?: ScreenshotOptions) => Promise<ScreenshotResult>
  isCapturing: boolean
  isAvailable: boolean
  error: string | null
}

/**
 * Hook for capturing screenshots on macOS
 * Uses the native screencapture command via API route
 */
export function useScreenshot(): UseScreenshotReturn {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check availability on mount
  useEffect(() => {
    checkAvailability()
  }, [])

  const checkAvailability = async () => {
    try {
      const response = await fetch("/api/screenshot")
      if (response.ok) {
        const data = await response.json()
        setIsAvailable(data.available)
      }
    } catch {
      setIsAvailable(false)
    }
  }

  const takeScreenshot = useCallback(async (options?: ScreenshotOptions): Promise<ScreenshotResult> => {
    if (!isAvailable) {
      return {
        success: false,
        error: "Screenshot not available (macOS only)",
      }
    }

    setIsCapturing(true)
    setError(null)

    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options || { type: "selection" }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Screenshot failed")
        return {
          success: false,
          error: data.error,
          cancelled: data.cancelled,
        }
      }

      return {
        success: true,
        image: data.image,
        format: data.format,
        size: data.size,
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Screenshot failed"
      setError(errorMsg)
      return {
        success: false,
        error: errorMsg,
      }
    } finally {
      setIsCapturing(false)
    }
  }, [isAvailable])

  return {
    takeScreenshot,
    isCapturing,
    isAvailable,
    error,
  }
}
