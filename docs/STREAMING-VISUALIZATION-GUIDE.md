# Step-by-Step Streaming Visualization Guide

This guide explains how to implement a real-time step-by-step visualization system for LLM chat applications, showing users what the AI is doing during response generation.

## Overview

The streaming visualization system shows users the current phase of AI processing:
- **Thinking** - Analyzing the request
- **Searching** - Web search (when AI triggers tool calls)
- **Responding** - Generating the final response

Advanced mode adds detailed sub-steps, timing, and progress tracking.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Route     │────▶│  Stream Parser   │────▶│   UI Component  │
│ (phase events)  │     │ (openrouter.ts)  │     │ (MessageStatus) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
   Emits phase           Calls callbacks           Renders steps
   SSE events            onPhaseChange()           with animations
```

---

## 1. Backend: Emit Phase Events (API Route)

The API route emits Server-Sent Events (SSE) for each phase change.

### File: `app/api/chat/route.ts`

```typescript
async function handleStreamingRequest(...) {
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  ;(async () => {
    try {
      let hasStartedResponding = false

      // 1. Send initial thinking phase immediately
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            choices: [{ delta: { phase: "thinking" } }],
          })}\n\n`
        )
      )

      // ... make API call to OpenRouter ...

      // 2. When tool calls detected, send searching phase
      if (hasToolCalls && accumulatedToolCalls.length > 0) {
        const toolArgs = parseToolArguments(accumulatedToolCalls[0]?.function.arguments || "{}")
        const toolName = accumulatedToolCalls[0]?.function.name || "unknown"

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              choices: [{ delta: {
                phase: "searching",
                searching: true,
                toolName: toolName,
                searchQuery: toolArgs.query
              } }],
            })}\n\n`
          )
        )

        // Execute tool call...
      }

      // 3. When content starts streaming, send responding phase
      if (delta?.content && !hasToolCalls) {
        if (!hasStartedResponding) {
          hasStartedResponding = true
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: { phase: "responding" } }],
              })}\n\n`
            )
          )
        }
        // Forward actual content
        await writer.write(encoder.encode(line + "\n"))
      }

      // 4. Send done phase at the end
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            choices: [{ delta: { phase: "done" } }],
          })}\n\n`
        )
      )

    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

---

## 2. Stream Parser: Handle Phase Events

Update the streaming client to parse phase events and call callbacks.

### File: `lib/openrouter.ts`

```typescript
export async function streamChatMessage(
  messages: ChatMessage[],
  model: string,
  onChunk: (content: string) => void,
  options: {
    // ... existing options ...

    // NEW: Phase tracking callbacks
    onPhaseChange?: (phase: "thinking" | "searching" | "tool_use" | "responding" | "done") => void
    onToolUse?: (toolName: string) => void
    onSearchQuery?: (query: string) => void
  } = {},
): Promise<void> {
  const {
    // ... destructure existing options ...
    onPhaseChange,
    onToolUse,
    onSearchQuery,
  } = options

  // ... fetch and stream ...

  // In the stream parsing loop:
  try {
    const parsed = JSON.parse(data)
    const delta = parsed.choices?.[0]?.delta

    // Handle phase change events
    if (delta?.phase && onPhaseChange) {
      console.log("[Stream] Phase change:", delta.phase)
      onPhaseChange(delta.phase)
    }

    // Handle tool use events
    if (delta?.toolName && onToolUse) {
      console.log("[Stream] Tool use:", delta.toolName)
      onToolUse(delta.toolName)
    }

    // Handle search query for display
    if (delta?.searchQuery && onSearchQuery) {
      try {
        const parsed = JSON.parse(delta.searchQuery)
        onSearchQuery(parsed.query || delta.searchQuery)
      } catch {
        onSearchQuery(delta.searchQuery)
      }
    }

    // Handle actual content
    if (delta?.content) {
      onChunk(delta.content)
    }
  } catch (e) {
    // Ignore parse errors
  }
}
```

---

## 3. App Context: Track Phase State

Add global state to track the current streaming phase.

### File: `contexts/app-context.tsx`

