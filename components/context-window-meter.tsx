"use client"

import { useState, useMemo } from "react"
import { useApp } from "@/contexts/app-context"
import { contextWindowService, type ContextUsage } from "@/lib/context-window-service"
import { cn } from "@/lib/utils"
import { Gauge, AlertTriangle, Zap, Shrink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContextWindowMeterProps {
  onCompress?: () => void
  compact?: boolean
  className?: string
}

export function ContextWindowMeter({ onCompress, compact = false, className }: ContextWindowMeterProps) {
  const { chats, currentChatId, settings } = useApp()
  const [isExpanded, setIsExpanded] = useState(false)

  const currentChat = chats.find(c => c.id === currentChatId)
  const messages = currentChat?.messages || []
  const model = settings.selectedModel

  const usage: ContextUsage = useMemo(() => {
    const messagesForCalc = messages.map(m => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content
    }))
    return contextWindowService.getContextUsage(messagesForCalc, model)
  }, [messages, model])

  const contextWindow = contextWindowService.getContextWindow(model)
  const formattedContextWindow = contextWindowService.formatContextWindow(contextWindow)
  const percentageDisplay = Math.round(usage.percentage * 100)

  // Get gradient colors based on status
  const getGradientColors = () => {
    switch (usage.status) {
      case "safe":
        return "from-green-500 to-emerald-500"
      case "warning":
        return "from-yellow-500 to-amber-500"
      case "danger":
        return "from-orange-500 to-red-500"
      case "critical":
        return "from-red-500 to-rose-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  // Compact version for chat input area
  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-1.5 text-xs cursor-help", className)}
        title={`Context: ${usage.usedTokens.toLocaleString()} / ${usage.maxTokens.toLocaleString()} tokens (${formattedContextWindow} max)`}
      >
        <Gauge className={cn("h-3.5 w-3.5", contextWindowService.getStatusColor(usage.status))} />
        <div className="flex items-center gap-1">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-300", getGradientColors())}
              style={{ width: `${Math.min(usage.percentage * 100, 100)}%` }}
            />
          </div>
          <span className={cn("text-[10px] font-medium", contextWindowService.getStatusColor(usage.status))}>
            {percentageDisplay}%
          </span>
        </div>
        {usage.status === "critical" && (
          <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
        )}
      </div>
    )
  }

  // Full version
  return (
    <div className={cn(
      "rounded-lg border bg-card p-3 space-y-2",
      usage.status === "critical" && "border-red-500/50 bg-red-500/5",
      usage.status === "danger" && "border-orange-500/50 bg-orange-500/5",
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Gauge className={cn("h-4 w-4", contextWindowService.getStatusColor(usage.status))} />
          <span className="text-sm font-medium">Context Window</span>
          {usage.status !== "safe" && (
            <AlertTriangle className={cn(
              "h-3.5 w-3.5",
              usage.status === "critical" ? "text-red-500 animate-pulse" : "text-orange-500"
            )} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-bold",
            contextWindowService.getStatusColor(usage.status)
          )}>
            {percentageDisplay}%
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
            getGradientColors()
          )}
          style={{ width: `${Math.min(usage.percentage * 100, 100)}%` }}
        />
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{usage.usedTokens.toLocaleString()} used</span>
        <span>{usage.remainingTokens.toLocaleString()} remaining</span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t">
          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="text-muted-foreground">Max Context</div>
              <div className="font-mono font-medium">{formattedContextWindow}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="text-muted-foreground">Messages</div>
              <div className="font-mono font-medium">{messages.length}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="text-muted-foreground">Avg/Message</div>
              <div className="font-mono font-medium">
                {messages.length > 0
                  ? Math.round(usage.usedTokens / messages.length).toLocaleString()
                  : 0} tokens
              </div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="text-muted-foreground">Output Reserve</div>
              <div className="font-mono font-medium">4,096 tokens</div>
            </div>
          </div>

          {/* Model Info */}
          <div className="text-xs p-2 bg-muted/30 rounded-md">
            <span className="text-muted-foreground">Model: </span>
            <span className="font-medium">{model}</span>
          </div>

          {/* Compression Button */}
          {contextWindowService.shouldCompress(usage) && onCompress && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCompress}
              className="w-full gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
            >
              <Shrink className="h-4 w-4" />
              Compress Conversation
            </Button>
          )}

          {/* Status Message */}
          <div className={cn(
            "text-xs p-2 rounded-md",
            usage.status === "safe" && "bg-green-500/10 text-green-600",
            usage.status === "warning" && "bg-yellow-500/10 text-yellow-600",
            usage.status === "danger" && "bg-orange-500/10 text-orange-600",
            usage.status === "critical" && "bg-red-500/10 text-red-600"
          )}>
            {usage.status === "safe" && (
              <>✓ Plenty of context space available</>
            )}
            {usage.status === "warning" && (
              <>Context usage is moderate. Long conversations may need compression soon.</>
            )}
            {usage.status === "danger" && (
              <>⚠️ Running low on context. Consider compressing the conversation.</>
            )}
            {usage.status === "critical" && (
              <>🚨 Context nearly full! Compress now to continue the conversation.</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Mini inline version for status bars
export function ContextWindowMini({ className }: { className?: string }) {
  const { chats, currentChatId, settings } = useApp()

  const currentChat = chats.find(c => c.id === currentChatId)
  const messages = currentChat?.messages || []
  const model = settings.selectedModel

  const usage = useMemo(() => {
    const messagesForCalc = messages.map(m => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content
    }))
    return contextWindowService.getContextUsage(messagesForCalc, model)
  }, [messages, model])

  const percentageDisplay = Math.round(usage.percentage * 100)

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-help",
        usage.status === "safe" && "bg-green-500/10 text-green-600",
        usage.status === "warning" && "bg-yellow-500/10 text-yellow-600",
        usage.status === "danger" && "bg-orange-500/10 text-orange-600",
        usage.status === "critical" && "bg-red-500/10 text-red-600 animate-pulse",
        className
      )}
      title={`${usage.usedTokens.toLocaleString()} / ${usage.maxTokens.toLocaleString()} tokens`}
    >
      <Zap className="h-3 w-3" />
      <span className="font-medium">{percentageDisplay}%</span>
    </div>
  )
}
