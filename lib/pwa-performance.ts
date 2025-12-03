/**
 * PWA Performance Utilities
 * Native-like feel optimizations for PWA on mobile devices
 */

// ============================================================================
// View Transitions API
// ============================================================================

/**
 * Check if View Transitions API is supported
 */
export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}

/**
 * Execute a DOM update with View Transition animation
 * Falls back to instant update if not supported
 */
export async function withViewTransition(
  updateCallback: () => void | Promise<void>,
  options?: {
    skipTransition?: boolean
    onTransitionReady?: () => void
    onTransitionFinished?: () => void
  }
): Promise<void> {
  const { skipTransition = false, onTransitionReady, onTransitionFinished } = options || {}

  if (skipTransition || !supportsViewTransitions()) {
    await updateCallback()
    return
  }

  try {
    const transition = (document as any).startViewTransition(async () => {
      await updateCallback()
    })

    if (onTransitionReady) {
      transition.ready.then(onTransitionReady)
    }

    if (onTransitionFinished) {
      transition.finished.then(onTransitionFinished)
    }

    await transition.finished
  } catch (error) {
    // Fallback if transition fails
    console.warn('[PWA] View transition failed, falling back:', error)
    await updateCallback()
  }
}

// ============================================================================
// Touch Optimizations
// ============================================================================

/**
 * Remove 300ms touch delay on an element
 * Call this on interactive elements for instant response
 */
export function enableFastTap(element: HTMLElement): void {
  element.style.touchAction = 'manipulation'
  element.style.webkitTapHighlightColor = 'transparent'
  element.style.userSelect = 'none'
  ;(element.style as any).webkitUserSelect = 'none'
}

/**
 * Apply fast tap to all interactive elements in container
 */
export function enableFastTapAll(container: HTMLElement = document.body): void {
  const interactiveElements = container.querySelectorAll(
    'button, a, [role="button"], input, textarea, select, [tabindex]'
  )
  interactiveElements.forEach((el) => {
    enableFastTap(el as HTMLElement)
  })
}

// ============================================================================
// Scroll Performance
// ============================================================================

/**
 * Enable smooth momentum scrolling on element
 */
export function enableMomentumScroll(element: HTMLElement): void {
  element.style.overflowY = 'auto'
  element.style.overflowX = 'hidden'
  ;(element.style as any).webkitOverflowScrolling = 'touch'
  element.style.scrollBehavior = 'smooth'
}

/**
 * Enable overscroll bounce effect (iOS-like)
 */
export function enableOverscrollBounce(element: HTMLElement): void {
  element.style.overscrollBehaviorY = 'contain'
}

/**
 * Disable overscroll completely (prevents pull-to-refresh browser default)
 */
export function disableOverscroll(element: HTMLElement): void {
  element.style.overscrollBehavior = 'none'
}

// ============================================================================
// Animation Performance
// ============================================================================

/**
 * Hint browser about upcoming animation for GPU optimization
 */
export function willAnimate(element: HTMLElement, properties: string[] = ['transform', 'opacity']): void {
  element.style.willChange = properties.join(', ')
}

/**
 * Remove will-change hint after animation (prevent memory leak)
 */
export function doneAnimating(element: HTMLElement): void {
  element.style.willChange = 'auto'
}

/**
 * Force GPU layer creation for smoother animations
 */
export function promoteToGPU(element: HTMLElement): void {
  element.style.transform = 'translateZ(0)'
  ;(element.style as any).backfaceVisibility = 'hidden'
  ;(element.style as any).perspective = '1000px'
}

/**
 * Request high refresh rate (120Hz) if available
 */
export function requestHighRefreshRate(): void {
  if (typeof window === 'undefined') return

  // Some browsers support requesting high refresh rate
  if ('requestHighRefreshRate' in screen) {
    (screen as any).requestHighRefreshRate?.()
  }
}

// ============================================================================
// Frame Rate Utilities
// ============================================================================

/**
 * Run animation at optimal frame rate
 */
export function animateAtOptimalFPS(
  callback: (timestamp: number) => boolean,
  targetFPS: number = 60
): () => void {
  let running = true
  let lastFrame = 0
  const frameInterval = 1000 / targetFPS

  const animate = (timestamp: number) => {
    if (!running) return

    const elapsed = timestamp - lastFrame

    if (elapsed >= frameInterval) {
      lastFrame = timestamp - (elapsed % frameInterval)
      const shouldContinue = callback(timestamp)
      if (!shouldContinue) {
        running = false
        return
      }
    }

    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)

  return () => {
    running = false
  }
}