```typescript
import type { StreamingPhase } from "@/components/message-status"

interface AppContextType {
  // ... existing props ...

  // Streaming status for step-by-step visualization
  streamingPhase: StreamingPhase
  setStreamingPhase: (phase: StreamingPhase) => void
  currentTool: string | null
  setCurrentTool: (tool: string | null) => void
  searchQuery: string | null
  setSearchQuery: (query: string | null) => void
}

export function AppProvider({ children }: { children: ReactNode }) {
  // ... existing state ...

  // Streaming status state
  const [streamingPhase, setStreamingPhase] = useState<StreamingPhase>("idle")
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string | null>(null)

  // Reset streaming state when stopping generation
  const stopChatGeneration = () => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort()
      chatAbortControllerRef.current = null
      setIsChatLoading(false)
      // Reset streaming status
      setStreamingPhase("idle")
      setCurrentTool(null)
      setSearchQuery(null)
    }
  }

  return (
    <AppContext.Provider value={{
      // ... existing values ...
      streamingPhase,
      setStreamingPhase,
      currentTool,
      setCurrentTool,
      searchQuery,
      setSearchQuery,
    }}>
      {children}
    </AppContext.Provider>
  )
}
```

---

## 4. Chat Input: Connect Callbacks

Update the chat input to pass phase callbacks when streaming.

### File: `components/chat-input.tsx` or `components/simple-chat-input.tsx`

```typescript
export function ChatInput() {
  const {
    // ... existing ...
    setStreamingPhase,
    setCurrentTool,
    setSearchQuery,
  } = useApp()

  const handleSubmit = async () => {
    // ... validation ...

    setIsChatLoading(true)
    // CRITICAL: Set initial phase immediately, don't wait for API
    setStreamingPhase("thinking")

    try {
      await streamChatMessage(messages, model, onChunk, {
        // ... existing options ...

        // Phase tracking callbacks
        onPhaseChange: (phase) => {
          console.log("Phase change:", phase)
          setStreamingPhase(phase)
        },
        onToolUse: (toolName) => {
          console.log("Tool use:", toolName)
          setCurrentTool(toolName)
        },
        onSearchQuery: (query) => {
          console.log("Search query:", query)
          setSearchQuery(query)
        },
      })

    } catch (error) {
      // ... error handling ...
    } finally {
      setIsChatLoading(false)
      // Reset streaming state
      setStreamingPhase("idle")
      setCurrentTool(null)
      setSearchQuery(null)
    }
  }
}
```

---

## 5. UI Component: MessageStatus

Create the visualization component.

### File: `components/message-status.tsx`

```typescript
"use client"

import { memo, useState, useEffect } from "react"
import { Loader2, Brain, MessageSquare, CheckCircle2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export type StreamingPhase = "idle" | "thinking" | "searching" | "tool_use" | "responding" | "done"

export interface MessageStatusProps {
  currentPhase: StreamingPhase
  currentTool?: string
  searchQuery?: string
  language?: "en" | "de" | "es"
}

export const MessageStatus = memo(function MessageStatus({
  currentPhase,
  currentTool,
  searchQuery,
  language = "en",
}: MessageStatusProps) {
  // Don't render if idle or done
  if (currentPhase === "idle" || currentPhase === "done") {
    return null
  }

  const getStepStatus = (stepPhase: StreamingPhase): "active" | "completed" | "pending" => {
    const phaseOrder: StreamingPhase[] = ["thinking", "searching", "tool_use", "responding"]
    const currentIndex = phaseOrder.indexOf(currentPhase)
    const stepIndex = phaseOrder.indexOf(stepPhase)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "active"
    return "pending"
  }

  // Build steps dynamically
  const steps = [
    { id: "thinking", label: "Thinking", icon: <Brain className="w-4 h-4" /> },
  ]

  // Add searching step only if search is happening
  if (currentPhase === "searching" || searchQuery) {
    steps.push({
      id: "searching",
      label: searchQuery ? `Searching: "${searchQuery.slice(0, 30)}..."` : "Searching",
      icon: <Globe className="w-4 h-4" />,
    })
  }

  steps.push({
    id: "responding",
    label: "Generating response",
    icon: <MessageSquare className="w-4 h-4" />,
  })

  return (
    <div className="space-y-1.5 py-2">
      {steps.map((step, idx) => {
        const status = getStepStatus(step.id as StreamingPhase)

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
              status === "active" && "bg-primary/10 border border-primary/20",
              status === "completed" && "opacity-60",
              status === "pending" && "opacity-40"
            )}
          >
            {/* Icon */}
            <div className="relative flex-shrink-0">
              {status === "active" ? (
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  <div className="relative p-1.5 rounded-full bg-primary/20 text-primary">
                    {step.icon}
                  </div>
                </div>
              ) : status === "completed" ? (
                <div className="p-1.5 rounded-full bg-green-500/20 text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1.5 rounded-full bg-muted text-muted-foreground">
                  {step.icon}
                </div>
              )}
            </div>

            {/* Label */}
            <span className={cn(
              "text-sm font-medium",
              status === "active" && "text-primary",
              status === "completed" && "text-muted-foreground",
              status === "pending" && "text-muted-foreground/60"
            )}>
              {step.label}
            </span>

            {/* Spinner for active */}
            {status === "active" && (
              <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />
            )}
          </div>
        )
      })}
    </div>
  )
})
```

