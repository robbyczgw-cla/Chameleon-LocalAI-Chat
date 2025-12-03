"use client"

import { cn } from "@/lib/utils"
import { Brain, Search, Loader2, Sparkles, Check } from "lucide-react"

export type StreamingPhase = "thinking" | "searching" | "reasoning" | "generating" | "complete"

export interface StreamingDetails {
  phase: StreamingPhase
  action?: string
  reasoningContent?: string
  reasoningTokens?: number
  searchQuery?: string
  searchResults?: number
  tokenCount?: number
  tokensPerSecond?: number
}

interface StreamingIndicatorProps {
  details: StreamingDetails
  compact?: boolean
  showTokenCount?: boolean
  showReasoningPreview?: boolean
  className?: string
}

const phaseConfig: Record<StreamingPhase, { icon: typeof Loader2; label: string; color: string }> = {
  thinking: {
    icon: Loader2,
    label: "Processing...",
    color: "text-blue-500",
  },
  searching: {
    icon: Search,
    label: "Searching the web...",
    color: "text-green-500",
  },
  reasoning: {
    icon: Brain,
    label: "Extended thinking...",
    color: "text-amber-500",
  },
  generating: {
    icon: Sparkles,
    label: "Generating response...",
    color: "text-purple-500",
  },
  complete: {
    icon: Check,
    label: "Complete",
    color: "text-emerald-500",
  },
}

export function StreamingIndicator({
  details,
  compact = false,
  showTokenCount = true,
  showReasoningPreview = false,
  className,
}: StreamingIndicatorProps) {
  const { phase, action, reasoningContent, reasoningTokens, searchQuery, tokenCount, tokensPerSecond } = details
  const config = phaseConfig[phase]
  const Icon = config.icon

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Icon
          className={cn(
            "h-4 w-4",
            config.color,
            phase !== "complete" && "animate-spin"
          )}
        />
        <span className="text-muted-foreground">{action || config.label}</span>
        {showTokenCount && tokenCount && tokenCount > 0 && (
          <span className="text-xs text-muted-foreground/70">
            {tokenCount} tokens
            {tokensPerSecond ? ` (${tokensPerSecond.toFixed(0)}/s)` : ""}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2 animate-in fade-in slide-in-from-bottom-2",
        className
      )}
    >
      {/* Phase header */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "p-1.5 rounded-md",
            phase === "thinking" && "bg-blue-500/10",
            phase === "searching" && "bg-green-500/10",
            phase === "reasoning" && "bg-amber-500/10",
            phase === "generating" && "bg-purple-500/10",
            phase === "complete" && "bg-emerald-500/10"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              config.color,
              phase !== "complete" && phase !== "reasoning" && "animate-spin",
              phase === "reasoning" && "animate-pulse"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", config.color)}>
            {action || config.label}
          </p>
          {phase === "searching" && searchQuery && (
            <p className="text-xs text-muted-foreground truncate">
              Query: "{searchQuery}"
            </p>
          )}
        </div>
        {showTokenCount && (
          <div className="text-right text-xs text-muted-foreground">
            {phase === "reasoning" && reasoningTokens && (
              <span>{reasoningTokens} thinking tokens</span>
            )}
            {phase === "generating" && tokenCount && (
              <span>
                {tokenCount} tokens
                {tokensPerSecond ? ` @ ${tokensPerSecond.toFixed(0)}/s` : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Reasoning preview */}
      {showReasoningPreview && phase === "reasoning" && reasoningContent && (
        <div className="pl-8">
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 max-h-20 overflow-y-auto">
            <p className="line-clamp-3 whitespace-pre-wrap">{reasoningContent}</p>
          </div>
        </div>
      )}

      {/* Progress indicator for generating phase */}
      {phase === "generating" && (
        <div className="pl-8">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple typing indicator for inline use
 */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

/**
 * Phase badge for message headers
 */
export function StreamingPhaseBadge({
  phase,
  className,
}: {
  phase: StreamingPhase
  className?: string
}) {
  const config = phaseConfig[phase]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        phase === "thinking" && "bg-blue-500/10 text-blue-500",
        phase === "searching" && "bg-green-500/10 text-green-500",
        phase === "reasoning" && "bg-amber-500/10 text-amber-500",
        phase === "generating" && "bg-purple-500/10 text-purple-500",
        phase === "complete" && "bg-emerald-500/10 text-emerald-500",
        className
      )}
    >
      <Icon className={cn("h-3 w-3", phase !== "complete" && "animate-spin")} />
      <span>{config.label}</span>
    </div>
  )
}
