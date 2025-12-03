"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/contexts/app-context"
import { contextWindowService, type CompressionResult } from "@/lib/context-window-service"
import { streamChatMessage } from "@/lib/openrouter"
import { cn } from "@/lib/utils"
import { Shrink, Loader2, Check, AlertTriangle, Sparkles, FileText } from "lucide-react"

interface ContextCompressionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContextCompressionDialog({ open, onOpenChange }: ContextCompressionDialogProps) {
  const { chats, currentChatId, setChats, settings } = useApp()
  const [keepLastN, setKeepLastN] = useState([6])
  const [isCompressing, setIsCompressing] = useState(false)
  const [summary, setSummary] = useState("")
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)
  const [autoCompress, setAutoCompress] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentChat = chats.find(c => c.id === currentChatId)
  const messages = currentChat?.messages || []

  // Calculate what will be summarized
  const systemMessage = messages.find(m => m.role === "system")
  const recentMessages = messages.slice(-keepLastN[0])
  const messagesToSummarize = messages.filter(
    m => m.role !== "system" && !recentMessages.includes(m)
  )

  const messagesForCalc = messages.map(m => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content
  }))
  const currentUsage = contextWindowService.getContextUsage(messagesForCalc, settings.selectedModel)

  const handleGenerateSummary = async () => {
    if (messagesToSummarize.length === 0) {
      setError("No messages to summarize. Try reducing the number of recent messages to keep.")
      return
    }

    setIsCompressing(true)
    setError(null)
    setSummary("")

    try {
      const compressionPrompt = contextWindowService.getCompressionPrompt(
        messagesForCalc,
        keepLastN[0]
      )

      if (!compressionPrompt) {
        setError("Not enough messages to compress")
        setIsCompressing(false)
        return
      }

      // Use grok-4.1-fast for compression (fast, cheap, 2M context)
      const compressionModel = "x-ai/grok-4.1-fast"
      let generatedSummary = ""

      await streamChatMessage(
        [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise, accurate summaries of conversations. Focus on preserving important context, decisions, and key information."
          },
          {
            role: "user",
            content: compressionPrompt
          }
        ],
        compressionModel,
        (chunk) => {
          generatedSummary += chunk
          setSummary(generatedSummary)
        },
        {
          temperature: 0.3, // Low temperature for consistency
          maxTokens: 2000,
          apiKey: settings.openRouterApiKey
        }
      )

      // Calculate compression stats
      const compressedMessages = contextWindowService.createCompressedMessages(
        messagesForCalc,
        generatedSummary,
        keepLastN[0]
      )
      const stats = contextWindowService.calculateCompressionStats(
        messagesForCalc,
        compressedMessages
      )
      setCompressionResult(stats)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary")
    } finally {
      setIsCompressing(false)
    }
  }

  const handleApplyCompression = () => {
    if (!summary || !currentChat) return

    const compressedMessages = contextWindowService.createCompressedMessages(
      messagesForCalc,
      summary,
      keepLastN[0]
    )

    // Convert back to chat message format
    const newMessages = compressedMessages.map(m => ({
      id: crypto.randomUUID(),
      role: m.role,
      content: m.content,
      timestamp: Date.now()
    }))

    // Update chat
    const updatedChats = chats.map(c => {
      if (c.id === currentChatId) {
        return {
          ...c,
          messages: newMessages
        }
      }
      return c
    })

    setChats(updatedChats)
    onOpenChange(false)

    // Reset state
    setSummary("")
    setCompressionResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shrink className="h-5 w-5 text-primary" />
            Compress Conversation
          </DialogTitle>
          <DialogDescription>
            Summarize older messages to free up context space while preserving important information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Current Context Usage</span>
              <span className={cn(
                "font-bold",
                contextWindowService.getStatusColor(currentUsage.status)
              )}>
                {Math.round(currentUsage.percentage * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  currentUsage.status === "safe" && "bg-green-500",
                  currentUsage.status === "warning" && "bg-yellow-500",
                  currentUsage.status === "danger" && "bg-orange-500",
                  currentUsage.status === "critical" && "bg-red-500"
                )}
                style={{ width: `${Math.min(currentUsage.percentage * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentUsage.usedTokens.toLocaleString()} tokens used</span>
              <span>{messages.length} messages</span>
            </div>
          </div>

          {/* Keep Recent Messages Slider */}
          <div className="space-y-3">
            <Label>Keep Recent Messages: {keepLastN[0]}</Label>
            <Slider
              value={keepLastN}
              onValueChange={setKeepLastN}
              min={2}
              max={Math.min(20, messages.length - 1)}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              The last {keepLastN[0]} messages will be kept intact.
              {messagesToSummarize.length > 0 && (
                <> {messagesToSummarize.length} messages will be summarized.</>
              )}
            </p>
          </div>

          {/* Preview of what will be compressed */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Messages to Summarize
            </Label>
            <div className="max-h-32 overflow-y-auto p-2 bg-muted/50 rounded-md text-xs space-y-1">
              {messagesToSummarize.length === 0 ? (
                <p className="text-muted-foreground">No messages to summarize</p>
              ) : (
                messagesToSummarize.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <span className={cn(
                      "font-medium uppercase text-[10px] px-1 rounded",
                      m.role === "user" ? "bg-blue-500/20 text-blue-600" : "bg-green-500/20 text-green-600"
                    )}>
                      {m.role}
                    </span>
                    <span className="truncate text-muted-foreground">{m.content.slice(0, 100)}...</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Generate Summary Button */}
          {!summary && (
            <Button
              onClick={handleGenerateSummary}
              disabled={isCompressing || messagesToSummarize.length === 0}
              className="w-full gap-2"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Summary
                </>
              )}
            </Button>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 text-red-600 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Generated Summary */}
          {summary && (
            <div className="space-y-3">
              <Label>Generated Summary</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={6}
                className="text-sm"
                placeholder="Summary will appear here..."
              />

              {/* Compression Stats */}
              {compressionResult && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted/50 rounded-md text-center">
                    <div className="text-muted-foreground">Before</div>
                    <div className="font-mono font-bold">{compressionResult.originalTokens.toLocaleString()}</div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md text-center">
                    <div className="text-muted-foreground">After</div>
                    <div className="font-mono font-bold text-green-600">{compressionResult.compressedTokens.toLocaleString()}</div>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-md text-center">
                    <div className="text-muted-foreground">Saved</div>
                    <div className="font-mono font-bold text-green-600">{compressionResult.savedTokens.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSummary("")
                    setCompressionResult(null)
                  }}
                  className="flex-1"
                >
                  Regenerate
                </Button>
                <Button
                  onClick={handleApplyCompression}
                  className="flex-1 gap-2"
                >
                  <Check className="h-4 w-4" />
                  Apply Compression
                </Button>
              </div>
            </div>
          )}

          {/* Auto-compress Option */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="auto-compress">Auto-compress at 90%</Label>
              <p className="text-xs text-muted-foreground">
                Automatically compress when context reaches 90% capacity
              </p>
            </div>
            <Switch
              id="auto-compress"
              checked={autoCompress}
              onCheckedChange={setAutoCompress}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
