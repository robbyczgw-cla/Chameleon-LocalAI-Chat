"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/contexts/app-context"
import { estimateTokens, calculateCost } from "@/lib/token-tracker"
import { Zap } from "lucide-react"

interface TokenCounterPreviewProps {
  input: string
}

export function TokenCounterPreview({ input }: TokenCounterPreviewProps) {
  const { settings } = useApp()
  const [estimatedTokens, setEstimatedTokens] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(0)

  useEffect(() => {
    if (!input.trim()) {
      setEstimatedTokens(0)
      setEstimatedCost(0)
      return
    }

    // Estimate input tokens
    const tokens = estimateTokens(input)
    setEstimatedTokens(tokens)

    // Estimate cost using current model
    const cost = calculateCost(tokens, 500, settings.selectedModel) // Assume ~500 output tokens
    setEstimatedCost(cost)
  }, [input, settings.selectedModel])

  if (!input.trim() || estimatedTokens === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 bg-muted/50 rounded-md">
      <Zap className="h-3.5 w-3.5 text-amber-500" />
      <span>
        <strong>{estimatedTokens.toLocaleString()}</strong> tokens
      </span>
      {estimatedCost > 0 && (
        <>
          <span>•</span>
          <span>≈ ${estimatedCost.toFixed(4)}</span>
        </>
      )}
      <span className="text-xs text-muted-foreground/70">
        (estimate for input)
      </span>
    </div>
  )
}