---

## 6. Integrate into Chat Messages

Use the component in your chat loading indicator.

### File: `components/chat-messages.tsx`

```typescript
import { MessageStatus, MessageStatusVerbose } from "@/components/message-status"

export function ChatMessages() {
  const { isChatLoading, streamingPhase, currentTool, searchQuery, settings } = useApp()

  return (
    <div>
      {/* Messages list... */}

      {/* Loading indicator with step visualization */}
      {isChatLoading && (
        <div className="flex gap-4">
          <Avatar>{/* ... */}</Avatar>
          <div className="bg-card rounded-lg p-4 min-w-[280px]">
            <MessageStatus
              currentPhase={streamingPhase}
              currentTool={currentTool || undefined}
              searchQuery={searchQuery || undefined}
              language={settings.language}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 7. Verbose Mode (Advanced)

For power users, create an expanded version with:
- Elapsed time counter
- Expandable/collapsible steps
- Sub-steps within each phase
- Progress bar

See `MessageStatusVerbose` component in `components/message-status.tsx` for the full implementation.

```typescript
// Use verbose version for advanced mode
{isAdvancedMode ? (
  <MessageStatusVerbose
    currentPhase={streamingPhase}
    currentTool={currentTool}
    searchQuery={searchQuery}
    language={settings.language}
    modelName={currentModelName}
  />
) : (
  <MessageStatus
    currentPhase={streamingPhase}
    currentTool={currentTool}
    searchQuery={searchQuery}
    language={settings.language}
  />
)}
```

---

## Key Implementation Notes

### 1. Set Phase Immediately
```typescript
// DON'T wait for API to send phase event
setIsChatLoading(true)
setStreamingPhase("thinking") // Set immediately!
```

### 2. Reset State in Finally Block
```typescript
} finally {
  setIsChatLoading(false)
  setStreamingPhase("idle")
  setCurrentTool(null)
  setSearchQuery(null)
}
```

### 3. Handle MessageStatus Returning Null
The component returns `null` when phase is `"idle"` or `"done"`. Make sure to set phase to `"thinking"` before showing the loading indicator.

### 4. Phase Event Format
```typescript
// SSE format for phase events
`data: ${JSON.stringify({
  choices: [{ delta: { phase: "thinking" } }],
})}\n\n`
```

---

## Phase Flow Diagram

```
User sends message
        │
        ▼
┌───────────────┐
│   thinking    │ ◀── Immediate (before API call)
└───────┬───────┘
        │
        ▼ (API receives request)
┌───────────────┐
│   thinking    │ ◀── API sends phase event
└───────┬───────┘
        │
        ▼ (Tool call detected?)
   ┌────┴────┐
   │  Yes    │ No
   ▼         │
┌──────────┐ │
│searching │ │
└────┬─────┘ │
     │       │
     ▼       │
