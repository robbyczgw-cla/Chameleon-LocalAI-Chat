# Enhanced Streaming Visualization System Documentation

## Overview

This document provides comprehensive documentation for the Chameleon AI Chat Local-First Edition's real-time streaming visualization system. The system shows users exactly what the AI is doing at every moment with full transparency into tool usage, search operations, and reasoning processes.

**Local-First Design:**
- Works with both local LM Studio models and OpenRouter cloud models
- Offline-capable visualization (local models work without internet)
- All streaming state stored locally (no cloud dependency)

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [Type Definitions](#type-definitions)
4. [Server-Side Implementation](#server-side-implementation)
5. [Client-Side Implementation](#client-side-implementation)
6. [UI Components](#ui-components)
7. [State Management](#state-management)
8. [Advanced Features](#advanced-features)
9. [Best Practices](#best-practices)
10. [Code Examples](#code-examples)

---

## Architecture Overview

The streaming visualization system consists of three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  - MessageStatusVerbose (real-time display)                 │
│  - StreamingHistoryDisplay (completed messages)             │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│  - currentStreamingDetails (live state)                     │
│  - streamingHistory (recorded phases)                       │
│  - streamingPhase (current phase)                           │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Streaming Event Pipeline                    │
│  Server → Network → Stream Parser → Callbacks → State       │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Progressive Enhancement**: Basic streaming works without detailed info, enhanced details are optional
2. **Mode Separation**: Advanced mode shows all details, simple mode shows minimal info
3. **Real-time Updates**: State updates immediately as events arrive
4. **Historical Recording**: All phases are recorded for post-completion review
5. **Type Safety**: Full TypeScript typing for all streaming data

---

## Data Flow

### 1. Server Streaming Flow

```
User Request → API Route → LLM Provider → Stream Response
                    ↓
            Event Generation
                    ↓
    { phase, toolName, toolArguments, action, ... }
                    ↓
            SSE Stream to Client
```

### 2. Client Processing Flow

```
SSE Stream → Stream Parser → Event Handler → State Update → UI Render
                                    ↓
                            History Recording
                                    ↓
                        StreamingHistoryEntry[]
```

### 3. Data Transformation

```
Raw API Response → Enhanced Event Data → State Objects → UI Props
```

---

## Type Definitions

### Core Types

```typescript
/**
 * Streaming history entry for step-by-step visualization
 * Enhanced to show detailed, real-time information like Claude.ai
 */
export interface StreamingHistoryEntry {
  phase: "thinking" | "searching" | "tool_use" | "responding" | "done"
  timestamp: number
  detail?: string // e.g., search query, tool name (deprecated in favor of structured fields)
  description?: string // Human-readable description of what happened in this phase
  duration?: number // time spent in this phase (ms)

  // Enhanced detailed information (like Claude.ai/Claude Code)
  toolName?: string // Specific tool being used (e.g., "web_search", "read_file", "write_file")
  toolArguments?: Record<string, any> // Actual arguments passed to the tool
  action?: string // Specific action being performed (e.g., "Reading file: src/app.tsx")
  files?: string[] // File paths being accessed/modified
  searchProvider?: string // Search provider (tavily, serper, exa)
  searchParameters?: Record<string, any> // Full search parameters
  resultCount?: number // Number of results returned
}
```

### Streaming Phases

```typescript
export type StreamingPhase = "idle" | "thinking" | "searching" | "tool_use" | "responding" | "done"
```

### Message Props

```typescript
export interface MessageStatusProps {
  currentPhase: StreamingPhase
  currentTool?: string
  searchQuery?: string
  reasoningVisible?: boolean
  language?: "en" | "de" | "es"
  verbose?: boolean
  modelName?: string
  streamingDetails?: {
    phase?: string
    toolName?: string
    toolArguments?: Record<string, any>
    searchProvider?: string
    searchParameters?: Record<string, any>
    action?: string
    resultCount?: number
    resultSummary?: string
  }
}
```

---

## Server-Side Implementation

### 1. API Route Structure

```typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  // ... setup code ...

  return handleStreamingRequest(
    openRouterBody,
    apiKey,
    searchApiKey,
    searchProvider,
    searchSettings,
    toolsEnabled
  )
}
```

### 2. Enhanced Event Generation

```typescript
async function handleStreamingRequest(
  openRouterBody: Record<string, any>,
  apiKey: string,
  searchApiKey: string | undefined,
  searchProvider: "tavily" | "serper" | "exa",
  searchSettings: Record<string, any>,
  toolsEnabled: boolean
) {
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  // Send initial thinking phase
  await writer.write(
    encoder.encode(
      `data: ${JSON.stringify({
        choices: [{ delta: { phase: "thinking" } }],
      })}\n\n`
    )
  )

  // ... process stream ...

  // When tool calls are detected
  if (hasToolCalls && accumulatedToolCalls.length > 0) {
    const toolArgs = parseToolArguments(accumulatedToolCalls[0]?.function.arguments || "{}")
    const toolName = accumulatedToolCalls[0]?.function.name || "unknown"

    // Send enhanced detailed information
    await writer.write(
      encoder.encode(
        `data: ${JSON.stringify({
          choices: [{ delta: {
            phase: "searching",
            searching: true,
            toolName: toolName,
            searchQuery: toolArgs.query,
            // Enhanced fields
            toolArguments: toolArgs,
            searchProvider: searchProvider,
            searchParameters: searchSettings,
            action: `Searching ${searchProvider}: "${toolArgs.query}"`
          } }],
        })}\n\n`
      )
    )

    // ... execute tool ...

    // Send completion with results
    await writer.write(
      encoder.encode(
        `data: ${JSON.stringify({
          choices: [{ delta: {
            searchComplete: true,
            searchResultCount: toolResults.length,
            resultSummary: `Found ${toolResults.length} result${toolResults.length !== 1 ? 's' : ''} from ${searchProvider}`
          } }],
        })}\n\n`
      )
    )
  }

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

### 3. Event Structure

Each SSE event should follow this structure:

```typescript
// Phase change event
{
  choices: [{
    delta: {
      phase: "thinking" | "searching" | "tool_use" | "responding" | "done"
    }
  }]
}

// Tool usage event with full details
{
  choices: [{
    delta: {
      phase: "searching",
      toolName: "web_search",
      toolArguments: {
        query: "latest AI news",
        maxResults: 5,
        searchDepth: "basic"
      },
      searchProvider: "tavily",
      searchParameters: {
        includeImages: false,
        includeAnswer: true
      },
      action: "Searching tavily: \"latest AI news\"",
      searching: true,
      searchQuery: "latest AI news"
    }
  }]
}

// Completion event with results
{
  choices: [{
    delta: {
      searchComplete: true,
      searchResultCount: 5,
      resultSummary: "Found 5 results from tavily"
    }
  }]
}

// Content streaming
{
  choices: [{
    delta: {
      content: "Here are the latest..."
    }
  }]
}
```

---

## Client-Side Implementation

### 1. Stream Processing Function

```typescript
// lib/openrouter.ts
export async function streamChatMessage(
  messages: ChatMessage[],
  model: string,
  onChunk: (content: string) => void,
  options: {
    // ... other options ...
    onPhaseChange?: (phase: StreamingPhase) => void
    onToolUse?: (toolName: string) => void
    onSearchQuery?: (query: string) => void
    onStreamingDetails?: (details: {
      phase?: string
      toolName?: string
      toolArguments?: Record<string, any>
      searchProvider?: string
      searchParameters?: Record<string, any>
      action?: string
      resultCount?: number
      resultSummary?: string
    }) => void
  }
): Promise<void> {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6)
      if (data === "[DONE]") continue

      const parsed = JSON.parse(data)
      const delta = parsed.choices?.[0]?.delta

      // Handle phase changes
      if (delta?.phase && onPhaseChange) {
        onPhaseChange(delta.phase)
      }

      // Handle tool use
      if (delta?.toolName && onToolUse) {
        onToolUse(delta.toolName)
      }

      // Handle search query
      if (delta?.searchQuery && onSearchQuery) {
        onSearchQuery(delta.searchQuery)
      }

      // Handle enhanced streaming details
      if (onStreamingDetails && (
        delta?.toolArguments ||
        delta?.searchProvider ||
        delta?.action ||
        delta?.resultCount ||
        delta?.resultSummary
      )) {
        onStreamingDetails({
          phase: delta.phase,
          toolName: delta.toolName,
          toolArguments: delta.toolArguments,
          searchProvider: delta.searchProvider,
          searchParameters: delta.searchParameters,
          action: delta.action,
          resultCount: delta.resultCount || delta.searchResultCount,
          resultSummary: delta.resultSummary,
        })
      }

      // Handle content
      if (delta?.content) {
        onChunk(delta.content)
      }
    }
  }
}
```

### 2. Chat Input Integration

```typescript
// components/chat-input.tsx
await streamChatMessage(messages, model, onChunk, {
  // ... other options ...

  // Phase tracking
  onPhaseChange: (phase) => {
    setStreamingPhase(phase)
    addStreamingHistoryEntry({
      phase,
      description: getPhaseDescription(phase)
    })
  },

  // Tool tracking
  onToolUse: (toolName) => {
    setCurrentTool(toolName)
    addStreamingHistoryEntry({
      phase: "tool_use",
      toolName,
      description: getToolDescription(toolName)
    })
  },

  // Search tracking
  onSearchQuery: (query) => {
    setSearchQuery(query)
    addStreamingHistoryEntry({
      phase: "searching",
      detail: query,
      description: `Searching web for: "${query}"`
    })
  },

  // Enhanced streaming details for advanced mode
  onStreamingDetails: (details) => {
    setCurrentStreamingDetails(details)

    // Also add to streaming history with enhanced details
    if (details.phase) {
      addStreamingHistoryEntry({
        phase: details.phase as any,
        toolName: details.toolName,
        toolArguments: details.toolArguments,
        searchProvider: details.searchProvider,
        searchParameters: details.searchParameters,
        action: details.action,
        resultCount: details.resultCount,
        description: details.resultSummary || details.action
      })
    }
  },
})
```

---

## State Management

### 1. Context Structure

```typescript
// contexts/app-context.tsx
interface AppContextType {
  // Basic streaming state
  streamingPhase: StreamingPhase
  setStreamingPhase: (phase: StreamingPhase) => void
  currentTool: string | null
  setCurrentTool: (tool: string | null) => void
  searchQuery: string | null
  setSearchQuery: (query: string | null) => void

  // Enhanced streaming details (for advanced mode)
  currentStreamingDetails: Partial<StreamingHistoryEntry> | null
  setCurrentStreamingDetails: (details: Partial<StreamingHistoryEntry> | null) => void

  // Streaming history for completed messages
  streamingHistory: StreamingHistoryEntry[]
  addStreamingHistoryEntry: (entry: Omit<StreamingHistoryEntry, "timestamp">) => void
  clearStreamingHistory: () => void
  getStreamingHistory: () => StreamingHistoryEntry[]
}
```

### 2. State Implementation

```typescript
export function AppProvider({ children }: { children: ReactNode }) {
  // Streaming status for step-by-step visualization
  const [streamingPhase, setStreamingPhase] = useState<StreamingPhase>("idle")
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string | null>(null)

  // Enhanced streaming details for advanced mode visualization
  const [currentStreamingDetails, setCurrentStreamingDetails] =
    useState<Partial<StreamingHistoryEntry> | null>(null)

  // Streaming history for verbose display on completed messages
  const streamingHistoryRef = useRef<StreamingHistoryEntry[]>([])
  const streamingStartTimeRef = useRef<number>(0)

  const addStreamingHistoryEntry = (entry: Omit<StreamingHistoryEntry, "timestamp">) => {
    const now = Date.now()

    // Calculate duration from previous entry
    const prevEntry = streamingHistoryRef.current[streamingHistoryRef.current.length - 1]
    if (prevEntry && !prevEntry.duration) {
      prevEntry.duration = now - prevEntry.timestamp
    }

    streamingHistoryRef.current.push({
      ...entry,
      timestamp: now,
    })
  }

  const clearStreamingHistory = () => {
    streamingHistoryRef.current = []
    streamingStartTimeRef.current = Date.now()
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

  return (
    <AppContext.Provider value={{
      streamingPhase,
      setStreamingPhase,
      currentTool,
      setCurrentTool,
      searchQuery,
      setSearchQuery,
      currentStreamingDetails,
      setCurrentStreamingDetails,
      streamingHistory: streamingHistoryRef.current,
      addStreamingHistoryEntry,
      clearStreamingHistory,
      getStreamingHistory,
      // ... other context values ...
    }}>
      {children}
    </AppContext.Provider>
  )
}
```

### 3. Lifecycle Management

```typescript
// Starting a new message
const handleSubmit = async () => {
  // Clear previous history
  clearStreamingHistory()

  // Reset streaming state
  setStreamingPhase("thinking")
  setCurrentTool(null)
  setSearchQuery(null)
  setCurrentStreamingDetails(null)

  // Start streaming history
  addStreamingHistoryEntry({
    phase: "thinking",
    description: "Analyzing your message and planning response"
  })

  // ... start streaming ...
}

// Completing a message
const handleStreamComplete = () => {
  // Get final streaming history
  const streamingHistoryForMessage = getStreamingHistory()

  // Add to message object
  const finalMessage: Message = {
    // ... other message fields ...
    streamingHistory: streamingHistoryForMessage
  }

  // Reset streaming state
  setStreamingPhase("idle")
  setCurrentTool(null)
  setSearchQuery(null)
  setCurrentStreamingDetails(null)
}
```

---

## UI Components

### 1. MessageStatusVerbose (Real-Time Display)

```typescript
export const MessageStatusVerbose = memo(function MessageStatusVerbose({
  currentPhase,
  currentTool,
  searchQuery,
  reasoningVisible = false,
  language = "en",
  modelName,
  streamingDetails,
}: MessageStatusProps) {
  const elapsed = useElapsedTime(currentPhase !== "idle" && currentPhase !== "done")
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(["thinking"]))

  if (currentPhase === "idle" || currentPhase === "done") {
    return null
  }

  // Build steps based on current state
  const steps: Step[] = []

  // Always show thinking step
  steps.push({
    id: "thinking",
    type: "thinking",
    label: "Thinking",
    status: getStepStatus("thinking"),
    icon: <Brain className="w-4 h-4" />,
  })

  // Show searching step if searching
  if (currentPhase === "searching" || searchQuery) {
    steps.push({
      id: "searching",
      type: "searching",
      label: "Searching",
      status: getStepStatus("searching"),
      icon: <Globe className="w-4 h-4" />,
      detail: searchQuery,
    })
  }

  // Show responding step
  steps.push({
    id: "responding",
    type: "responding",
    label: "Generating Response",
    status: getStepStatus("responding"),
    icon: <MessageSquare className="w-4 h-4" />,
  })

  return (
    <div className="space-y-3">
      {/* Header with model and timer */}
      <div className="flex items-center justify-between text-xs">
        <span>{modelName}</span>
        <span>{formatTime(elapsed)}</span>
      </div>

      {/* Steps */}
      {steps.map((step) => {
        const isExpanded = expandedSteps.has(step.id)
        const isActive = step.status === "active"

        return (
          <div key={step.id} className="rounded-lg border">
            {/* Step header */}
            <button onClick={() => toggleStep(step.id)}>
              <div className="flex items-center gap-3">
                {/* Expand icon */}
                {isExpanded ? <ChevronDown /> : <ChevronRight />}

                {/* Status icon */}
                {isActive ? (
                  <div className="animate-ping">{step.icon}</div>
                ) : (
                  step.icon
                )}

                {/* Label */}
                <span>{step.label}</span>

                {/* Loading indicator */}
                {isActive && <Loader2 className="animate-spin" />}
              </div>
            </button>

            {/* Expanded content with enhanced details */}
            {isExpanded && streamingDetails && step.status === "active" && (
              <div className="space-y-2">
                {/* Current action */}
                {streamingDetails.action && (
                  <div className="p-2 rounded-md bg-primary/10">
                    <p className="text-xs font-medium">Current Action</p>
                    <p className="text-sm">{streamingDetails.action}</p>
                  </div>
                )}

                {/* Tool arguments */}
                {streamingDetails.toolArguments && (
                  <div className="p-2 rounded-md bg-orange-500/10">
                    <p className="text-xs font-medium">Tool Parameters</p>
                    {Object.entries(streamingDetails.toolArguments).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <span className="font-medium">{key}:</span>
                        <span>{JSON.stringify(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search provider */}
                {streamingDetails.searchProvider && (
                  <div className="p-2 rounded-md bg-purple-500/10">
                    <p className="text-xs font-medium">Search Provider</p>
                    <p className="text-sm capitalize">{streamingDetails.searchProvider}</p>
                  </div>
                )}

                {/* Result summary */}
                {streamingDetails.resultSummary && (
                  <div className="p-2 rounded-md bg-green-500/10">
                    <p className="text-xs font-medium">Result</p>
                    <p className="text-sm">{streamingDetails.resultSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{
            width: `${calculateProgress(steps)}%`
          }}
        />
      </div>
    </div>
  )
})
```

### 2. StreamingHistoryDisplay (Completed Messages)

```typescript
export const StreamingHistoryDisplay = memo(function StreamingHistoryDisplay({
  history,
  language = "en",
  collapsed = true,
  onToggle,
}: {
  history: StreamingHistoryEntry[]
  language?: "en" | "de" | "es"
  collapsed?: boolean
  onToggle?: () => void
}) {
  if (!history || history.length === 0) return null

  const totalDuration = history.reduce((sum, entry) => sum + (entry.duration || 0), 0)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Collapsible header */}
      <button onClick={onToggle} className="w-full p-3">
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight /> : <ChevronDown />}
          <span>Generated in {formatDuration(totalDuration)} ({history.length} steps)</span>
        </div>
      </button>

      {/* Expanded content */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          {history.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {/* Phase icon */}
              <div className="p-1.5 rounded-full">
                {getPhaseIcon(entry.phase)}
              </div>

              {/* Phase info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getPhaseLabel(entry.phase)}</span>

                  {/* Tool name badge */}
                  {entry.toolName && (
                    <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                      {entry.toolName}
                    </span>
                  )}

                  {/* Search provider badge */}
                  {entry.searchProvider && (
                    <span className="text-xs bg-purple-500/10 px-1.5 py-0.5 rounded">
                      {entry.searchProvider}
                    </span>
                  )}
                </div>

                {/* Action/description */}
                {(entry.action || entry.description) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.action || entry.description}
                  </p>
                )}

                {/* Tool arguments summary */}
                {entry.toolArguments && (
                  <p className="text-xs text-orange-600">
                    {Object.keys(entry.toolArguments).length} parameter(s)
                  </p>
                )}

                {/* Result count */}
                {entry.resultCount !== undefined && (
                  <p className="text-xs text-green-600">
                    {entry.resultCount} result(s)
                  </p>
                )}
              </div>

              {/* Duration */}
              <div className="text-xs text-muted-foreground">
                {formatDuration(entry.duration || 0)}
              </div>
            </div>
          ))}

          {/* Timeline visualization */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
            {history.filter(h => h.duration).map((entry, idx) => {
              const widthPercent = ((entry.duration || 0) / totalDuration) * 100
              return (
                <div
                  key={idx}
                  className={`h-full ${getPhaseColor(entry.phase)}`}
                  style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  title={`${getPhaseLabel(entry.phase)}: ${formatDuration(entry.duration || 0)}`}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})
```

---

## Advanced Features

### 1. Reasoning/Thinking Visualization

For models that support extended reasoning (like o1, DeepSeek R1, Qwen Thinking):

```typescript
// Detect reasoning in stream
if (delta?.reasoning_content || delta?.reasoning || delta?.thinking) {
  onReasoning(reasoningContent)

  // Add to streaming history
  addStreamingHistoryEntry({
    phase: "thinking",
    description: "Extended reasoning active",
    action: "Model is using deep reasoning for complex analysis"
  })
}

// UI display
{reasoningVisible && (
  <div className="p-2 rounded-md bg-purple-500/10">
    <Lightbulb className="w-4 h-4" />
    <p className="text-xs font-medium">Extended Thinking</p>
    <p className="text-xs">Model is using extended reasoning for complex tasks</p>
  </div>
)}
```

### 2. File Operations Tracking

For systems with file operations:

```typescript
// Server sends file info
{
  choices: [{
    delta: {
      phase: "tool_use",
      toolName: "read_file",
      toolArguments: {
        path: "src/components/chat.tsx"
      },
      action: "Reading file: src/components/chat.tsx",
      files: ["src/components/chat.tsx"]
    }
  }]
}

// UI displays file paths
{streamingDetails.files && (
  <div className="p-2 rounded-md bg-blue-500/10">
    <FileSearch className="w-4 h-4" />
    <p className="text-xs font-medium">Files</p>
    {streamingDetails.files.map(file => (
      <p key={file} className="text-xs font-mono">{file}</p>
    ))}
  </div>
)}
```

### 3. Multi-Tool Sequences

Track sequences of multiple tool calls:

```typescript
// Each tool call gets its own entry
addStreamingHistoryEntry({
  phase: "tool_use",
  toolName: "web_search",
  action: "Searching for latest information",
  toolArguments: { query: "..." }
})

addStreamingHistoryEntry({
  phase: "tool_use",
  toolName: "calculator",
  action: "Calculating statistics",
  toolArguments: { expression: "..." }
})

// Timeline shows both operations
```

### 4. Error Handling

```typescript
// Server sends error information
{
  choices: [{
    delta: {
      phase: "tool_use",
      error: true,
      errorMessage: "Search API rate limit exceeded",
      action: "Retrying search with different provider"
    }
  }]
}

// UI displays error state
{streamingDetails.error && (
  <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20">
    <AlertCircle className="w-4 h-4 text-red-500" />
    <p className="text-xs font-medium text-red-600">Error</p>
    <p className="text-sm">{streamingDetails.errorMessage}</p>
  </div>
)}
```

---

## Best Practices

### 1. Performance Optimization

```typescript
// Use memo for expensive components
export const MessageStatusVerbose = memo(function MessageStatusVerbose(props) {
  // Component implementation
})

// Use refs for non-UI state
const streamingHistoryRef = useRef<StreamingHistoryEntry[]>([])

// Debounce rapid updates
const debouncedUpdateDetails = useMemo(
  () => debounce((details) => setCurrentStreamingDetails(details), 100),
  []
)
```

### 2. State Cleanup

```typescript
// Always clean up when starting new message
const handleSubmit = () => {
  clearStreamingHistory()
  setStreamingPhase("thinking")
  setCurrentTool(null)
  setSearchQuery(null)
  setCurrentStreamingDetails(null)
}

// Clean up on unmount
useEffect(() => {
  return () => {
    clearStreamingHistory()
  }
}, [])
```

### 3. Error Recovery

```typescript
try {
  await streamChatMessage(messages, model, onChunk, {
    onStreamingDetails,
    // ... other callbacks ...
  })
} catch (error) {
  // Reset streaming state on error
  setStreamingPhase("idle")
  setCurrentStreamingDetails(null)

  // Show error to user
  toast({
    title: "Streaming error",
    description: error.message,
    variant: "destructive"
  })
}
```

### 4. Accessibility

```typescript
// Add ARIA labels
<div role="status" aria-live="polite" aria-atomic="true">
  <span className="sr-only">
    {isActive ? `Currently ${step.labelActive}` : step.label}
  </span>
  {/* Visual content */}
</div>

// Keyboard navigation
<button
  onClick={() => toggleStep(step.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleStep(step.id)
    }
  }}
  aria-expanded={isExpanded}
  aria-controls={`step-content-${step.id}`}
>
  {/* Button content */}
</button>
```

### 5. Internationalization

```typescript
const phaseInfo = {
  thinking: {
    en: { label: "Thinking", description: "Analyzing context..." },
    de: { label: "Denkprozess", description: "Analysiere Kontext..." },
    es: { label: "Pensando", description: "Analizando contexto..." }
  },
  // ... other phases ...
}

const getPhaseInfo = (phase: string, lang: string) => {
  return phaseInfo[phase]?.[lang] || phaseInfo[phase].en
}
```

---

## Code Examples

### Complete Implementation Example

```typescript
// 1. Server-side streaming endpoint
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  ;(async () => {
    try {
      // Send thinking phase
      await writer.write(encoder.encode(
        `data: ${JSON.stringify({ choices: [{ delta: { phase: "thinking" } }] })}\n\n`
      ))

      // Detect tool calls
      if (hasToolCalls) {
        const toolArgs = parseToolArguments(toolCall.arguments)

        // Send detailed tool info
        await writer.write(encoder.encode(
          `data: ${JSON.stringify({
            choices: [{
              delta: {
                phase: "searching",
                toolName: "web_search",
                toolArguments: toolArgs,
                searchProvider: "tavily",
                action: `Searching tavily: "${toolArgs.query}"`,
                searchParameters: searchSettings
              }
            }]
          })}\n\n`
        ))

        // Execute tool
        const results = await executeSearch(toolArgs)

        // Send results
        await writer.write(encoder.encode(
          `data: ${JSON.stringify({
            choices: [{
              delta: {
                resultSummary: `Found ${results.length} results`,
                resultCount: results.length
              }
            }]
          })}\n\n`
        ))
      }

      // Stream response content
      await writer.write(encoder.encode(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "..." } }] })}\n\n`
      ))

      // Send done
      await writer.write(encoder.encode(
        `data: ${JSON.stringify({ choices: [{ delta: { phase: "done" } }] })}\n\n`
      ))
    } finally {
      await writer.close()
    }
  })()

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// 2. Client-side stream processing
const handleSubmit = async () => {
  clearStreamingHistory()
  setStreamingPhase("thinking")

  await streamChatMessage(messages, model, onChunk, {
    onPhaseChange: (phase) => {
      setStreamingPhase(phase)
      addStreamingHistoryEntry({ phase, description: getPhaseDescription(phase) })
    },

    onStreamingDetails: (details) => {
      setCurrentStreamingDetails(details)
      if (details.phase) {
        addStreamingHistoryEntry({
          phase: details.phase as any,
          toolName: details.toolName,
          toolArguments: details.toolArguments,
          searchProvider: details.searchProvider,
          action: details.action,
          resultCount: details.resultCount,
          description: details.resultSummary || details.action
        })
      }
    },
  })

  // Save streaming history to message
  const history = getStreamingHistory()
  updateMessage(messageId, { streamingHistory: history })
}

// 3. UI rendering
<div className="message-loading">
  {isAdvancedMode ? (
    <MessageStatusVerbose
      currentPhase={streamingPhase}
      currentTool={currentTool}
      searchQuery={searchQuery}
      streamingDetails={currentStreamingDetails}
      language={language}
      modelName={modelName}
    />
  ) : (
    <MessageStatus
      currentPhase={streamingPhase}
      language={language}
    />
  )}
</div>

// 4. Completed message history
{message.streamingHistory && (
  <StreamingHistoryDisplay
    history={message.streamingHistory}
    language={language}
    collapsed={!expanded}
    onToggle={() => toggleExpanded(message.id)}
  />
)}
```

---

## Testing

### Unit Tests

```typescript
describe('StreamingHistoryEntry', () => {
  it('should record phase transitions with durations', () => {
    const history: StreamingHistoryEntry[] = []

    history.push({ phase: 'thinking', timestamp: 1000 })
    history.push({ phase: 'searching', timestamp: 2000 })

    history[0].duration = history[1].timestamp - history[0].timestamp

    expect(history[0].duration).toBe(1000)
  })

  it('should handle enhanced details', () => {
    const entry: StreamingHistoryEntry = {
      phase: 'searching',
      timestamp: Date.now(),
      toolName: 'web_search',
      toolArguments: { query: 'test' },
      searchProvider: 'tavily',
      action: 'Searching tavily: "test"',
      resultCount: 5
    }

    expect(entry.toolArguments?.query).toBe('test')
    expect(entry.resultCount).toBe(5)
  })
})
```

### Integration Tests

```typescript
describe('Streaming Visualization', () => {
  it('should display detailed info in advanced mode', async () => {
    const { getByText, getByTestId } = render(
      <ChatMessages isAdvancedMode={true} />
    )

    // Simulate streaming event
    act(() => {
      setCurrentStreamingDetails({
        action: 'Searching tavily: "test query"',
        toolArguments: { query: 'test query' },
        searchProvider: 'tavily'
      })
    })

    expect(getByText('Current Action')).toBeInTheDocument()
    expect(getByText('Searching tavily: "test query"')).toBeInTheDocument()
    expect(getByText('Tool Parameters')).toBeInTheDocument()
  })
})
```

---

## Troubleshooting

### Common Issues

1. **Events not received**
   - Check SSE headers are set correctly
   - Verify `Content-Type: text/event-stream`
   - Ensure no response buffering

2. **State updates missing**
   - Verify all callbacks are connected
   - Check state cleanup on component unmount
   - Ensure streaming history is cleared between messages

3. **UI not updating**
   - Check if component is memoized correctly
   - Verify props are changing
   - Use React DevTools to inspect state

4. **Memory leaks**
   - Clear streaming history after message completes
   - Clean up event listeners on unmount
   - Cancel streams on navigation

---

## Conclusion

This enhanced streaming visualization system provides:

✅ **Real-time transparency** - Users see exactly what's happening
✅ **Detailed information** - Tool parameters, search providers, file operations
✅ **Historical review** - Complete timeline of AI's actions
✅ **Mode separation** - Advanced users get details, simple users get clean UI
✅ **Performance** - Optimized with memoization and efficient updates
✅ **Extensible** - Easy to add new phases, tools, and details

The system is production-ready and provides a Claude.ai/Claude Code-level streaming experience.

---

## Streaming Visualization Settings (Advanced Mode)

### Overview

The streaming visualization system now includes a comprehensive settings panel that allows users to fine-tune exactly what streaming details are displayed. This provides full control over the visualization experience while maintaining performance.

**Location:** Settings → Labs (Experimental) → Streaming Visualization (Advanced Mode Only)

### Features

#### Quick Presets

Three predefined configurations for different use cases:

1. **Minimal** - Essential information only
   - Current action, search provider, result summary
   - Reasoning tokens, error details
   - Model info, progress indicators
   
2. **Balanced** (Recommended)
   - All minimal features PLUS
   - Tool parameters, search results preview
   - Performance metrics (tokens, latency, speed)
   - Extended thinking, tool chains
   - Phase durations
   
3. **Maximum** - Everything enabled
   - All features including advanced details
   - Generation IDs, cache status
   - Timestamps, context usage
   - Full debugging information

#### Toggleable Visualizations

**Core Information**
- `showCurrentAction` - Real-time action descriptions
- `showToolParameters` - Exact tool arguments
- `showSearchProvider` - Provider and parameter counts

**Search & Results**
- `showSearchResults` - Preview of actual content (500 chars)
- `showResultSummary` - Result counts and summaries

**Reasoning & Thinking**
- `showReasoningTokens` - o1/DeepSeek R1 reasoning process
- `showExtendedThinking` - Extended thinking indicators

**Performance Metrics** (Planned)
- `showTokenUsage` - Real-time token counts
- `showLatencyMetrics` - Time to first token (TTFT)
- `showStreamingSpeed` - Tokens/second, chars/second
- `showCostEstimates` - Real-time cost tracking

**Context & Progress**
- `showContextUsage` - Context window percentage
- `showProgressIndicators` - Progress bars
- `showEstimatedTime` - Time remaining estimates

**Advanced Details** (Planned)
- `showModelInfo` - Model name and provider
- `showGenerationId` - Request tracking IDs
- `showCacheStatus` - Prompt cache hits
- `showRetryAttempts` - Failed request retries
- `showToolChains` - Multi-tool sequences

**Warnings & Errors**
- `showRateLimitWarnings` - Rate limit alerts
- `showErrorDetails` - Detailed error information

**Timing & Duration**
- `showPhaseDurations` - Phase completion times
- `showTimestamps` - Event timestamps

**Detailed Stats Integration**
- `showDetailedStats` - Show comprehensive post-completion statistics
  - Token usage (prompt, completion, total)
  - Cost estimates in USD
  - Performance metrics (response time, tokens/sec, TTFT)
  - Search statistics (time, results, provider)
  - Integrated from existing MessageStats component

### Implementation

#### Type Definition

```typescript
export interface StreamingVisualizationSettings {
  // Core Information
  showCurrentAction?: boolean
  showToolParameters?: boolean
  showSearchProvider?: boolean

  // Search & Results
  showSearchResults?: boolean
  showResultSummary?: boolean

  // Reasoning & Thinking
  showReasoningTokens?: boolean
  showExtendedThinking?: boolean

  // Performance Metrics (Real-time & Post-completion)
  showDetailedStats?: boolean        // Post-completion comprehensive stats (NEW)
  showTokenUsage?: boolean           // Real-time token counts during streaming
  showLatencyMetrics?: boolean       // Time to first token (TTFT)
  showStreamingSpeed?: boolean       // Tokens/second, chars/second
  showCostEstimates?: boolean        // Real-time cost tracking

  // Context & Progress
  showContextUsage?: boolean
  showProgressIndicators?: boolean
  showEstimatedTime?: boolean

  // Advanced Details
  showModelInfo?: boolean
  showGenerationId?: boolean
  showCacheStatus?: boolean
  showRetryAttempts?: boolean
  showToolChains?: boolean

  // Warnings & Errors
  showRateLimitWarnings?: boolean
  showErrorDetails?: boolean

  // Timing & Duration
  showPhaseDurations?: boolean
  showTimestamps?: boolean
}
```

#### Usage in Components

```typescript
// In MessageStatusVerbose component (real-time streaming)
const { settings } = useApp()
const vizSettings = settings?.experimental?.streamingVisualization || {}

// Check settings before rendering
{vizSettings.showReasoningTokens !== false && streamingDetails.reasoningContent && (
  <div className="reasoning-card">
    {/* Reasoning visualization */}
  </div>
)}

// In ChatMessages component (post-completion stats)
{message.role === "assistant" &&
 settings.experimental?.streamingVisualization?.showDetailedStats !== false && (
  <MessageStats message={message} />
)}
```

#### Default Values

All settings default to `true` for maximum transparency. Users can selectively disable features they don't need:

```typescript
const showReasoningTokens = vizSettings.showReasoningTokens ?? true
const showToolParameters = vizSettings.showToolParameters ?? true
// etc.
```

### Benefits

1. **Performance**: Users can disable expensive visualizations
2. **Focus**: Reduce visual clutter for specific use cases
3. **Customization**: Tailor the experience to individual preferences
4. **Learning**: New users can start minimal, advanced users can enable everything
5. **Debugging**: Maximum mode provides comprehensive debugging information
6. **Unified Control**: All streaming and stats visualization in one place

### Detailed Stats Integration

#### Overview

The `showDetailedStats` setting integrates the existing MessageStats component into the streaming visualization settings system. Previously, this was a separate toggle in the main settings dialog. Now it's part of the comprehensive streaming visualization controls in the Experimental settings (Advanced Mode only).

#### What It Shows

When enabled, displays a comprehensive statistics panel at the end of each assistant message:

**Token Information**
- Prompt tokens used
- Completion tokens generated
- Total token count
- Visual token usage bar

**Cost Tracking**
- Estimated cost in USD
- Based on model pricing
- Real-time calculation

**Performance Metrics**
- Total response time (seconds)
- Tokens per second throughput
- Time to first token (TTFT)
- Characters per second

**Search Statistics** (when web search was used)
- Search provider used
- Number of results returned
- Search operation time

#### Implementation Details

```typescript
// Previous location (REMOVED)
// components/settings-dialog.tsx
// Had a dedicated "Detailed Stats" toggle in main settings

// New location (CURRENT)
// Settings → Labs (Experimental) → Streaming Visualization → Performance Metrics
// Integrated with other streaming visualization controls

// Code change in chat-messages.tsx
// Before:
{message.role === "assistant" && settings.showDetailedStats && (
  <MessageStats message={message} />
)}

// After:
{message.role === "assistant" &&
 settings.experimental?.streamingVisualization?.showDetailedStats !== false && (
  <MessageStats message={message} />
)}
```

#### Benefits of Integration

1. **Centralized Control**: All streaming/stats visualization in one place
2. **Better Organization**: Grouped with related performance metrics
3. **Advanced Mode Only**: Appropriate level of detail for the target audience
4. **Consistent UX**: Uses the same preset system (Minimal/Balanced/Maximum)
5. **Default Enabled**: Part of "Balanced" and "Maximum" presets

#### Preset Behavior

- **Minimal**: Disabled (stats hidden)
- **Balanced**: Enabled (recommended)
- **Maximum**: Enabled (full transparency)

#### Migration Notes

For users upgrading from previous versions:
- The old `settings.showDetailedStats` setting is deprecated
- Functionality is now at `settings.experimental.streamingVisualization.showDetailedStats`
- Defaults to `true` for maximum transparency
- Can be toggled in Experimental settings → Streaming Visualization panel

### Best Practices

#### For Different User Types

**Beginners**
- Use "Minimal" preset
- Focus on understanding basic AI operations
- Gradually enable more features as needed

**Regular Users**
- Use "Balanced" preset (recommended)
- Get important insights without overwhelming detail
- Enable specific features for particular tasks

**Developers/Researchers**
- Use "Maximum" preset
- Full transparency into AI operations
- Debug issues and understand performance

#### Performance Considerations

If experiencing performance issues:
1. Disable `showReasoningTokens` (can be large)
2. Disable `showSearchResults` (preview content)
3. Disable `showToolParameters` (JSON rendering)
4. Disable `showTimestamps` (frequent updates)

#### Privacy Considerations

Some visualizations show sensitive data:
- `showSearchResults` - Shows actual search content
- `showToolParameters` - May include search queries
- `showGenerationId` - Request tracking information

Disable these when screen sharing or recording.

### API Reference

#### StreamingSettingsPanel Component

```typescript
<StreamingSettingsPanel
  settings={streamingVisualizationSettings}
  onSettingsChange={(newSettings) => updateSettings(newSettings)}
  language="en" | "de" | "es"
/>
```

**Props:**
- `settings`: Current visualization settings
- `onSettingsChange`: Callback when settings change
- `language`: UI language (optional, default: "en")

**Features:**
- Organized by category
- Tooltips with descriptions
- Quick preset buttons
- Real-time toggle switches
- Multilingual support (EN/DE/ES)

### Future Enhancements

Planned additions to streaming visualization:

1. **Real-time Metrics**
   - Token usage counters
   - Streaming speed (tokens/sec)
   - Cost estimates
   - Latency measurements (TTFT)

2. **Advanced Tracking**
   - Context window usage bars
   - Cache hit/miss indicators
   - Retry attempt tracking
   - Rate limit warnings

3. **Visual Enhancements**
   - Interactive timelines
   - Performance graphs
   - Cost breakdown charts
   - Tool chain diagrams

4. **Export Features**
   - Export streaming logs
   - Performance reports
   - Debugging information
   - Timeline screenshots

### Research Sources

Implementation based on:
- [OpenRouter API Streaming](https://openrouter.ai/api/api-reference/streaming)
- [Usage Accounting](https://openrouter.ai/docs/use-cases/usage-accounting)
- [SSE Best Practices 2025](https://procedure.tech/blogs/the-streaming-backbone-of-llms-why-server-sent-events-(sse)-still-wins-in-2025)
- [Reasoning Tokens](https://openrouter.ai/docs/use-cases/reasoning-tokens)

### Conclusion

The streaming visualization settings system provides unprecedented control over what users see during AI operations. By allowing fine-grained customization, users can:

- **Optimize performance** by disabling unnecessary visualizations
- **Focus on relevant information** for their specific use case
- **Learn progressively** by enabling features as they become comfortable
- **Debug effectively** with maximum transparency when needed

This system represents a significant advancement in AI UX, providing both simplicity for beginners and power for advanced users.

