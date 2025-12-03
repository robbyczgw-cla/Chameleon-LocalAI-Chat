"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
  disabled?: boolean
  threshold?: number // Pull distance to trigger refresh (default: 80)
  resistance?: number // Resistance factor (default: 2.5)
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
  threshold = 80,
  resistance = 2.5,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return

    const container = containerRef.current
    if (!container) return

    // Only enable pull-to-refresh when scrolled to top
    if (container.scrollTop > 0) return

    startYRef.current = e.touches[0].clientY
    currentYRef.current = e.touches[0].clientY
    setIsPulling(true)
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return

    const container = containerRef.current
    if (!container) return

    // Only allow pull when at top
    if (container.scrollTop > 0) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

    currentYRef.current = e.touches[0].clientY
    const delta = currentYRef.current - startYRef.current

    if (delta > 0) {
      // Prevent default scroll when pulling down
      e.preventDefault()

      // Apply resistance - pull gets harder as you pull more
      const resistedDelta = delta / resistance
      setPullDistance(Math.min(resistedDelta, threshold * 1.5))

      // Haptic feedback at threshold
      if (resistedDelta >= threshold && pullDistance < threshold) {
        haptics.trigger('medium')
      }
    }
  }, [isPulling, disabled, isRefreshing, threshold, resistance, pullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return

    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true)
      haptics.trigger('success')

      try {
        await onRefresh()
      } catch (error) {
        console.error('[PullToRefresh] Refresh failed:', error)
        haptics.trigger('error')
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Reset
      setPullDistance(0)
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Use passive: false for touchmove to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 180

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto overscroll-none", className)}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-200",
          "flex items-center justify-center"
        )}
        style={{
          top: Math.max(pullDistance - 40, -40),
          opacity: progress,
        }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-background/95 backdrop-blur-lg",
            "border-2 border-primary/30 shadow-lg",
            "flex items-center justify-center",
            isRefreshing && "animate-pulse"
          )}
        >
          <RefreshCw
            className={cn(
              "w-5 h-5 text-primary transition-transform",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
