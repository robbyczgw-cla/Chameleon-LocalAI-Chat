"use client"

import type React from "react"
import { FolderOpen, Send, Mic, Globe, MicOff, Square, Zap, Image, Lightbulb } from "lucide-react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Message } from "@/types"
import { streamChatMessage, REASONING_MODELS } from "@/lib/openrouter"
import { search, buildSearchContext } from "@/lib/search"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"
import { extractTextFromAttachments, type FileAttachment, getFileCategory } from "@/lib/file-handler"
import { voiceService } from "@/lib/voice"
import { buildMultimodalContent, hasImages, getImageCount, stripImageDataFromContent } from "@/lib/multimodal-utils"
import { supportsVision, getRecommendedVisionModel, validateImageForModel } from "@/lib/vision-models"
import { compressImages, getImageSizeKB } from "@/lib/image-utils"
import { haptics } from "@/lib/haptics"
import { documentCollectionService } from "@/lib/document-collections"
import { generateUUID } from "@/lib/utils"
import { estimateTokens, calculateCost } from "@/lib/token-tracker"
import { memoryService } from "@/lib/memory-service"
import { personaMemoryService } from "@/lib/persona-memory-service"
import { personaContextAwareness } from "@/lib/persona-context-awareness"
import { personaPreferencesService } from "@/lib/persona-preferences-service"
import { TokenCounterPreview } from "@/components/token-counter-preview"
import { ContextWindowMeter } from "@/components/context-window-meter"
import { parseSlashCommand, getCommandSuggestions, buildCommandPrompt, SLASH_COMMANDS } from "@/lib/slash-commands"
import { QuickModelPicker } from "@/components/quick-model-picker"
import { QuickPersonaPicker } from "@/components/quick-persona-picker"
import type { Persona } from "@/lib/personas"
import { usePromptInspectorStore } from "@/lib/prompt-inspector-store"
import { useDraft } from "@/hooks/use-draft"
import { userProfileService } from "@/lib/user-profile"