/**
 * Debounce scroll events for performance
 */
export function optimizedScroll(
  callback: () => void,
  wait: number = 16
): () => void {
  let timeout: NodeJS.Timeout | null = null
  let lastRun = 0

  const handler = () => {
    const now = Date.now()
    const timeSinceLastRun = now - lastRun

    if (timeSinceLastRun >= wait) {
      lastRun = now
      callback()
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastRun = Date.now()
        timeout = null
        callback()
      }, wait - timeSinceLastRun)
    }
  }

  window.addEventListener('scroll', handler, { passive: true })

  return () => {
    window.removeEventListener('scroll', handler)
    if (timeout) clearTimeout(timeout)
  }
}

// ============================================================================
// Preloading & Prefetching
// ============================================================================

/**
 * Prefetch a route for instant navigation
 */
export function prefetchRoute(href: string): void {
  if (typeof document === 'undefined') return

  // Check if already prefetched
  const existing = document.querySelector(`link[rel="prefetch"][href="${href}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  document.head.appendChild(link)
}

/**
 * Preload critical resources
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch'
): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as

  if (as === 'font') {
    link.crossOrigin = 'anonymous'
  }

  document.head.appendChild(link)
}

// ============================================================================
// Network-Aware Loading
// ============================================================================

interface NetworkInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
  saveData: boolean
  downlink: number
}

/**
 * Get network connection info
 */
export function getNetworkInfo(): NetworkInfo | null {
  if (typeof navigator === 'undefined') return null

  const connection = (navigator as any).connection ||
                     (navigator as any).mozConnection ||
                     (navigator as any).webkitConnection

  if (!connection) return null

  return {
    effectiveType: connection.effectiveType || '4g',
    saveData: connection.saveData || false,
    downlink: connection.downlink || 10
  }
}

/**
 * Check if we should load heavy resources
 */
export function shouldLoadHeavyResources(): boolean {
  const network = getNetworkInfo()

  if (!network) return true // Assume good connection
  if (network.saveData) return false
  if (network.effectiveType === '2g' || network.effectiveType === 'slow-2g') return false

  return true
}

// ============================================================================
// Idle Time Utilities
// ============================================================================

/**
 * Run non-critical work during browser idle time
 */
export function runWhenIdle(callback: () => void, timeout: number = 2000): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 1)
  }
}

// ============================================================================
// Memory Management
// ============================================================================

/**
 * Check if device has low memory
 */
export function isLowMemoryDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  const memory = (navigator as any).deviceMemory
  return memory !== undefined && memory < 4
}

/**
 * Get estimated available memory (GB)
 */
export function getDeviceMemory(): number {
  if (typeof navigator === 'undefined') return 8
  return (navigator as any).deviceMemory || 8
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize all PWA performance optimizations
 */
export function initPWAPerformance(): void {
  if (typeof window === 'undefined') return

  // Request high refresh rate
  requestHighRefreshRate()

  // Enable fast taps globally after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enableFastTapAll()
    })
  } else {
    enableFastTapAll()
  }

  // Re-apply fast tap when new elements are added (debounced to avoid performance issues)
  let pendingElements: HTMLElement[] = []
  let debounceTimeout: NodeJS.Timeout | null = null

  const processPendingElements = () => {
    if (pendingElements.length === 0) return
    // Process in batches to avoid blocking
    const batch = pendingElements.splice(0, 50)
    batch.forEach(el => enableFastTap(el))
    if (pendingElements.length > 0) {
      // Schedule next batch
      requestAnimationFrame(() => processPendingElements())
    }
  }

  const observer = new MutationObserver((mutations) => {
    // Collect elements but don't process immediately
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Only collect interactive elements, not all elements
          const interactive = node.querySelectorAll(
            'button, a, [role="button"], input, textarea, select'
          )
          interactive.forEach((el) => {
            pendingElements.push(el as HTMLElement)
          })
          // Also check if the node itself is interactive
          if (node.matches?.('button, a, [role="button"], input, textarea, select')) {
            pendingElements.push(node)
          }
        }
      })
    })

    // Debounce processing
    if (debounceTimeout) clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => {
      processPendingElements()
    }, 100) // 100ms debounce
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  console.log('[PWA] Performance optimizations initialized')
}
