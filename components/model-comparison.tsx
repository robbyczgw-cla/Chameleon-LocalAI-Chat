"use client"
// Cache bust: v2024-mobile-nav-lmstudio
import { useState, useRef, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Columns2, Columns3, Grid2x2, X, History, Globe, Cpu } from "lucide-react"
import type { Message } from "@/types"
import { POPULAR_OPENROUTER_MODELS } from "@/lib/openrouter"
import { getUserSelectedModels } from "@/lib/model-preferences"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import { ComparisonHistoryDialog } from "./comparison-history-dialog"
import type { ComparisonSession } from "@/types"
import { searchWeb, formatSearchResults } from "@/lib/tavily"
import { useToast } from "@/hooks/use-toast"

interface ComparisonPanel {
  model: string
  messages: Message[]
  isLoading: boolean
}

interface ModelOption {
  id: string
  name: string
  provider: string
}

// Helper function to get model details from the list
function getModelDetails(modelId: string): ModelOption {
  const found = POPULAR_OPENROUTER_MODELS.find((m) => m.id === modelId)
  if (found) {
    return { id: found.id, name: found.name, provider: found.provider }
  }
  // Fallback: extract provider and use model ID as name
  const [provider, ...rest] = modelId.split("/")
  return {
    id: modelId,
    name: rest.join("/"),
    provider: provider,
  }
}

// Helper function to get all available models (user's selected + popular as fallback)
function getAvailableModels(): ModelOption[] {
  const selectedModelIds = getUserSelectedModels()

  if (selectedModelIds.length > 0) {
    return selectedModelIds.map((id) => getModelDetails(id))
  }

  // Fallback to popular models if no selection
  return POPULAR_OPENROUTER_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
  }))
}

// Fetch LM Studio models
async function fetchLMStudioModels(): Promise<ModelOption[]> {
  try {
    const response = await fetch('/api/lmstudio/models')
    if (response.ok) {
      const data = await response.json()
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m: any) => ({
          id: `local/${m.id}`,
          name: `🖥️ ${m.id.split('/').pop() || m.id}`,
          provider: 'LM Studio'
        }))
      }
    }
  } catch (error) {
    console.log("[ModelComparison] LM Studio not available:", error)
  }
  return []
}

