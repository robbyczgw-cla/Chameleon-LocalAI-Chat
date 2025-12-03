"use client"

import { useRef, useCallback, forwardRef } from "react"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'selection' | false
}

/**
 * Button with Material-like ripple effect and haptic feedback
 * Use this for important interactive elements that need native feel
 */
export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ children, className, rippleColor, hapticFeedback = 'selection', onClick, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null)

    const createRipple = useCallback((event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      const button = buttonRef.current || (ref as any)?.current
      if (!button) return

      // Remove existing ripples
      const existingRipples = button.querySelectorAll('.ripple')
      existingRipples.forEach(ripple => ripple.remove())

      // Get click/touch position
      const rect = button.getBoundingClientRect()
      let x: number, y: number

      if ('touches' in event) {
        x = event.touches[0].clientX - rect.left
        y = event.touches[0].clientY - rect.top
      } else {
        x = event.clientX - rect.left
        y = event.clientY - rect.top
      }

      // Calculate ripple size (should cover the whole button)
      const size = Math.max(rect.width, rect.height) * 2

      // Create ripple element
      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${x - size / 2}px`
      ripple.style.top = `${y - size / 2}px`

      if (rippleColor) {
        ripple.style.background = rippleColor
      }

      button.appendChild(ripple)

      // Trigger haptic feedback
      if (hapticFeedback) {
        haptics.trigger(hapticFeedback)
      }

      // Remove ripple after animation
      ripple.addEventListener('animationend', () => {
        ripple.remove()
      })
    }, [ref, rippleColor, hapticFeedback])

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e)
      onClick?.(e)
    }, [createRipple, onClick])

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
      createRipple(e)
    }, [createRipple])

    return (
      <button
        ref={buttonRef}
        className={cn("ripple-container", className)}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        {...props}
      >
        {children}
      </button>
    )
  }
)

RippleButton.displayName = 'RippleButton'

/**
 * HOC to add ripple effect to any component
 */
export function withRipple<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    rippleColor?: string
    hapticFeedback?: 'light' | 'medium' | 'heavy' | 'selection' | false
  }
) {
  const { rippleColor, hapticFeedback = 'selection' } = options || {}

  return function RippleWrapper(props: P & { className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null)

    const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
      const container = containerRef.current
      if (!container) return

      const existingRipples = container.querySelectorAll('.ripple')
      existingRipples.forEach(ripple => ripple.remove())

      const rect = container.getBoundingClientRect()
      let x: number, y: number

      if ('touches' in event) {
        x = event.touches[0].clientX - rect.left
        y = event.touches[0].clientY - rect.top
      } else {
        x = event.clientX - rect.left
        y = event.clientY - rect.top
      }

      const size = Math.max(rect.width, rect.height) * 2

      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${x - size / 2}px`
      ripple.style.top = `${y - size / 2}px`

      if (rippleColor) {
        ripple.style.background = rippleColor
      }

      container.appendChild(ripple)

      if (hapticFeedback) {
        haptics.trigger(hapticFeedback)
      }

      ripple.addEventListener('animationend', () => {
        ripple.remove()
      })
    }, [])

    return (
      <div
        ref={containerRef}
        className={cn("ripple-container", props.className)}
        onClick={createRipple}
        onTouchStart={createRipple}
      >
        <WrappedComponent {...props} />
      </div>
    )
  }
}