export function ChatInput() {
  const { currentChatId, addMessage, createChat, settings, chats, setChats, user, updateSettings, setIsChatLoading, updateStreamingState, resetStreamingState } = useApp()
  const currentChat = chats.find((c) => c.id === currentChatId)
  const isEmpty = !currentChat || currentChat.messages.length === 0

  // Draft auto-save system
  const { draft, saveDraft, clearDraft, isRestored } = useDraft(currentChatId)
  const [input, setInput] = useState("")

  // Restore draft when hook is ready
  useEffect(() => {
    if (isRestored && draft && !input) {
      setInput(draft)
    }
  }, [isRestored, draft])
  const [isLoading, setIsLoading] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [imageMode, setImageMode] = useState(false)
  const [reasoningEnabled, setReasoningEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    const saved = localStorage.getItem("chameleon-reasoning-enabled")
    return saved === "true"
  })

  // Check if current model supports reasoning
  const model = settings.selectedModel || "x-ai/grok-4.1-fast"
  const modelSupportsReasoning = REASONING_MODELS.has(model)

  // Save reasoning state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chameleon-reasoning-enabled", String(reasoningEnabled))
    }
  }, [reasoningEnabled])
  const [attachedCollectionId, setAttachedCollectionId] = useState<string | null>(null)
  const [commandSuggestions, setCommandSuggestions] = useState<typeof SLASH_COMMANDS>([])
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { setInspectorData } = usePromptInspectorStore()

  useEffect(() => {
    const handleInsertPrompt = (e: CustomEvent) => {
      setInput(e.detail)
    }
    const handleAttachCollection = (e: CustomEvent) => {
      setAttachedCollectionId(e.detail)
      const collection = documentCollectionService.getCollection(e.detail)
      if (collection) {
        toast({
          title: "Collection attached",
          description: `${collection.name} (${collection.documents.length} documents)`,
        })
      }
    }
    window.addEventListener("insertPrompt" as any, handleInsertPrompt)
    window.addEventListener("attachCollection" as any, handleAttachCollection)
    return () => {
      window.removeEventListener("insertPrompt" as any, handleInsertPrompt)
      window.removeEventListener("attachCollection" as any, handleAttachCollection)
    }
  }, [toast])

  const toggleVoiceInput = async () => {
    // Check if OpenAI API key is available for Whisper
    const openAiKey = settings.apiKeys.openAI
    if (!openAiKey) {
      haptics.trigger('error')
      toast({
        title: "API key erforderlich",
        description: "Bitte OpenAI API Key in den Einstellungen hinterlegen (Einstellungen → API Keys → OpenAI)",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      haptics.trigger('light')
      voiceService.stopWhisperListening()
      setIsListening(false)
    } else {
      haptics.trigger('medium')
      setIsListening(true)

      // Use Whisper API (works in all browsers including Firefox and mobile)
      await voiceService.startWhisperListening(
        openAiKey,
        (text) => {
          haptics.trigger('success')
          setInput(text)
          setIsListening(false)
          toast({
            title: "✓ Transkribiert",
            description: `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          })
        },
        (error) => {
          haptics.trigger('error')
          toast({
            title: "Sprachfehler",
            description: error,
            variant: "destructive",
          })
          setIsListening(false)
        },
        () => {
          toast({
            title: "🎤 Aufnahme gestartet",
            description: "Sprich jetzt... Klicke nochmal zum Stoppen",
          })
        }
      )
    }
  }

  const toggleSpeech = (text: string) => {
    if (!voiceService.isSupported()) {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      })
      return
    }

    if (isSpeaking) {
      voiceService.stopSpeaking()
      setIsSpeaking(false)
    } else {
      setIsSpeaking(true)
      voiceService.speak(text, {
        rate: settings.voiceSettings?.rate || 1,
        pitch: settings.voiceSettings?.pitch || 1,
        voice: settings.voiceSettings?.voice,
      })
      setTimeout(() => setIsSpeaking(false), 100)
    }
  }

  // Listen for toggle events from header
  useEffect(() => {
    const handleToggleVoice = () => toggleVoiceInput()
    const handleToggleImageMode = () => {
      haptics.trigger('selection')
      setImageMode(prev => !prev)
    }
    const handleToggleReasoning = () => setReasoningEnabled(prev => !prev)

    window.addEventListener("toggleVoice", handleToggleVoice)
    window.addEventListener("toggleImageMode", handleToggleImageMode)
    window.addEventListener("toggleReasoning", handleToggleReasoning)
    return () => {
      window.removeEventListener("toggleVoice", handleToggleVoice)
      window.removeEventListener("toggleImageMode", handleToggleImageMode)
      window.removeEventListener("toggleReasoning", handleToggleReasoning)
    }
  })

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      setIsChatLoading(false)
      toast({
        title: "Generation stopped",
        description: "Response generation has been cancelled",
      })
    }
  }, [toast, setIsChatLoading])

  // Handle input change and slash command suggestions
  const handleInputChange = useCallback((value: string) => {
    setInput(value)
    saveDraft(value) // Auto-save draft

    // Check for slash commands
    if (value.trim().startsWith('/')) {
      const suggestions = getCommandSuggestions(value.trim())
      setCommandSuggestions(suggestions)
      setShowCommandMenu(suggestions.length > 0)
    } else {
      setShowCommandMenu(false)
      setCommandSuggestions([])
    }
  }, [saveDraft])

  // Select a slash command from suggestions
  const selectCommand = useCallback((command: typeof SLASH_COMMANDS[0]) => {
    setInput(command.command + ' ')
    setShowCommandMenu(false)
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return

    haptics.trigger('medium')
    console.log("[v0] Starting chat submission")
    abortControllerRef.current = new AbortController()

    let chatId = currentChatId
    if (!chatId) {
      chatId = createChat()
      console.log("[v0] Created new chat:", chatId)
    }

    let messageContent = input.trim()

    // Parse slash commands
    const { isCommand, command, remainingText } = parseSlashCommand(messageContent)
    if (isCommand && command) {
      messageContent = buildCommandPrompt(command, remainingText)
      toast({
        title: `Slash Command: ${command.command}`,
        description: command.description,
      })
    }

    // Compress images before sending to prevent 413 errors
    let processedFiles = attachedFiles
    const imageAttachments = attachedFiles.filter(f => getFileCategory(f.name) === "image")

    if (imageAttachments.length > 0) {
      toast({
        title: "🖼️ Compressing images...",
        description: `Processing ${imageAttachments.length} image(s)`,
      })

      try {
        // Compress all images to stay under payload limit
        const imageDataUrls = imageAttachments.map(img => img.dataUrl || "").filter(Boolean)
        const compressedDataUrls = await compressImages(imageDataUrls, 500) // 500KB max per image

        // Create new array with compressed images
        let compressedIndex = 0
        processedFiles = attachedFiles.map(file => {
          if (getFileCategory(file.name) === "image" && file.dataUrl) {
            const compressed = compressedDataUrls[compressedIndex++]
            const originalKB = getImageSizeKB(file.dataUrl)
            const compressedKB = getImageSizeKB(compressed)
            console.log(`[Image] ${file.name}: ${originalKB.toFixed(0)}KB → ${compressedKB.toFixed(0)}KB`)
            return { ...file, dataUrl: compressed }
          }
          return file
        })
      } catch (error) {
        console.error("[Image] Compression failed:", error)
        toast({
          title: "⚠️ Image compression failed",
          description: "Using original images",
          variant: "destructive",
        })
      }
    }

    // Build multimodal content (properly handles images for vision models)
    const multimodalContent = buildMultimodalContent(messageContent, processedFiles)
    const currentModel = chats.find((c) => c.id === chatId)?.model || settings.selectedModel
    const modelSupportsVision = supportsVision(currentModel)

    // Warn or auto-switch if images are attached but model doesn't support vision
    if (imageAttachments.length > 0 && !modelSupportsVision) {
      const recommendedModel = getRecommendedVisionModel(currentModel)

      toast({
        title: "⚠️ Model doesn't support images",
        description: `Switching to ${recommendedModel.split('/')[1]} for vision support`,
        duration: 4000,
      })

      // Auto-switch to vision-capable model
      if (chatId) {
        const currentChat = chats.find((c) => c.id === chatId)
        if (currentChat) {
          setChats(chats.map(c =>
            c.id === chatId ? { ...c, model: recommendedModel } : c
          ))
        }
      } else {
        updateSettings({ selectedModel: recommendedModel })
      }
    }

    // Validate image size/count for the model
    if (imageAttachments.length > 0) {
      const totalSizeMB = imageAttachments.reduce((sum, f) => sum + (f.size / 1024 / 1024), 0)
      const validation = validateImageForModel(
        modelSupportsVision ? currentModel : getRecommendedVisionModel(currentModel),
        imageAttachments.length,
        totalSizeMB
      )

      if (!validation.valid) {
        haptics.trigger('error')
        toast({
          title: "Image validation failed",
          description: validation.error,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: multimodalContent, // Now supports both string and multimodal array
      timestamp: Date.now(),
      attachments: processedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.dataUrl || "",
      })),
    }

    addMessage(chatId, userMessage)
    console.log("[v0] Added user message")
    setInput("")
    clearDraft() // Clear saved draft after successful send
    setAttachedFiles([])
    setIsLoading(true)
    setIsChatLoading(true) // Triggers loading animation in ChatMessages

    // Initialize streaming state
    const streamStartTime = Date.now()
    const modelToUse = chats.find((c) => c.id === chatId)?.model || settings.selectedModel
    console.log("[Streaming] Initializing streaming state with model:", modelToUse)
    updateStreamingState({
      isStreaming: true,
      phase: "thinking",
      currentAction: "Processing request...",
      startTime: streamStartTime,
      model: modelToUse,
    })

    // Handle image generation mode
    if (imageMode) {
      try {
        const currentChat = chats.find((c) => c.id === chatId)
        const imageModel = currentChat?.model || settings.selectedModel

        // Determine which API key to use
        // DALL-E 2/3 use OpenAI API directly, everything else uses OpenRouter
        const isDallE = imageModel === 'openai/dall-e-2' || imageModel === 'openai/dall-e-3'
        const apiKey = isDallE
          ? settings.apiKeys.openAI // Classic DALL-E needs OpenAI key
          : settings.apiKeys.openRouter // GPT-5 Image, Gemini Image, etc. use OpenRouter

        if (!apiKey) {
          throw new Error(
            isDallE
              ? 'OpenAI API key required for DALL-E. Add it in Settings → API Keys'
              : 'OpenRouter API key required. Add it in Settings → API Keys'
          )
        }

        toast({
          title: "🎨 Generiere Bild...",
          description: `Verwende ${imageModel}`,
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
          content: `Generated image: ${messageContent}`,
          imageUrl: data.url,
          timestamp: Date.now(),
          stats: {
            model: data.model,
            responseTime: 0,
          },
        }

        addMessage(chatId, imageMessage)
        haptics.trigger('success')
        toast({
          title: "🎨 Bild generiert!",
          description: "Das Bild wurde erfolgreich erstellt",
        })
      } catch (error) {
        console.error('Image generation error:', error)
        haptics.trigger('error')
        toast({
          title: "Fehler bei Bildgenerierung",
          description: error instanceof Error ? error.message : 'Unbekannter Fehler',
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
        setIsChatLoading(false)
        resetStreamingState()
        setImageMode(false) // Reset image mode after generation
      }
      return
    }

    const currentChat = chats.find ((c) => c.id === chatId)
    const model = currentChat?.model || settings.selectedModel
    console.log("[v0] Using model:", model)

    // Build system prompt: Base + Language instruction + Persona personality
    let systemPrompt = settings.systemPrompt // Start with base

    // Add language instruction based on UI language setting
    const languageInstruction = settings.language === "en"
      ? "\n\nIMPORTANT: Always respond in English."
      : settings.language === "de"
      ? "\n\nWICHTIG: Antworte immer auf Deutsch."
      : settings.language === "es"
      ? "\n\nIMPORTANTE: Responde siempre en español."
      : "\n\nIMPORTANT: Always respond in English."

    systemPrompt = `${systemPrompt}${languageInstruction}`

    if (settings.selectedPersona) {
      if (settings.selectedPersona.personality) {
        // New format: Base prompt + language + persona personality
        systemPrompt = `${systemPrompt}\n\n--- PERSONA PERSONALITY ---\n${settings.selectedPersona.personality}`
        console.log("[v0] Using persona with personality:", settings.selectedPersona.name)
      } else if (settings.selectedPersona.prompt) {
        // Old format: Full prompt (backward compatibility)
        systemPrompt = `${settings.selectedPersona.prompt}${languageInstruction}`
        console.log("[v0] Using persona with legacy prompt:", settings.selectedPersona.name)
      }
    }

    // Add user profile context to system prompt
    const userProfile = userProfileService.getProfile()
    const profileContext = userProfileService.getProfileContext(userProfile)
    if (profileContext) {
      systemPrompt = `${systemPrompt}${profileContext}`
      console.log("[v0] Added user profile context to system prompt")
    }

    const messages = [
      { role: "system" as const, content: systemPrompt },
      // CRITICAL: Strip image data from historical messages to prevent PWA crashes
      // Vision models only look at images in the current message anyway
      ...(currentChat?.messages || []).map((m) => ({
        role: m.role,
        content: stripImageDataFromContent(m.content), // Remove old image data for memory efficiency
      })),
      { role: "user" as const, content: multimodalContent }, // Current message keeps full image data
    ]

    try {
      if (attachedCollectionId) {
        const collectionContext = documentCollectionService.getCollectionContext(
          attachedCollectionId,
          input.trim(),
          4000,
        )
        if (collectionContext) {
          messages.splice(1, 0, {
            role: "system" as const,
            content: `Relevant documents from knowledge base:\n\n${collectionContext}`,
          })
        }
      }

      // Web search with unified provider selection
      const searchProvider = settings.searchProvider || "tavily"
      const hasSearchKey =
        (searchProvider === "tavily" && settings.apiKeys.tavily) ||
        (searchProvider === "serper" && settings.apiKeys.serper) ||
        (searchProvider === "exa" && settings.apiKeys.exa)

      if (webSearchEnabled && hasSearchKey) {
        try {
          // Show provider-specific toast
          const toastMessages = {
            exa: { title: "🔮 Exa Neural Search...", description: "Semantische Suche mit AI-Verständnis" },
            serper: { title: "🔍 Google Search (Serper)...", description: "Suche via Google" },
            tavily: { title: "🌐 Tavily Search...", description: "Sammle Informationen aus dem Internet" },
          }
          toast(toastMessages[searchProvider])

          // Build provider-specific options
          const searchOptions = searchProvider === "exa" ? {
            maxResults: settings.exaSettings?.maxResults || 5,
            type: settings.exaSettings?.searchType || "auto",
            useAutoprompt: settings.exaSettings?.useAutoprompt ?? true,
            includeFullText: settings.exaSettings?.includeFullText ?? true,
            includeHighlights: settings.exaSettings?.includeHighlights ?? true,
            includeSummary: settings.exaSettings?.includeSummary ?? false,
            includeImages: settings.exaSettings?.includeImages ?? false,
            highlightsPerResult: settings.exaSettings?.highlightsPerResult || 3,
            maxTextCharacters: settings.exaSettings?.maxTextCharacters || 3000,
            livecrawl: settings.exaSettings?.livecrawl || "fallback",
            category: settings.exaSettings?.category,
            includeDomains: settings.exaSettings?.includeDomains,
            excludeDomains: settings.exaSettings?.excludeDomains,
            apiKey: settings.apiKeys.exa,
          } : searchProvider === "serper" ? {
            maxResults: settings.serperSettings?.maxResults || 5,
            includeImages: settings.serperSettings?.includeImages ?? false,
            country: settings.serperSettings?.country || "at",
            language: settings.serperSettings?.language || "de",
            type: settings.serperSettings?.type || "search",
            timeRange: settings.serperSettings?.timeRange || "none",
            autocorrect: settings.serperSettings?.autocorrect ?? true,
            apiKey: settings.apiKeys.serper,
          } : {
            maxResults: settings.tavilySettings?.maxResults || 5,
            searchDepth: settings.tavilySettings?.searchDepth || "basic",
            includeImages: settings.tavilySettings?.includeImages ?? false,
            includeDomains: settings.tavilySettings?.includeDomains,
            excludeDomains: settings.tavilySettings?.excludeDomains,
            includeRawContent: settings.tavilySettings?.includeRawContent ?? false,
            topic: settings.tavilySettings?.topic || "general",
            apiKey: settings.apiKeys.tavily,
          }

          // Use unified search function
          const searchResponse = await search(searchProvider, input.trim(), searchOptions)

          // Build context using unified formatter
          const searchContext = buildSearchContext(searchResponse, {
            includeImages: settings.tavilySettings?.includeImages || settings.serperSettings?.includeImages || settings.exaSettings?.includeImages,
          })

          messages.splice(-1, 0, { role: "system" as const, content: searchContext })

          // Show success toast
          const imageCount = searchResponse.images?.length || 0
          toast({
            title: searchProvider === "exa" ? "🔮 Exa Search abgeschlossen" :
                   searchProvider === "serper" ? "🔍 Serper abgeschlossen" :
                   "🌐 Suche abgeschlossen",
            description: `${searchResponse.results.length} Ergebnisse${imageCount > 0 ? ` + ${imageCount} Bilder` : ''} gefunden`,
          })

        } catch (searchError) {
          console.error("[v0] Search error:", searchError)
          toast({
            title: "Suche fehlgeschlagen",
            description: `${searchProvider === "exa" ? "Exa" : searchProvider === "serper" ? "Serper" : "Tavily"} Suche fehlgeschlagen - fahre ohne Websuche fort`,
            variant: "destructive",
          })
        }
      }

      // Memory: Add relevant memories if enabled
      if (settings.memorySettings?.enabled) {
        console.log("[ChatInput] 🧠 Retrieving relevant memories for query:", input.trim())
        const relevantMemories = memoryService.getRelevantMemories(input.trim())

        if (relevantMemories.length > 0) {
          const memoryContext = memoryService.formatMemoriesForContext(relevantMemories)
          messages.splice(-1, 0, { role: "system" as const, content: memoryContext })
          console.log("[ChatInput] ✅ Memory context added:", relevantMemories.length, "memories")
        }
      }

      // Persona Memory: Add persona-specific memories if enabled
      if (settings.selectedPersona?.memorySettings?.enabled) {
        console.log("[ChatInput] 👤 Retrieving persona memories for:", settings.selectedPersona.name)
        const relevantConversations = personaMemoryService.getRelevantConversations(
          settings.selectedPersona.id,
          input.trim(),
          3
        )

        if (relevantConversations.length > 0) {
          const personaMemoryContext = personaMemoryService.formatConversationsForContext(relevantConversations)
          messages.splice(-1, 0, { role: "system" as const, content: personaMemoryContext })
          console.log("[ChatInput] ✅ Persona memory context added:", relevantConversations.length, "conversations")
        }
      }

      // Context Awareness: Add time, mood, and topic awareness if enabled
      if (settings.selectedPersona?.contextSettings?.enabled) {
        console.log("[ChatInput] 🎯 Adding context awareness for:", settings.selectedPersona.name)

        const currentChatMessages = currentChat?.messages || []
        const userMessages = currentChatMessages.filter((m) => m.role === "user").map((m) => m.content)
        userMessages.push(input.trim()) // Add current message

        const contextData = personaContextAwareness.generateContextData(userMessages)
        const contextPrompt = personaContextAwareness.formatContextForPrompt(
          contextData,
          settings.selectedPersona.name,
          {
            useTimeBasedGreetings: settings.selectedPersona.contextSettings.useTimeBasedGreetings,
            detectMood: settings.selectedPersona.contextSettings.detectMood,
            trackTopics: settings.selectedPersona.contextSettings.trackTopics,
          }
        )

        if (contextPrompt) {
          messages.splice(-1, 0, { role: "system" as const, content: contextPrompt })
          console.log("[ChatInput] ✅ Context awareness added:", contextData)
        }
      }

      // Learned Preferences: Add user's learned preferences if persona has any
      if (settings.selectedPersona) {
        const preferencesContext = personaPreferencesService.formatPreferencesForContext(
          settings.selectedPersona.id,
          settings.selectedPersona.name
        )

        if (preferencesContext) {
          messages.splice(-1, 0, { role: "system" as const, content: preferencesContext })
          console.log("[ChatInput] 🎓 Learned preferences added for", settings.selectedPersona.name)
        }
      }

      const assistantMessageId = generateUUID()
      let assistantContent = ""
      let reasoningContent = ""
      let messageAdded = false

      console.log("[v0] Creating assistant message:", assistantMessageId)

      const modelParams = settings.modelParameters || {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
      }

      const enforcedMaxTokens = Math.max(
        modelParams.maxTokens || 4096,
        settings.maxTokens || 4096,
        settings.modelParameters?.maxTokens || 4096,
        4096,
      )

      modelParams.maxTokens = enforcedMaxTokens

      console.log("[v0] Starting stream with model:", model)

      const promptText = messages.map((m) => m.content).join("\n")
      const promptTokens = estimateTokens(promptText)

      // Capture data for Prompt Inspector
      setInspectorData({
        systemPrompt: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        modelParams: {
          model: model,
          temperature: modelParams.temperature,
          maxTokens: modelParams.maxTokens,
          topP: modelParams.topP,
          frequencyPenalty: modelParams.frequencyPenalty,
          presencePenalty: modelParams.presencePenalty,
        },
        timestamp: Date.now(),
      })
      console.log("[v0] Inspector data captured")

      let chunkCount = 0
      let firstChunkTime: number | null = null

      const onChunk = (chunk: string) => {
        assistantContent += chunk
        chunkCount++

        // Track first token time
        if (!firstChunkTime) {
          firstChunkTime = Date.now()
          const ttft = (firstChunkTime - streamStartTime) / 1000
          console.log("[Streaming] First token received, TTFT:", ttft)
          updateStreamingState({
            phase: "generating",
            currentAction: "Generating response...",
            firstTokenTime: ttft,
          })
        }

        // Update token count and speed (estimate tokens from content length)
        const estimatedTokens = Math.ceil(assistantContent.length / 4)
        const elapsedSeconds = (Date.now() - (firstChunkTime || streamStartTime)) / 1000
        const tokensPerSecond = elapsedSeconds > 0 ? estimatedTokens / elapsedSeconds : 0

        // Log every 50 chunks to avoid spam
        if (chunkCount % 50 === 0) {
          console.log("[Streaming] Tokens:", estimatedTokens, "Speed:", tokensPerSecond.toFixed(1), "t/s")
        }

        updateStreamingState({
          tokenCount: estimatedTokens,
          tokensPerSecond: Math.round(tokensPerSecond * 10) / 10,
        })

        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.id !== chatId) return chat

            const existingMsgIndex = chat.messages.findIndex((m) => m.id === assistantMessageId)

            if (existingMsgIndex >= 0) {
              // Update existing assistant message with new content
              const updatedMessages = [...chat.messages]
              updatedMessages[existingMsgIndex] = {
                ...updatedMessages[existingMsgIndex],
                content: assistantContent,
              }
              return { ...chat, messages: updatedMessages, updatedAt: Date.now() }
            } else {
              // Add new assistant message (only if not already present)
              // Check inside the callback to avoid race conditions
              const alreadyHasAssistantMsg = chat.messages.some((m) => m.id === assistantMessageId)
              if (!alreadyHasAssistantMsg) {
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

      const onReasoning = (chunk: string) => {
        reasoningContent += chunk
        // Update streaming state with reasoning info
        updateStreamingState({
          phase: "reasoning",
          currentAction: "Thinking deeply...",
          reasoningTokens: Math.ceil(reasoningContent.length / 4),
          reasoningContent: reasoningContent.slice(-200), // Last 200 chars
        })
      }

      // Determine which search API key to use based on provider
      const autoSearchProvider = settings.searchProvider || "tavily"
      const autoSearchApiKey =
        autoSearchProvider === "tavily"
          ? settings.apiKeys.tavily
          : autoSearchProvider === "serper"
          ? settings.apiKeys.serper
          : settings.apiKeys.exa

      // Build search settings based on provider
      const autoSearchSettings =
        autoSearchProvider === "tavily"
          ? settings.tavilySettings || {}
          : autoSearchProvider === "serper"
          ? settings.serperSettings || {}
          : settings.exaSettings || {}

      await streamChatMessage(messages, model, onChunk, {
        temperature: modelParams.temperature,
        maxTokens: modelParams.maxTokens,
        topP: modelParams.topP,
        frequencyPenalty: modelParams.frequencyPenalty,
        presencePenalty: modelParams.presencePenalty,
        apiKey: settings.apiKeys.openRouter,
        signal: abortControllerRef.current?.signal,
        reasoning: reasoningEnabled && modelSupportsReasoning,
        onReasoning,
        lmStudioEndpoint: settings.lmStudio?.endpoint, // For local models
        // Auto search (tool calling) - AI decides when to search
        enableAutoSearch: settings.experimental?.enableAutoSearch ?? false,
        searchProvider: autoSearchProvider,
        searchApiKey: autoSearchApiKey,
        searchSettings: autoSearchSettings,
        onSearchStart: (query) => {
          updateStreamingState({
            phase: "searching",
            currentAction: "Searching the web...",
            searchQuery: query,
            searchProvider: autoSearchProvider,
          })
          toast({
            title: "🔍 AI is searching the web...",
            description: query ? `"${query}"` : "Searching...",
          })
        },
        onSearchComplete: () => {
          updateStreamingState({
            phase: "generating",
            currentAction: "Processing search results...",
          })
          toast({
            title: "✅ Search complete",
            description: "Processing results...",
          })
        },
      })

      console.log("[v0] Stream complete, final content length:", assistantContent.length)

      if (messageAdded && assistantContent) {
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
          ...(reasoningContent ? { reasoning: reasoningContent } : {}),
        }

        // Local-first: Messages are saved via setChats -> SQLite API
        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.id !== chatId) return chat
            const updatedMessages = chat.messages.map((m) =>
              m.id === assistantMessageId ? { ...m, tokens: finalMessage.tokens, reasoning: finalMessage.reasoning } : m,
            )
            return { ...chat, messages: updatedMessages }
          })
        })

        // CRITICAL: Save assistant message to SQLite (was missing!)
        console.log("[v0] Saving assistant message to SQLite")
        fetch('/api/db/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...finalMessage,
            chatId,
          }),
        }).catch((err) => console.error("[v0] Failed to save assistant message:", err))

        // Save conversation to persona memory and learn preferences if enabled
        if (settings.selectedPersona) {
          const currentChatMessages = chats.find((c) => c.id === chatId)?.messages || []
          const userMessages = currentChatMessages.filter((m) => m.role === "user").map((m) => m.content)
          const assistantMessages = currentChatMessages
            .filter((m) => m.role === "assistant")
            .map((m) => m.content)

          // Add the new messages
          userMessages.push(messageContent)
          assistantMessages.push(assistantContent)

          // Save to memory if enabled
          if (settings.selectedPersona.memorySettings?.enabled) {
            const summary = personaMemoryService.generateSummary(userMessages, assistantMessages)
            const topics = personaMemoryService.extractTopics(userMessages, assistantMessages)

            personaMemoryService.addConversation(
              settings.selectedPersona.id,
              summary,
              topics,
              userMessages,
              assistantMessages,
              settings.selectedPersona.memorySettings.maxConversations || 10
            )

            console.log("[ChatInput] 💾 Saved conversation to persona memory:", settings.selectedPersona.name)
          }

          // Record interaction for relationship depth (always, even if memory disabled)
          const hasCodeBlocks = /```/.test(assistantContent)
          const topicDepth = assistantContent.length > 500 ? "deep" : assistantContent.length > 200 ? "medium" : "shallow"

          personaPreferencesService.recordInteraction(
            settings.selectedPersona.id,
            assistantContent.length,
            hasCodeBlocks,
            topicDepth as "shallow" | "medium" | "deep"
          )

          // Extract preferences from conversation
          personaPreferencesService.extractPreferencesFromConversation(
            settings.selectedPersona.id,
            userMessages,
            assistantMessages
          )

          console.log("[ChatInput] 🎓 Interaction recorded and preferences extracted for", settings.selectedPersona.name)
        }

        // Auto-extract memories using LLM (background, silent)
        // Only for conversations with 4+ messages to avoid test/short chats
        const currentChatForMemory = chats.find((c) => c.id === chatId)
        const messageCount = (currentChatForMemory?.messages.length || 0) + 2 // +2 for current exchange

        if (memoryService.shouldExtractMemories(messageCount)) {
          console.log("[ChatInput] 🧠 Running automatic memory extraction...")
          // Run in background - don't await, don't block UI
          memoryService.extractMemoriesWithLLM(
            messageContent,
            assistantContent,
            settings.apiKeys?.openRouter
          ).then((memories) => {
            if (memories.length > 0) {
              console.log("[ChatInput] 💾 Auto-saved", memories.length, "new memories")
              toast({
                title: "🧠 Memory saved",
                description: `Saved ${memories.length} new ${memories.length === 1 ? 'memory' : 'memories'}`,
                duration: 2000,
              })
            }
          }).catch((err) => {
            console.error("[ChatInput] Memory extraction failed:", err)
          })
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[v0] Generation stopped by user")
        return
      }
      console.error("[v0] Chat error:", error)

      const errorMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        timestamp: Date.now(),
      }
      addMessage(chatId, errorMessage)

      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Antwort konnte nicht abgerufen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsChatLoading(false)
      resetStreamingState() // Clear streaming visualization
      setAttachedCollectionId(null)
      abortControllerRef.current = null
      console.log("[v0] Chat submission complete")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className={cn(
      "bg-background p-2 sm:p-4 md:p-5 border-t-2 border-border/50 smooth-transition",
      isEmpty ? "shadow-2xl rounded-2xl border-2 border-border/40 glass-strong" : "shadow-xl"
    )}>
      {attachedCollectionId && (
        <div className="mx-auto max-w-4xl mb-3 md:mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-muted/70 to-muted/50 border border-border/40 px-4 py-2.5 text-xs sm:text-sm shadow-sm">
          <FolderOpen className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
          <span className="font-medium">Collection attached: {documentCollectionService.getCollection(attachedCollectionId)?.name}</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7 px-3 hover:bg-background/80 rounded-lg transition-all" onClick={() => setAttachedCollectionId(null)}>
            Remove
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        {/* Compact Toolbar - single row, smaller on mobile */}
        <div className="flex items-center gap-1 mb-1.5 text-xs overflow-x-auto">
          <div className="shrink-0"><QuickModelPicker /></div>
          <div className="shrink-0"><QuickPersonaPicker /></div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            {/* Slash Command Autocomplete Menu */}
            {showCommandMenu && commandSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-3 md:mb-4 bg-background border-2 border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[300px] md:max-h-[350px] overflow-y-auto animate-slide-in-down">
                <div className="p-3 md:p-3.5 border-b border-border/40 gradient-glass">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-semibold">
                    <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary glow-subtle" />
                    <span>Slash Commands</span>
                  </div>
                </div>
                {commandSuggestions.map((cmd) => (
                  <button
                    key={cmd.command}
                    type="button"
                    onClick={() => selectCommand(cmd)}
                    className="w-full text-left px-3 md:px-4 py-2.5 md:py-3 hover:bg-accent/70 smooth-transition hover-lift flex items-start gap-2 md:gap-3 border-b border-border/20 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm md:text-base">{cmd.command}</div>
                      <div className="text-xs md:text-sm text-muted-foreground/90 mt-0.5">{cmd.description}</div>
                    </div>
                    <span className="text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-md font-medium">{cmd.category}</span>
                  </button>
                ))}
              </div>
            )}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              className="min-h-[40px] max-h-[200px] resize-none md:pr-28 text-sm sm:text-base rounded-xl bg-muted/30 border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm transition-all duration-200 py-2"
              disabled={isLoading}
            />
            {/* Buttons inside textarea */}
            <div className="absolute bottom-2 right-2 flex gap-0.5 md:gap-1">
              {/* Web search */}
              <Button
                type="button"
                size="icon"
                variant={webSearchEnabled ? "default" : "ghost"}
                className="h-7 w-7 md:h-8 md:w-8 rounded-lg transition-all"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                title="Web search"
              >
                <Globe className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              {/* File upload - next to search */}
              <FileUpload files={attachedFiles} onFilesChange={setAttachedFiles} />
              {/* Desktop only: Voice, Image, Reasoning */}
              <div className="hidden md:flex gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "default" : "ghost"}
                  className="h-8 w-8 rounded-lg transition-all"
                  onClick={toggleVoiceInput}
                  title="Voice input"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant={imageMode ? "default" : "ghost"}
                  className="h-8 w-8 rounded-lg transition-all"
                  onClick={() => {
                    haptics.trigger('selection')
                    setImageMode(!imageMode)
                  }}
                  title="Image mode"
                >
                  <Image className="h-4 w-4" />
                </Button>
                {modelSupportsReasoning && (
                  <Button
                    type="button"
                    size="icon"
                    variant={reasoningEnabled ? "default" : "ghost"}
                    className={`h-8 w-8 rounded-lg transition-all ${reasoningEnabled ? "bg-amber-500" : ""}`}
                    onClick={() => setReasoningEnabled(!reasoningEnabled)}
                    title="Reasoning"
                  >
                    <Lightbulb className={`h-4 w-4 ${reasoningEnabled ? "text-white" : ""}`} />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Button
            type={isLoading ? "button" : "submit"}
            onClick={isLoading ? stopGeneration : undefined}
            disabled={!isLoading && !input.trim() && attachedFiles.length === 0}
            className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        <div className="mt-1 hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
          <TokenCounterPreview input={input} />
          <ContextWindowMeter compact />
        </div>
      </form>
    </div>
  )
}