export function ModelComparison() {
  const { settings, saveComparisonSession } = useApp()
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(getAvailableModels())
  const [panels, setPanels] = useState<ComparisonPanel[]>([
    { model: availableModels[0]?.id || "x-ai/grok-4.1-fast", messages: [], isLoading: false },
    { model: availableModels[1]?.id || "anthropic/claude-4.5-sonnet-20250929", messages: [], isLoading: false },
  ])
  const [input, setInput] = useState("")
  const [layout, setLayout] = useState<"2-column" | "3-column" | "4-column">("2-column")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [mobileActivePanel, setMobileActivePanel] = useState(0) // For mobile tab view
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([])
  const wasAtBottomRef = useRef<boolean[]>([])
  const { toast } = useToast()

  // Fetch LM Studio models and combine with user models on mount
  useEffect(() => {
    const loadAllModels = async () => {
      const lmStudioModels = await fetchLMStudioModels()
      const userModels = getAvailableModels()
      // LM Studio models first, then user models
      setAvailableModels([...lmStudioModels, ...userModels])
    }
    loadAllModels()
  }, [])

  // Listen to model preference changes and update available models
  useEffect(() => {
    const handleModelPreferencesChanged = async () => {
      const lmStudioModels = await fetchLMStudioModels()
      const userModels = getAvailableModels()
      setAvailableModels([...lmStudioModels, ...userModels])
    }

    window.addEventListener("modelPreferencesChanged", handleModelPreferencesChanged)
    return () => {
      window.removeEventListener("modelPreferencesChanged", handleModelPreferencesChanged)
    }
  }, [])

  useEffect(() => {
    scrollRefs.current.forEach((ref, index) => {
      if (ref) {
        // Check if user was near bottom (within 100px threshold)
        const isNearBottom = ref.scrollHeight - ref.scrollTop - ref.clientHeight < 100

        // Only auto-scroll if user was already at bottom or it's the first message
        if (isNearBottom || wasAtBottomRef.current[index] === undefined) {
          ref.scrollTop = ref.scrollHeight
        }

        // Update the tracking ref
        wasAtBottomRef.current[index] = isNearBottom
      }
    })
  }, [panels])

  const sendToAll = async () => {
    if (!input.trim()) return

    // Check if API key is configured
    if (!settings.apiKeys.openRouter) {
      toast({
        title: "API Key Required",
        description: "Please add your OpenRouter API key in Settings → API Keys",
        variant: "destructive",
      })
      return
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    setPanels((prev) =>
      prev.map((panel) => ({
        ...panel,
        messages: [...panel.messages, userMessage],
        isLoading: true,
      })),
    )

    setInput("")

    let searchContext = ""
    if (webSearchEnabled && settings.apiKeys.tavily) {
      try {
        toast({
          title: "Searching the web...",
          description: "Gathering information from the internet",
        })

        const tavilySettings = settings.tavilySettings || {
          searchDepth: "basic",
          maxResults: 5,
          includeImages: false,
          includeAnswer: true,
        }

        const searchResults = await searchWeb(input.trim(), {
          maxResults: tavilySettings.maxResults,
          searchDepth: tavilySettings.searchDepth,
          includeImages: tavilySettings.includeImages,
          apiKey: settings.apiKeys.tavily,
        })

        searchContext = `Web search results for: "${input.trim()}"\n\n`

        if (tavilySettings.includeAnswer && searchResults.answer) {
          searchContext += `Summary: ${searchResults.answer}\n\n`
        }

        searchContext += `Detailed results:\n${formatSearchResults(searchResults.results)}\n\nPlease use the above web search results to provide an accurate and up-to-date answer to the user's question.`

        toast({
          title: "Search complete",
          description: `${searchResults.results.length} results found`,
        })
      } catch (searchError) {
        console.error("[v0] Search error:", searchError)
        toast({
          title: "Search failed",
          description: "Continuing without web search",
          variant: "destructive",
        })
      }
    }

    const promises = panels.map(async (panel, panelIndex) => {
      const abortController = new AbortController()

      try {
        const messagesToSend = [...panel.messages, userMessage]
        if (searchContext) {
          messagesToSend.splice(-1, 0, {
            id: `msg-${Date.now()}`,
            role: "system" as const,
            content: searchContext,
            timestamp: Date.now(),
          })
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-openrouter-api-key": settings.apiKeys.openRouter || "",
          },
          body: JSON.stringify({
            messages: messagesToSend,
            model: panel.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            stream: true,
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No reader available")

        const decoder = new TextDecoder()
        let assistantContent = ""
        const assistantMessageId = `msg-${Date.now()}`
        let buffer = ""
        let messageAdded = false

        try {
          while (true) {
            let readResult
            try {
              readResult = await reader.read()
            } catch (readError) {
              break
            }

            const { done, value } = readResult
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (!line.trim() || !line || !line.startsWith("data: ")) continue

              const data = line.slice(6).trim()
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  assistantContent += content

                  setPanels((prev) =>
                    prev.map((p, idx) => {
                      if (idx !== panelIndex) return p

                      const existingMsgIndex = p.messages.findIndex((m) => m.id === assistantMessageId)
                      const updatedMessages = [...p.messages]

                      if (existingMsgIndex >= 0) {
                        updatedMessages[existingMsgIndex] = {
                          ...updatedMessages[existingMsgIndex],
                          content: assistantContent,
                        }
                      } else {
                        updatedMessages.push({
                          id: assistantMessageId,
                          role: "assistant",
                          content: assistantContent,
                          timestamp: Date.now(),
                        })
                        messageAdded = true
                      }

                      return { ...p, messages: updatedMessages }
                    }),
                  )
                }
              } catch (parseError) {
                continue
              }
            }
          }
        } catch (streamError) {
          console.log(`[v0] Stream ended for ${panel.model} (this is normal)`)
        } finally {
          try {
            reader.releaseLock()
          } catch (e) {}
        }

        if (assistantContent && !messageAdded) {
          setPanels((prev) =>
            prev.map((p, idx) => {
              if (idx !== panelIndex) return p
              return {
                ...p,
                messages: [
                  ...p.messages,
                  {
                    id: assistantMessageId,
                    role: "assistant",
                    content: assistantContent,
                    timestamp: Date.now(),
                  },
                ],
              }
            }),
          )
        }
      } catch (error) {
        console.error(`[v0] Error with model ${panel.model}:`, error)

        let errorMessage = "Unknown error"
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage = "Request aborted"
          } else if (error.message.includes("HTTP")) {
            errorMessage = `API error: ${error.message}`
          } else {
            errorMessage = error.message
          }
        }

        setPanels((prev) =>
          prev.map((p, idx) =>
            idx === panelIndex
              ? {
                  ...p,
                  messages: [
                    ...p.messages,
                    {
                      id: `msg-${Date.now()}`,
                      role: "assistant",
                      content: `❌ Error: ${errorMessage}`,
                      timestamp: Date.now(),
                    },
                  ],
                }
              : p,
          ),
        )
      } finally {
        setPanels((prev) => prev.map((p, idx) => (idx === panelIndex ? { ...p, isLoading: false } : p)))
      }
    })

    await Promise.all(promises)

    const modelsUsed = panels.map((p) => p.model)
    const allMessages = panels.flatMap((p) => [...p.messages, userMessage])

    saveComparisonSession({
      models: modelsUsed,
      messages: allMessages,
    })
  }

  const addPanel = () => {
    if (panels.length >= 4) return

    // Find a model that's not already in use
    const usedModels = new Set(panels.map((p) => p.model))
    const unusedModel = availableModels.find((m) => !usedModels.has(m.id))
    const modelToAdd = unusedModel?.id || availableModels[0]?.id || "x-ai/grok-4.1-fast"

    setPanels([...panels, { model: modelToAdd, messages: [], isLoading: false }])
  }

  const removePanel = (index: number) => {
    if (panels.length <= 2) return
    setPanels(panels.filter((_, i) => i !== index))
  }

  const loadSession = (session: ComparisonSession) => {
    if (!session.models || session.models.length === 0) {
      console.error("[v0] Cannot load session: no models found")
      return
    }

    // Group messages by model if possible, otherwise distribute evenly
    const messagesPerModel = Math.ceil((session.messages?.length || 0) / session.models.length)

    setPanels(
      session.models.map((model, index) => ({
        model: model,
        messages: session.messages?.slice(index * messagesPerModel, (index + 1) * messagesPerModel) || [],
        isLoading: false,
      })),
    )
  }

  const gridCols =
    layout === "2-column"
      ? "grid-cols-1 md:grid-cols-2"
      : layout === "3-column"
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b p-3 sm:p-4">
        {/* Top row: Title and primary actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold">Model Comparison</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              title="Show History"
              className="h-9 w-9 sm:min-h-[44px] sm:min-w-[44px]"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const event = new CustomEvent("toggleComparison")
                window.dispatchEvent(event)
              }}
              title="Back to Chat"
              className="h-9 w-9 sm:min-h-[44px] sm:min-w-[44px]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile: Tab switcher for panels */}
        <div className="flex md:hidden overflow-x-auto gap-1 pb-1">
          {panels.map((panel, index) => {
            const modelDetails = getModelDetails(panel.model)
            return (
              <Button
                key={index}
                variant={mobileActivePanel === index ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileActivePanel(index)}
                className="flex-shrink-0 text-xs h-8 px-3"
              >
                {modelDetails.name.split('/').pop()?.substring(0, 12) || `Model ${index + 1}`}
                {panel.isLoading && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
              </Button>
            )
          })}
          {panels.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addPanel}
              className="flex-shrink-0 h-8 w-8"
              title="Add model"
            >
              +
            </Button>
          )}
        </div>

        {/* Desktop: Layout controls */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">Layout:</span>
          <Button
            variant={layout === "2-column" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("2-column")}
            className="min-h-[44px] min-w-[44px]"
          >
            <Columns2 className="h-4 w-4 mr-2" />
            2 Col
          </Button>
          <Button
            variant={layout === "3-column" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("3-column")}
            className="min-h-[44px] min-w-[44px]"
          >
            <Columns3 className="h-4 w-4 mr-2" />
            3 Col
          </Button>
          <Button
            variant={layout === "4-column" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("4-column")}
            className="min-h-[44px] min-w-[44px]"
          >
            <Grid2x2 className="h-4 w-4 mr-2" />
            4 Col
          </Button>
          {panels.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addPanel}
              className="min-h-[44px] min-w-[44px]"
              title="Add another model"
            >
              <span className="text-lg">+</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: Single panel view with tabs */}
      <div className="flex-1 md:hidden flex flex-col p-3" style={{ minHeight: 0 }}>
        {panels[mobileActivePanel] && (
          <Card className="flex flex-col flex-1" style={{ minHeight: 0 }}>
            <div className="flex items-center gap-2 border-b p-2 flex-shrink-0">
              <select
                value={panels[mobileActivePanel].model}
                onChange={(e) => {
                  const newPanels = [...panels]
                  newPanels[mobileActivePanel].model = e.target.value
                  setPanels(newPanels)
                }}
                className="rounded-md border bg-background px-2 py-2 text-sm h-10 flex-1 font-medium"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {panels.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removePanel(mobileActivePanel)
                    if (mobileActivePanel >= panels.length - 1) {
                      setMobileActivePanel(Math.max(0, panels.length - 2))
                    }
                  }}
                  className="h-10 w-10 flex-shrink-0"
                  title="Remove this model"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div
              ref={(el) => (scrollRefs.current[mobileActivePanel] = el)}
              className="flex-1 overflow-y-auto p-3"
              style={{ minHeight: 0 }}
            >
              {panels[mobileActivePanel].messages.map((msg) => (
                <div key={msg.id} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block rounded-lg px-3 py-2 max-w-[95%] break-words ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || "")
                              return !inline && match ? (
                                <pre className="bg-black/50 rounded-md p-2 overflow-x-auto my-2">
                                  <code className={cn("text-xs", className)} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs" {...props}>
                                  {children}
                                </code>
                              )
                            },
                            p({ children }) {
                              return <p className="mb-2 last:mb-0 text-xs">{children}</p>
                            },
                            strong({ children }) {
                              return <strong className="font-bold">{children}</strong>
                            },
                            em({ children }) {
                              return <em className="italic">{children}</em>
                            },
                            ul({ children }) {
                              return <ul className="list-disc list-inside mb-2 text-xs">{children}</ul>
                            },
                            ol({ children }) {
                              return <ol className="list-decimal list-inside mb-2 text-xs">{children}</ol>
                            },
                            li({ children }) {
                              return <li className="mb-1">{children}</li>
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {panels[mobileActivePanel].isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Generating...
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Desktop: Grid view */}
      <div className={`hidden md:grid flex-1 gap-4 p-4 ${gridCols}`} style={{ minHeight: 0 }}>
        {panels.map((panel, index) => (
          <Card key={index} className="flex flex-col" style={{ minHeight: 0 }}>
            <div className="flex items-center gap-2 border-b p-3 flex-shrink-0">
              <select
                value={panel.model}
                onChange={(e) => {
                  const newPanels = [...panels]
                  newPanels[index].model = e.target.value
                  setPanels(newPanels)
                }}
                className="rounded-md border bg-background px-3 py-2.5 text-sm min-h-[44px] flex-1 font-medium"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {panels.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePanel(index)}
                  className="min-h-[44px] min-w-[44px] flex-shrink-0"
                  title="Remove this panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div
              ref={(el) => (scrollRefs.current[index] = el)}
              className="flex-1 overflow-y-auto p-4"
              style={{ minHeight: 0 }}
            >
              {panel.messages.map((msg) => (
                <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block rounded-lg px-4 py-2 max-w-[90%] break-words ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || "")
                              return !inline && match ? (
                                <pre className="bg-black/50 rounded-md p-3 overflow-x-auto my-2">
                                  <code className={cn("text-xs", className)} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs" {...props}>
                                  {children}
                                </code>
                              )
                            },
                            p({ children }) {
                              return <p className="mb-2 last:mb-0 text-sm">{children}</p>
                            },
                            strong({ children }) {
                              return <strong className="font-bold">{children}</strong>
                            },
                            em({ children }) {
                              return <em className="italic">{children}</em>
                            },
                            ul({ children }) {
                              return <ul className="list-disc list-inside mb-2 text-sm">{children}</ul>
                            },
                            ol({ children }) {
                              return <ol className="list-decimal list-inside mb-2 text-sm">{children}</ol>
                            },
                            li({ children }) {
                              return <li className="mb-1">{children}</li>
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {panel.isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Generating...
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="border-t p-3 sm:p-4 pb-20 md:pb-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendToAll()}
            placeholder="Send to all models..."
            className="w-full rounded-lg border bg-background px-3 sm:px-4 py-3 text-sm min-h-[44px] flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant={webSearchEnabled ? "default" : "outline"}
            className="h-[44px] w-[44px] flex-shrink-0"
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            title={webSearchEnabled ? "Disable web search" : "Enable web search (Tavily)"}
            disabled={!settings.apiKeys.tavily}
          >
            <Globe className={`h-4 w-4 ${webSearchEnabled ? "animate-pulse" : ""}`} />
          </Button>
          <Button
            onClick={sendToAll}
            disabled={!input.trim() || panels.some((p) => p.isLoading)}
            className="h-[44px] px-4 text-sm font-medium flex-shrink-0"
          >
            Send
          </Button>
        </div>
        {webSearchEnabled && settings.apiKeys.tavily && (
          <p className="text-xs text-primary mt-2 flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className="hidden sm:inline">Web search enabled - All responses use current information</span>
            <span className="sm:hidden">Web search on</span>
          </p>
        )}
      </div>

      <ComparisonHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} onLoadSession={loadSession} />
    </div>
  )
}
