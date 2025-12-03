"use client"

import { useCallback } from 'react'
import { withViewTransition, supportsViewTransitions } from '@/lib/pwa-performance'

/**
 * Hook for using View Transitions API with fallback
 */
export function useViewTransition() {
  const isSupported = typeof document !== 'undefined' && supportsViewTransitions()

  const startTransition = useCallback(
    async (
      updateCallback: () => void | Promise<void>,
      options?: {
        skipTransition?: boolean
      }
    ) => {
      await withViewTransition(updateCallback, options)
    },
    []
  )

  /**
   * Navigate with transition animation
   * Useful for changing views, opening modals, etc.
   */
  const navigateWithTransition = useCallback(
    async (callback: () => void | Promise<void>) => {
      await startTransition(callback)
    },
    [startTransition]
  )

  /**
   * Slide forward transition (for forward navigation)
   */
  const slideForward = useCallback(
    async (callback: () => void | Promise<void>) => {
      if (!isSupported) {
        await callback()
        return
      }

      // Set transition name before starting
      document.documentElement.style.setProperty('view-transition-name', 'slide-forward')

      await startTransition(callback)

      // Clean up
      document.documentElement.style.removeProperty('view-transition-name')
    },
    [isSupported, startTransition]
  )

  /**
   * Slide back transition (for back navigation)
   */
  const slideBack = useCallback(
    async (callback: () => void | Promise<void>) => {
      if (!isSupported) {
        await callback()
        return
      }

      document.documentElement.style.setProperty('view-transition-name', 'slide-back')

      await startTransition(callback)

      document.documentElement.style.removeProperty('view-transition-name')
    },
    [isSupported, startTransition]
  )

  return {
    isSupported,
    startTransition,
    navigateWithTransition,
    slideForward,
    slideBack,
  }
}
