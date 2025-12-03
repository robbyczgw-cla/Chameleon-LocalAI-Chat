"use client"

import { useEffect, useRef } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

interface MathRendererProps {
  math: string
  displayMode?: boolean
  className?: string
}

export function MathRenderer({ math, displayMode = false, className }: MathRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: false,
          strict: false,
        })
      } catch (err) {
        console.error("KaTeX rendering error:", err)
        containerRef.current.textContent = `[Math Error: ${math}]`
      }
    }
  }, [math, displayMode])

  return (
    <span
      ref={containerRef}
      className={displayMode ? `block my-4 overflow-x-auto text-center ${className || ""}` : `inline ${className || ""}`}
    />
  )
}
