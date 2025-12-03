"use client"

import { useEffect, useRef } from "react"
import { initPWAPerformance, runWhenIdle, shouldLoadHeavyResources } from "@/lib/pwa-performance"

export function PWARegister() {
  const lastVisibleTime = useRef(Date.now())
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Initialize PWA performance optimizations (fast tap, etc.)
    initPWAPerformance()

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    // Helper to send messages to service worker
    const sendToSW = (message: any) => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message)
      }
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[PWA] Service Worker registered:", registration.scope)
        swRegistration.current = registration

        // Check for updates every 5 minutes
        const updateInterval = setInterval(() => {
          registration.update().catch((error) => {
            console.log("[PWA] Update check failed:", error.message)
          })
        }, 300000)

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[PWA] New version available - activating immediately")
                try {
                  navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" })
                } catch (e) {
                  console.warn("[PWA] Could not message SW:", e)
                }
              }
            })
          }
        })

        return () => clearInterval(updateInterval)
      })
      .catch((error) => {
        console.log("[PWA] Service Worker registration failed:", error.message)
      })

    // Listen for controller change
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[PWA] Controller changed - new service worker is now active")
    })

    // ========================================
    // CRITICAL: App Resume Detection
    // This fixes the "page not found" issue on Android
    // ========================================

    // Track when app becomes visible/hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now()
        const timeSinceHidden = now - lastVisibleTime.current

        // If app was hidden for more than 10 seconds, notify SW
        if (timeSinceHidden > 10000) {
          console.log(`[PWA] App resumed after ${Math.round(timeSinceHidden / 1000)}s - notifying SW`)
          sendToSW({ type: "APP_RESUMED" })

          // Prefetch current page to ensure it's cached
          const currentPath = window.location.pathname
          sendToSW({ type: "PRECACHE_ROUTE", url: currentPath })
        }
      } else {
        // Record when app was hidden
        lastVisibleTime.current = Date.now()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // ========================================
    // Heartbeat to keep SW aware of activity
    // ========================================
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        sendToSW({ type: "HEARTBEAT" })
      }
    }, 30000) // Every 30 seconds

    // ========================================
    // Keep-Alive to prevent tab suspension
    // ========================================
    console.log("[PWA] Activating keep-alive to prevent tab suspension")

    const keepAliveInterval = setInterval(() => {
      // Lightweight heartbeat - just the interval existing prevents suspension
    }, 30000)

    // Use Page Lifecycle API to prevent freezing
    if ("onfreeze" in document) {
      document.addEventListener("freeze", (e) => {
        console.log("[PWA] Browser tried to freeze tab - preventing")
        e.preventDefault()
      })
    }

    // Handle page restoration from bfcache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log("[PWA] Page restored from bfcache")
        // Notify SW that we're back
        sendToSW({ type: "APP_RESUMED" })
        sendToSW({ type: "PRECACHE_ROUTE", url: window.location.pathname })
      }
    }

    window.addEventListener("pageshow", handlePageShow)

    // ========================================
    // Precache current route on first load
    // ========================================
    runWhenIdle(() => {
      // Precache current page for instant reload
      sendToSW({ type: "PRECACHE_ROUTE", url: window.location.pathname })

      // Log network-aware loading decision
      const loadHeavy = shouldLoadHeavyResources()
      console.log(`[PWA] Network-aware loading: ${loadHeavy ? "full quality" : "lite mode"}`)

      // Performance mark
      if ("performance" in window && "mark" in performance) {
        performance.mark("pwa-optimizations-complete")
      }
    })

    // ========================================
    // App Install Prompt
    // ========================================
    let deferredPrompt: any = null

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] Install prompt triggered")
      e.preventDefault()
      deferredPrompt = e
      window.dispatchEvent(new CustomEvent("pwa-install-available"))
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    const handleAppInstalled = () => {
      console.log("[PWA] App installed successfully")
      deferredPrompt = null
    }

    window.addEventListener("appinstalled", handleAppInstalled)

    // Expose install function globally
    ;(window as any).installPWA = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log("[PWA] User choice:", outcome)
        deferredPrompt = null
      }
    }

    // ========================================
    // Cleanup
    // ========================================
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pageshow", handlePageShow)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      clearInterval(heartbeatInterval)
      clearInterval(keepAliveInterval)
    }
  }, [])

  return null
}
