"use client"

import type React from "react"
import { Send, Globe, Square, Lightbulb } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Message } from "@/types"
import { streamChatMessage, REASONING_MODELS } from "@/lib/openrouter"
import { searchWeb, formatSearchResults as formatTavilyResults } from "@/lib/tavily"
import { searchWithSerper, formatSearchResults as formatSerperResults } from "@/lib/serper"
import { searchWithYoucom, formatSearchResults as formatYoucomResults } from "@/lib/youcom"
import type { SearchResponse } from "@/lib/serper"
import { useToast } from "@/hooks/use-toast"
import { generateUUID, cn } from "@/lib/utils"
import { estimateTokens, calculateCost } from "@/lib/token-tracker"
import { languageService, getTranslation } from "@/lib/languages"
import { FileUpload } from "@/components/file-upload"
import { extractTextFromAttachments, type FileAttachment } from "@/lib/file-handler"
import type { Persona } from "@/lib/personas"
import { getRAGContext } from "@/lib/rag-service"
import { parseSlashCommand, getCommandSuggestions, buildCommandPrompt, type SlashCommand } from "@/lib/slash-commands"
import { memoryService } from "@/lib/memory-service"
import { ContextWindowMeter } from "@/components/context-window-meter"
import { useDraft } from "@/hooks/use-draft"
import { userProfileService } from "@/lib/user-profile"

interface SimpleChatInputProps {
  selectedPersona?: Persona
  profileContext?: string
  webSearchEnabled?: boolean
  overrideModel?: string // Override the model
}

