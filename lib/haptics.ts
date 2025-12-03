/**
 * Haptic Feedback Utility
 * Provides vibration feedback for touch interactions on mobile devices
 * Works with PWA and native mobile browsers
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

const PATTERNS = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [15, 50, 15, 50, 15],
  error: [30, 100, 30],
  selection: [5],
} as const

class HapticsService {
  private isSupported = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'vibrate' in navigator
    }
  }

  /**
   * Trigger haptic feedback with a pattern
   */
  trigger(pattern: HapticPattern = 'light') {
    if (!this.isSupported) return

    try {
      navigator.vibrate(PATTERNS[pattern])
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * Trigger custom vibration pattern
   * @param pattern Array of vibration durations in ms (vibrate, pause, vibrate, ...)
   * Example: [100, 50, 100] = vibrate 100ms, pause 50ms, vibrate 100ms
   */
  custom(pattern: number[]) {
    if (!this.isSupported) return

    try {
      navigator.vibrate(pattern)
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * Cancel any ongoing vibration
   */
  cancel() {
    if (!this.isSupported) return

    try {
      navigator.vibrate(0)
    } catch (error) {
      console.warn('Haptic cancel failed:', error)
    }
  }

  /**
   * Check if haptics are supported
   */
  supported(): boolean {
    return this.isSupported
  }
}

export const haptics = new HapticsService()