(Execute     │
 tool)       │
     │       │
     └───────┤
             │
             ▼ (First content arrives)
      ┌─────────────┐
      │ responding  │
      └──────┬──────┘
             │
             ▼ (Stream complete)
      ┌─────────────┐
      │    done     │
      └─────────────┘
```

---

## 8. Streaming History on Completed Messages

For advanced mode, you can show the streaming history at the top of completed assistant messages. This gives users visibility into how the response was generated.

### Types

Add the `StreamingHistoryEntry` type and include it in messages:

```typescript
// types/index.ts
export interface StreamingHistoryEntry {
  phase: "thinking" | "searching" | "tool_use" | "responding" | "done"
  timestamp: number
  detail?: string // e.g., search query, tool name
  duration?: number // time spent in this phase (ms)
}

export interface Message {
  // ... existing fields ...
  streamingHistory?: StreamingHistoryEntry[] // History of streaming phases
}
```

### Context Functions

Add history tracking functions to your context:

```typescript
// contexts/app-context.tsx
const streamingHistoryRef = useRef<StreamingHistoryEntry[]>([])

const addStreamingHistoryEntry = (entry: Omit<StreamingHistoryEntry, "timestamp">) => {
  const now = Date.now()
  // Calculate duration from previous entry
  const prevEntry = streamingHistoryRef.current[streamingHistoryRef.current.length - 1]
  if (prevEntry && !prevEntry.duration) {
    prevEntry.duration = now - prevEntry.timestamp
  }
  streamingHistoryRef.current.push({ ...entry, timestamp: now })
}

const clearStreamingHistory = () => {
  streamingHistoryRef.current = []
}

const getStreamingHistory = () => {
  // Calculate final duration if needed
  const history = [...streamingHistoryRef.current]
  if (history.length > 0) {
    const lastEntry = history[history.length - 1]
    if (!lastEntry.duration) {
      lastEntry.duration = Date.now() - lastEntry.timestamp
    }
  }
  return history
}
```

### Track History in Chat Input

```typescript
// At start of request
setStreamingPhase("thinking")
clearStreamingHistory()
addStreamingHistoryEntry({ phase: "thinking" })

// In phase callbacks
onPhaseChange: (phase) => {
  setStreamingPhase(phase)
  addStreamingHistoryEntry({ phase })
},
onToolUse: (toolName) => {
  setCurrentTool(toolName)
  addStreamingHistoryEntry({ phase: "tool_use", detail: toolName })
},
onSearchQuery: (query) => {
  setSearchQuery(query)
  addStreamingHistoryEntry({ phase: "searching", detail: query })
},

// Save to final message
const streamingHistoryForMessage = getStreamingHistory()
const finalMessage: Message = {
  // ... other fields ...
  ...(streamingHistoryForMessage.length > 0 ? { streamingHistory: streamingHistoryForMessage } : {}),
}
```

### Display Component

Use `StreamingHistoryDisplay` from `message-status.tsx`:

```typescript
import { StreamingHistoryDisplay } from "@/components/message-status"

// In your message rendering (advanced mode only)
{isAdvancedMode && message.streamingHistory && message.streamingHistory.length > 0 && (
  <div className="mb-3">
    <StreamingHistoryDisplay
      history={message.streamingHistory}
      language={settings.language}
      collapsed={!expandedStreamingHistory.has(message.id)}
      onToggle={() => toggleStreamingHistory(message.id)}
    />
  </div>
)}
```

The `StreamingHistoryDisplay` component shows:
- **Collapsed**: Summary with total time and phase badges
- **Expanded**: Full list of phases with durations and a time distribution bar

---

## Summary

| Component | Purpose |
|-----------|---------|
| `app/api/chat/route.ts` | Emit phase SSE events |
| `lib/openrouter.ts` | Parse events, call callbacks |
| `contexts/app-context.tsx` | Global phase state + history tracking |
| `components/*-chat-input.tsx` | Connect callbacks, track history |
| `components/message-status.tsx` | Render visualization + history display |
| `components/chat-messages.tsx` | Display during loading + show history on completed messages |