export function SimpleChatInput({ selectedPersona, profileContext, webSearchEnabled: initialWebSearchEnabled, overrideModel }: SimpleChatInputProps = {}) {
  const { currentChatId, addMessage, createChat, settings, chats, setChats, user, isChatLoading, setIsChatLoading } = useApp()

  // Draft auto-save system
  const { draft, saveDraft, clearDraft, isRestored } = useDraft(currentChatId)
  const [input, setInput] = useState("")

  // Restore draft when hook is ready
  useEffect(() => {
    if (isRestored && draft && !input) {
      setInput(draft)
    }
  }, [isRestored, draft])
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const [language, setLanguage] = useState(languageService.getLanguage())
  const [commandSuggestions, setCommandSuggestions] = useState<SlashCommand[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [imageMode, setImageMode] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Detect if we're in Advanced mode (from localStorage, not persona-based)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  // Load web search state from localStorage (PERSIST USER PREFERENCE!)
  const [webSearchEnabled, setWebSearchEnabled] = useState(() => {
    if (typeof window === "undefined") return initialWebSearchEnabled ?? true
    const saved = localStorage.getItem("chameleon-web-search-enabled")
    if (saved !== null) {
      return saved === "true"
    }
    return initialWebSearchEnabled ?? true
  })

  // Load reasoning state from localStorage
  const [reasoningEnabled, setReasoningEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    const saved = localStorage.getItem("chameleon-reasoning-enabled")
    return saved === "true"
  })

  // Check if current model supports reasoning
  const model = overrideModel || settings.selectedModel || "x-ai/grok-4.1-fast"
  const modelSupportsReasoning = REASONING_MODELS.has(model)

  // OPTIMIZED: Combined localStorage saves to reduce useEffect count
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chameleon-web-search-enabled", String(webSearchEnabled))
      localStorage.setItem("chameleon-reasoning-enabled", String(reasoningEnabled))
    }
  }, [webSearchEnabled, reasoningEnabled])

  useEffect(() => {
    const mode = localStorage.getItem("app-mode")
    setIsAdvancedMode(mode === "advanced")
  }, [])

  // Update command suggestions when input changes (Advanced mode only)
  useEffect(() => {
    if (!isAdvancedMode) {
      setCommandSuggestions([])
      return
    }

    if (input.startsWith('/')) {
      const suggestions = getCommandSuggestions(input.split('\n')[0]) // Only first line
      setCommandSuggestions(suggestions)
      setSelectedSuggestionIndex(0)
    } else {
      setCommandSuggestions([])
    }
  }, [input, isAdvancedMode])

  // OPTIMIZED: Combined all window event listeners into single useEffect
  useEffect(() => {
    const handleInsertPrompt = (e: CustomEvent) => {
      setInput(e.detail)
    }

    const handleSetImageMode = (e: CustomEvent) => {
      setImageMode(e.detail)
    }

    const handleSendQuickMessage = (e: CustomEvent) => {
      const prompt = e.detail
      if (prompt && !isChatLoading) {
        setInput(prompt)
        // Submit after a short delay to ensure state is updated
        setTimeout(() => {
          const form = document.querySelector('form[class*="max-w-3xl"]') as HTMLFormElement
          if (form) {
            form.requestSubmit()
          }
        }, 50)
      }
    }

    window.addEventListener("insertPrompt" as any, handleInsertPrompt)
    window.addEventListener("setImageMode" as any, handleSetImageMode)
    window.addEventListener("sendQuickMessage" as any, handleSendQuickMessage)

    return () => {
      window.removeEventListener("insertPrompt" as any, handleInsertPrompt)
      window.removeEventListener("setImageMode" as any, handleSetImageMode)
      window.removeEventListener("sendQuickMessage" as any, handleSendQuickMessage)
    }
  }, [isChatLoading])

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsChatLoading(false)
      toast({
        title: "Gestoppt",
        description: "Antwort wurde abgebrochen",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachedFiles.length === 0) || isChatLoading) return

    console.log("[Simple Chat] Starting chat submission")
    abortControllerRef.current = new AbortController()

    let chatId = currentChatId
    if (!chatId) {
      chatId = createChat()
      console.log("[Simple Chat] Created new chat:", chatId)
    }

    let messageContent = input.trim()

    // Parse slash commands in Advanced mode
    if (isAdvancedMode) {
      const commandParse = parseSlashCommand(messageContent)
      if (commandParse.isCommand && commandParse.command) {
        messageContent = buildCommandPrompt(commandParse.command, commandParse.remainingText)
        console.log("[Simple Chat] Slash command detected:", commandParse.command.command, "→", messageContent.substring(0, 50))
      }
    }

    if (attachedFiles.length > 0) {
      const fileContext = extractTextFromAttachments(attachedFiles)
      messageContent = `${messageContent}\n\n${fileContext}`
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: messageContent,
      timestamp: Date.now(),
      attachments: attachedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.dataUrl || "",
      })),
    }

    addMessage(chatId, userMessage)
    console.log("[Simple Chat] Added user message")
    setInput("")
    clearDraft() // Clear saved draft after successful send
    setAttachedFiles([])
    setIsChatLoading(true)

    // Handle image generation mode
    if (imageMode) {
      try {
        const imageModel = settings.selectedModel || "openai/dall-e-3"
        const isDallE = imageModel === 'openai/dall-e-2' || imageModel === 'openai/dall-e-3'
        const apiKey = isDallE
          ? settings.apiKeys.openAI
          : settings.apiKeys.openRouter

        if (!apiKey) {
          throw new Error(
            isDallE
              ? 'OpenAI API key required for DALL-E. Add it in Settings → API'
              : 'OpenRouter API key required. Add it in Settings → API'
          )
        }

        toast({
          title: settings.language === "de" ? "🎨 Generiere Bild..." : "🎨 Generating image...",
          description: `${settings.language === "de" ? "Verwende" : "Using"} ${imageModel}`,
        })

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: messageContent,
            model: imageModel,
            apiKey,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to generate image')
        }

        const data = await response.json()

        const imageMessage: Message = {
          id: generateUUID(),
          role: "assistant",
          content: `${settings.language === "de" ? "Generiertes Bild" : "Generated image"}: ${messageContent}`,
          imageUrl: data.url,
          timestamp: Date.now(),
          stats: {
            model: data.model,
            responseTime: 0,
          },
        }

        addMessage(chatId, imageMessage)
        toast({
          title: settings.language === "de" ? "🎨 Bild generiert!" : "🎨 Image generated!",
          description: settings.language === "de" ? "Das Bild wurde erfolgreich erstellt" : "Image created successfully",
        })
      } catch (error) {
        console.error('[Simple Chat] Image generation error:', error)
        toast({
          title: settings.language === "de" ? "Fehler bei Bildgenerierung" : "Image generation failed",
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive",
        })
      } finally {
        setIsChatLoading(false)
        setImageMode(false)
        // Dispatch event to reset header button
        window.dispatchEvent(new CustomEvent("setImageMode", { detail: false }))
      }
      return
    }

    const currentChat = chats.find((c) => c.id === chatId)

    // Use override model or settings default
    const model = overrideModel || settings.selectedModel
    console.log("[Simple Chat] Using model:", model, overrideModel ? "(override)" : "(default)")

    // Build system prompt: Use persona prompt if provided, otherwise use settings
    let systemPrompt = selectedPersona?.prompt || settings.systemPrompt

    // Add language instruction based on UI language setting
    const languageInstruction = settings.language === "en"
      ? "\n\nIMPORTANT: Always respond in English."
      : settings.language === "de"
      ? "\n\nWICHTIG: Antworte immer auf Deutsch."
      : settings.language === "es"
      ? "\n\nIMPORTANTE: Responde siempre en español."
      : "\n\nIMPORTANT: Always respond in English."

    systemPrompt = `${systemPrompt}${languageInstruction}`

    // Add profile context - use provided prop or load from service
    const effectiveProfileContext = profileContext || userProfileService.getProfileContext()
    if (effectiveProfileContext) {
      systemPrompt = `${systemPrompt}${effectiveProfileContext}`
    }

    console.log("[Simple Chat] Using persona:", selectedPersona?.name || "Default")
    console.log("[Simple Chat] Profile context:", effectiveProfileContext ? "Loaded" : "None")
    console.log("[Simple Chat] 🔴 DEBUG - System Prompt (first 500 chars):", systemPrompt.substring(0, 500))

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(currentChat?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: messageContent },
    ]

    try {
      // Memory: Add relevant memories (works for all personas when enabled)
      if (settings.memorySettings?.enabled) {
        console.log("[Simple Chat] 🧠 Retrieving relevant memories for query:", input.trim())
        const relevantMemories = memoryService.getRelevantMemories(input.trim())

        if (relevantMemories.length > 0) {
          const memoryContext = memoryService.formatMemoriesForContext(relevantMemories)
          messages.splice(-1, 0, { role: "system" as const, content: memoryContext })
          console.log("[Simple Chat] ✅ Memory context added:", relevantMemories.length, "memories")
        }
      }

      // Web search if enabled - server has fallback API key via env vars
      console.log("[Simple Chat] Web Search check - Enabled:", webSearchEnabled)
      console.log("[Simple Chat] Search Provider:", settings.searchProvider || "tavily")

      // Track search stats
      let searchStats: { provider: string; results: number; time: number } | null = null

      if (webSearchEnabled) {
        try {
          const searchStartTime = performance.now()
          console.log("[Simple Chat] 🔍 Starting web search for query:", input.trim())
          toast({
            title: "🔍 Suche im Web...",
            description: "Sammle aktuelle Informationen",
          })

          const searchQuery = input.trim()
          let searchResults: SearchResponse

          // Simple Mode uses Tavily, Advanced Mode respects settings.searchProvider
          const searchProvider = selectedPersona ? (settings.searchProvider || "tavily") : "tavily"

          console.log(`[Simple Chat] 🔍 Using search provider: ${searchProvider.toUpperCase()}`)

          if (searchProvider === "serper") {
            console.log("[Simple Chat] Using Serper (Google Search)")
            searchResults = await searchWithSerper(searchQuery, {
              maxResults: settings.serperSettings?.maxResults || 5,
              includeImages: settings.serperSettings?.includeImages ?? true,
              country: settings.serperSettings?.country || "at",
              language: settings.serperSettings?.language || "de",
              type: settings.serperSettings?.type || "search",
              timeRange: settings.serperSettings?.timeRange || "none",
              autocorrect: settings.serperSettings?.autocorrect ?? true,
              page: settings.serperSettings?.page || 1,
              apiKey: settings.apiKeys.serper,
            })
          } else if (searchProvider === "youcom") {
            console.log("[Simple Chat] Using You.com (with livecrawl)")
            const youcomResults = await searchWithYoucom(searchQuery, {
              maxResults: settings.youcomSettings?.maxResults || 5,
              country: settings.youcomSettings?.country || "at",
              livecrawl: settings.youcomSettings?.livecrawl ?? true,
              safeSearch: settings.youcomSettings?.safeSearch || "moderate",
              freshness: settings.youcomSettings?.freshness || "none",
              apiKey: settings.apiKeys.youcom,
            })
            // Convert You.com response to SearchResponse format
            searchResults = {
              results: youcomResults.results as any,
              images: youcomResults.images || [],
              answer: youcomResults.answer
            }
          } else {
            console.log("[Simple Chat] Using Tavily")
            searchResults = await searchWeb(searchQuery, {
              maxResults: settings.tavilySettings?.maxResults || 5,
              searchDepth: settings.tavilySettings?.searchDepth || "basic",
              includeImages: settings.tavilySettings?.includeImages ?? true,
              includeDomains: settings.tavilySettings?.includeDomains,
              excludeDomains: settings.tavilySettings?.excludeDomains,
              includeRawContent: settings.tavilySettings?.includeRawContent || false,
              topic: settings.tavilySettings?.topic || "general",
              apiKey: settings.apiKeys.tavily,
            })
          }

          const searchEndTime = performance.now()
          const searchTimeSeconds = (searchEndTime - searchStartTime) / 1000

          // Store search stats
          searchStats = {
            provider: searchProvider,
            results: searchResults.results.length,
            time: searchTimeSeconds
          }

          console.log("[Simple Chat] ✅ Web search completed:", {
            provider: searchProvider.toUpperCase(),
            results: searchResults.results.length,
            time: `${searchTimeSeconds.toFixed(2)}s`
          })
          console.log("[Simple Chat] 🔍 Full search response:", JSON.stringify(searchResults, null, 2))

          let searchContext = `Websuchergebnisse für: "${input.trim()}"\n\n`

          if (searchResults.answer) {
            searchContext += `Zusammenfassung: ${searchResults.answer}\n\n`
          }

          // Use appropriate formatter
          const formatResults =
            searchProvider === "serper" ? formatSerperResults :
            searchProvider === "youcom" ? formatYoucomResults :
            formatTavilyResults

          searchContext += `Detaillierte Ergebnisse:\n${formatResults(searchResults.results)}`

          // Add images if available
          if (searchResults.images && searchResults.images.length > 0) {
            searchContext += `\n\nProduktbilder:\n${searchResults.images.map((url, i) => `![Produktbild ${i + 1}](${url})`).join('\n')}`
            console.log("[Simple Chat] 📷 Added", searchResults.images.length, "product images")
          } else {
            console.log("[Simple Chat] ⚠️ No images in search results:", searchResults.images)
          }

          searchContext += `\n\nBitte verwende die obigen Websuchergebnisse für eine aktuelle Antwort.`

          messages.splice(-1, 0, { role: "system" as const, content: searchContext })

          console.log("[Simple Chat] Web search context added to messages (length:", searchContext.length, "chars)")

          const imageCount = searchResults.images?.length || 0
          toast({
            title: "✅ Suche abgeschlossen",
            description: `${searchResults.results.length} Ergebnisse${imageCount > 0 ? ` + ${imageCount} Bilder` : ''} via ${searchProvider.charAt(0).toUpperCase() + searchProvider.slice(1)}`,
          })
        } catch (searchError) {
          console.error("[Simple Chat] ❌ Web search error:", searchError)
          toast({
            title: "⚠️ Web-Suche fehlgeschlagen",
            description: "Fahre ohne Web-Suche fort",
            variant: "destructive",
          })
          // Continue without search
          searchStats = null
        }
      } else {
        console.log("[Simple Chat] ⏭️ Web search disabled")
      }

      const assistantMessageId = generateUUID()
      let assistantContent = ""
      let reasoningContent = ""
      let messageAdded = false

      console.log("[Simple Chat] Creating assistant message:", assistantMessageId)

      const onChunk = (chunk: string) => {
        assistantContent += chunk

        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.id !== chatId) return chat

            const existingMsgIndex = chat.messages.findIndex((m) => m.id === assistantMessageId)

            if (existingMsgIndex >= 0) {
              const updatedMessages = [...chat.messages]
              updatedMessages[existingMsgIndex] = {
                ...updatedMessages[existingMsgIndex],
                content: assistantContent,
              }
              return { ...chat, messages: updatedMessages, updatedAt: Date.now() }
            } else {
              if (!messageAdded) {
                messageAdded = true
                return {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      id: assistantMessageId,
                      role: "assistant" as const,
                      content: assistantContent,
                      timestamp: Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                }
              }
              return chat
            }
          })
        })
      }

      // Use 8192 tokens for all modes (sufficient for detailed responses)
      const maxTokens = settings.maxTokens || 8192

      const onReasoning = (chunk: string) => {
        reasoningContent += chunk
      }

      await streamChatMessage(messages, model, onChunk, {
        temperature: settings.temperature || 0.7,
        maxTokens,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        apiKey: settings.apiKeys.openRouter,
        signal: abortControllerRef.current?.signal,
        reasoning: reasoningEnabled && modelSupportsReasoning,
        onReasoning,
        lmStudioEndpoint: settings.lmStudio?.endpoint, // For local models
      })

      console.log("[Simple Chat] Stream complete, final content length:", assistantContent.length)

      if (messageAdded && assistantContent) {
        const promptText = messages.map((m) => m.content).join("\n")
        const promptTokens = estimateTokens(promptText)
        const completionTokens = estimateTokens(assistantContent)
        const totalTokens = promptTokens + completionTokens
        const estimatedCost = calculateCost(promptTokens, completionTokens, model)

        const finalMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
          tokens: {
            prompt: promptTokens,
            completion: completionTokens,
            total: totalTokens,
          },
          stats: {
            model,
            cost: estimatedCost,
            ...(searchStats && {
              searchProvider: searchStats.provider,
              searchResults: searchStats.results,
              searchTime: searchStats.time,
            }),
          },
          ...(reasoningContent ? { reasoning: reasoningContent } : {}),
        }

        // Local-first: Messages are saved via setChats -> SQLite API
        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.id !== chatId) return chat
            const updatedMessages = chat.messages.map((m) =>
              m.id === assistantMessageId ? { ...m, tokens: finalMessage.tokens, stats: finalMessage.stats, reasoning: finalMessage.reasoning } : m,
            )
            return { ...chat, messages: updatedMessages }
          })
        })

        // Auto-extract memories using LLM (background, silent)
        // Only for conversations with 4+ messages to avoid test/short chats
        const currentChatForMemory = chats.find((c) => c.id === chatId)
        const messageCount = (currentChatForMemory?.messages.length || 0) + 2 // +2 for current exchange

        if (memoryService.shouldExtractMemories(messageCount)) {
          console.log("[Simple Chat] 🧠 Running automatic memory extraction...")
          memoryService.extractMemoriesWithLLM(
            messageContent,
            assistantContent,
            settings.apiKeys?.openRouter
          ).then((memories) => {
            if (memories.length > 0) {
              console.log("[Simple Chat] 💾 Auto-saved", memories.length, "new memories")
              toast({
                title: "🧠 Memory saved",
                description: `Saved ${memories.length} new ${memories.length === 1 ? 'memory' : 'memories'}`,
                duration: 2000,
              })
            }
          }).catch((err) => {
            console.error("[Simple Chat] Memory extraction failed:", err)
          })
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[Simple Chat] Generation stopped by user")
        return
      }
      console.error("[Simple Chat] Chat error:", error)

      const errorMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: `Ups! Da ist etwas schiefgelaufen. Versuch es nochmal! 😊`,
        timestamp: Date.now(),
      }
      addMessage(chatId, errorMessage)

      toast({
        title: "Fehler",
        description: "Antwort konnte nicht abgerufen werden",
        variant: "destructive",
      })
    } finally {
      setIsChatLoading(false)
      abortControllerRef.current = null
      console.log("[Simple Chat] Chat submission complete")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle command suggestions navigation (Advanced mode only)
    if (isAdvancedMode && commandSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev + 1) % commandSuggestions.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev - 1 + commandSuggestions.length) % commandSuggestions.length)
        return
      }
      if (e.key === "Tab" || (e.key === "Enter" && commandSuggestions.length > 0)) {
        e.preventDefault()
        const selected = commandSuggestions[selectedSuggestionIndex]
        setInput(selected.command + " ")
        setCommandSuggestions([])
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setCommandSuggestions([])
        return
      }
    }

    // Normal Enter submission (but not if suggestions are showing)
    if (e.key === "Enter" && !e.shiftKey && commandSuggestions.length === 0) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const selectCommand = (command: SlashCommand) => {
    setInput(command.command + " ")
    setCommandSuggestions([])
  }

  return (
    <div className="border-t border-border bg-background p-3 sm:p-4 w-full">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl w-full">
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Textarea
              id="simple-chat-input"
              name="message"
              autoComplete="off"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                saveDraft(e.target.value) // Auto-save draft
              }}
              onKeyDown={handleKeyDown}
              placeholder={getTranslation("inputPlaceholder", language)}
              className="min-h-[60px] max-h-[200px] resize-none pr-20 text-base rounded-2xl"
              disabled={isChatLoading}
            />

            {/* Slash Command Suggestions (Advanced Mode Only) */}
            {isAdvancedMode && commandSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-2 border-b border-border bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground">
                    Slash Commands ({commandSuggestions.length})
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Tab/Enter to select • Esc to dismiss
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {commandSuggestions.map((cmd, index) => (
                    <button
                      key={cmd.command}
                      type="button"
                      onClick={() => selectCommand(cmd)}
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                        index === selectedSuggestionIndex && "bg-accent"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-medium text-sm">{cmd.command}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {cmd.description}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                          {cmd.category}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute bottom-3 right-3 flex gap-1">
              <FileUpload files={attachedFiles} onFilesChange={setAttachedFiles} />
              {modelSupportsReasoning && (
                <Button
                  type="button"
                  size="icon"
                  variant={reasoningEnabled ? "default" : "ghost"}
                  className={`h-8 w-8 rounded-full ${reasoningEnabled ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  onClick={() => setReasoningEnabled(!reasoningEnabled)}
                  title={reasoningEnabled ? "Reasoning enabled - model will think step by step" : "Enable reasoning for deeper analysis"}
                >
                  <Lightbulb className={`h-4 w-4 ${reasoningEnabled ? "text-white" : ""}`} />
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant={webSearchEnabled ? "default" : "ghost"}
                className="h-8 w-8 rounded-full"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                title={webSearchEnabled ? getTranslation("webSearchEnabled", language) : getTranslation("webSearchDisabled", language)}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            type={isChatLoading ? "button" : "submit"}
            onClick={isChatLoading ? stopGeneration : undefined}
            disabled={!isChatLoading && !input.trim() && attachedFiles.length === 0}
            className="h-[60px] w-[60px] rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            size="icon"
          >
            {isChatLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        {/* Context Window Meter */}
        <div className="mt-2 flex justify-end">
          <ContextWindowMeter compact />
        </div>
      </form>
    </div>
  )
}
