"use client"
// Cache bust: v2024-discussion-mode-lmstudio
import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Swords, Sparkles, Loader2, Trophy, Scale, Lightbulb, Target, CheckCircle2, XCircle, AlertCircle, TrendingUp, Cpu } from "lucide-react"
import { streamChatMessage } from "@/lib/openrouter"
import { getUserSelectedModels } from "@/lib/model-preferences"
import { POPULAR_OPENROUTER_MODELS } from "@/lib/openrouter"
import { cn } from "@/lib/utils"
import { searchWeb } from "@/lib/tavily"
import { searchWithSerper } from "@/lib/serper"

interface DebateMessage {
  model: string
  modelName: string
  content: string
  round: number
  timestamp: number
}

interface FactCheck {
  claim: string
  round: number
  model: string
  modelName: string
  verification: string
  sources: string[]
  confidence: "high" | "medium" | "low"
  timestamp: number
}

interface ArgumentNode {
  id: string
  model: string
  modelName: string
  round: number
  type: "claim" | "counter" | "evidence"
  content: string
  parentId?: string
}

interface ModelScore {
  arguments: number
  factAccuracy: number
  rebuttals: number
  clarity: number
  total: number
}

interface Scores {
  model1: ModelScore
  model2: ModelScore
}

type DebateStyle = "freestyle" | "oxford" | "socratic"
type TopicCategory = "philosophy" | "technology" | "society" | "fun" | "custom"

const DEBATE_TOPICS: Record<TopicCategory, { label: string; emoji: string; examples: string[] }> = {
  philosophy: {
    label: "Philosophy",
    emoji: "🤔",
    examples: [
      "Is free will an illusion?",
      "Does objective morality exist?",
      "What makes a good life?",
    ],
  },
  technology: {
    label: "Technology",
    emoji: "💻",
    examples: [
      "Should AGI be more heavily regulated?",
      "Is cryptocurrency the future of money?",
      "Do social media do more harm than good?",
    ],
  },
  society: {
    label: "Society",
    emoji: "🏛️",
    examples: [
      "Universal Basic Income - Pro or Con?",
      "Is remote work better than office?",
      "Should education be completely free?",
    ],
  },
  fun: {
    label: "Fun",
    emoji: "🎉",
    examples: [
      "Pineapple on pizza - crime or culinary masterpiece?",
      "Cats vs. Dogs - which is better?",
      "Is a hot dog a sandwich?",
    ],
  },
  custom: {
    label: "Custom",
    emoji: "✏️",
    examples: [],
  },
}

const DEBATE_STYLES: Record<DebateStyle, { label: string; description: string; emoji: string }> = {
  freestyle: {
    label: "Freestyle",
    emoji: "🎭",
    description: "Open and creative - no rules",
  },
  oxford: {
    label: "Oxford",
    emoji: "🎓",
    description: "Formal structure with clear arguments",
  },
  socratic: {
    label: "Socratic",
    emoji: "💬",
    description: "Lead through questions to contradiction",
  },
}

interface LMStudioModel {
  id: string
  name: string
}

export function AIDebateMode() {
  const { settings } = useApp()
  const [topic, setTopic] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>("custom")
  const [debateStyle, setDebateStyle] = useState<DebateStyle>("freestyle")

  const defaultModel = settings.selectedModel || "x-ai/grok-4.1-fast"
  const [model1, setModel1] = useState(defaultModel)
  const [model2, setModel2] = useState("openai/gpt-5.1")
  const [judgeModel, setJudgeModel] = useState<string | null>(null)
  const [enableJudge, setEnableJudge] = useState(false)

  const [isDebating, setIsDebating] = useState(false)
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([])
  const [judgeVerdict, setJudgeVerdict] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [maxRounds, setMaxRounds] = useState(3)
  const [currentlyStreaming, setCurrentlyStreaming] = useState("")

  // LM Studio models
  const [lmStudioModels, setLmStudioModels] = useState<LMStudioModel[]>([])

  // New features state
  const [enableFactCheck, setEnableFactCheck] = useState(false)
  const [factChecks, setFactChecks] = useState<FactCheck[]>([])
  const [argumentMap, setArgumentMap] = useState<ArgumentNode[]>([])
  const [scores, setScores] = useState<Scores>({
    model1: { arguments: 0, factAccuracy: 0, rebuttals: 0, clarity: 0, total: 0 },
    model2: { arguments: 0, factAccuracy: 0, rebuttals: 0, clarity: 0, total: 0 },
  })
  const [showScoreDashboard, setShowScoreDashboard] = useState(false)
  const [showArgumentMap, setShowArgumentMap] = useState(false)

  // Fetch LM Studio models on mount
  useEffect(() => {
    const fetchLMStudioModels = async () => {
      try {
        const response = await fetch('/api/lmstudio/models')
        if (response.ok) {
          const data = await response.json()
          if (data.data && Array.isArray(data.data)) {
            const models = data.data.map((m: any) => ({
              id: `local/${m.id}`,
              name: m.id.split('/').pop() || m.id
            }))
            setLmStudioModels(models)
          }
        }
      } catch (error) {
        console.log("[AIDebate] LM Studio not available:", error)
      }
    }
    fetchLMStudioModels()
  }, [])

  const availableModels = getUserSelectedModels()
  // Combine LM Studio models with OpenRouter models
  const allModels = [...lmStudioModels.map(m => m.id), ...availableModels]
  const debateModels = Array.from(new Set([defaultModel, model1, model2, ...allModels])).slice(0, 20)

  const getModelName = (modelId: string) => {
    // Handle LM Studio models
    if (modelId.startsWith("local/")) {
      const lmModel = lmStudioModels.find(m => m.id === modelId)
      if (lmModel) return `🖥️ ${lmModel.name}`
      return `🖥️ ${modelId.replace("local/", "").split("/").pop() || modelId}`
    }
    const model = POPULAR_OPENROUTER_MODELS.find((m) => m.id === modelId)
    return model?.name || modelId.split("/")[1] || modelId
  }

  const selectExample = (example: string) => {
    setTopic(example)
  }

  // Fact-checking function
  const performFactCheck = async (claim: string, round: number, model: string, modelName: string): Promise<void> => {
    if (!enableFactCheck) return

    try {
      // Use Tavily or Serper based on available API keys
      const apiKey = settings.apiKeys.tavily || settings.apiKeys.serper
      if (!apiKey) return

      const searchQuery = `Verify: ${claim}`
      let verification = ""
      let sources: string[] = []

      if (settings.apiKeys.tavily) {
        const result = await searchWeb(searchQuery, {
          maxResults: 3,
          searchDepth: "basic",
          apiKey: settings.apiKeys.tavily,
        })
        verification = result.answer || result.results[0]?.content || "No verification available"
        sources = result.results.slice(0, 2).map((r) => r.url)
      } else if (settings.apiKeys.serper) {
        const result = await searchWithSerper(searchQuery, {
          maxResults: 3,
          apiKey: settings.apiKeys.serper,
        })
        verification = result.answer || result.results[0]?.content || "No verification available"
        sources = result.results.slice(0, 2).map((r) => r.url)
      }

      const confidence: "high" | "medium" | "low" = verification.length > 100 ? "high" : verification.length > 50 ? "medium" : "low"

      const factCheck: FactCheck = {
        claim,
        round,
        model,
        modelName,
        verification,
        sources,
        confidence,
        timestamp: Date.now(),
      }

      setFactChecks((prev) => [...prev, factCheck])
    } catch (error) {
      console.error("Fact check failed:", error)
    }
  }

  // Extract claims from debate message
  const extractClaims = (content: string): string[] => {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    return sentences.slice(0, 2) // Extract up to 2 main claims
  }

  // Analyze argument and update map
  const analyzeArgument = (message: DebateMessage, previousMessages: DebateMessage[]): void => {
    const argId = `arg-${message.round}-${message.model}`
    const opposingModel = message.model === model1 ? model2 : model1

    // Determine argument type
    let type: "claim" | "counter" | "evidence" = message.round === 1 ? "claim" : "counter"

    // Check if this references previous arguments
    const lastOpposingMsg = previousMessages.filter((m) => m.model === opposingModel && m.round < message.round).pop()
    const parentId = lastOpposingMsg ? `arg-${lastOpposingMsg.round}-${lastOpposingMsg.model}` : undefined

    const node: ArgumentNode = {
      id: argId,
      model: message.model,
      modelName: message.modelName,
      round: message.round,
      type,
      content: message.content.slice(0, 100) + "...",
      parentId,
    }

    setArgumentMap((prev) => [...prev, node])
  }

  // Update scores based on message analysis
  const updateScores = (message: DebateMessage, allMessages: DebateMessage[]): void => {
    const isModel1 = message.model === model1
    const scoreKey: "model1" | "model2" = isModel1 ? "model1" : "model2"

    setScores((prev) => {
      const currentScore = prev[scoreKey]
      const newScore = { ...currentScore }

      // Arguments: each round adds 1 point
      newScore.arguments = message.round

      // Clarity: based on message length (balanced is better)
      const length = message.content.length
      newScore.clarity = length > 200 && length < 800 ? Math.min(currentScore.clarity + 1, 5) : currentScore.clarity

      // Rebuttals: if this references opponent's points
      const opposingModel = isModel1 ? model2 : model1
      const hasRebuttal = message.content.toLowerCase().includes("aber") || message.content.toLowerCase().includes("jedoch")
      if (hasRebuttal && message.round > 1) {
        newScore.rebuttals = Math.min(currentScore.rebuttals + 1, maxRounds)
      }

      // Total score
      newScore.total = newScore.arguments + newScore.factAccuracy + newScore.rebuttals + newScore.clarity

      return {
        ...prev,
        [scoreKey]: newScore,
      }
    })
  }

  const startDebate = async () => {
    if (!topic.trim()) {
      alert("Please enter a discussion topic!")
      return
    }

    // Check if API key is configured
    if (!settings.apiKeys.openRouter) {
      alert("OpenRouter API Key Required!\n\nPlease add your OpenRouter API key in Settings → API Keys to use the discussion feature.")
      return
    }

    setIsDebating(true)
    setDebateMessages([])
    setJudgeVerdict(null)
    setCurrentRound(1)
    setFactChecks([])
    setArgumentMap([])
    setScores({
      model1: { arguments: 0, factAccuracy: 0, rebuttals: 0, clarity: 0, total: 0 },
      model2: { arguments: 0, factAccuracy: 0, rebuttals: 0, clarity: 0, total: 0 },
    })

    // Let models express their genuine views (no forced Pro/Contra positions)

    try {
      // Collect all messages locally to avoid React state async issues
      const allMessages: DebateMessage[] = []

      for (let round = 1; round <= maxRounds; round++) {
        setCurrentRound(round)

        // Model 1's turn
        const prompt1 = buildDebatePrompt(model1, topic, allMessages, round, getModelName(model2), debateStyle)
        let response1 = ""

        await streamChatMessage(
          [{ role: "user", content: prompt1 }],
          model1,
          (chunk) => {
            response1 += chunk
            setCurrentlyStreaming(response1)
          },
          {
            temperature: 0.8,
            maxTokens: 500,
            apiKey: settings.apiKeys.openRouter,
          }
        )
        setCurrentlyStreaming("")

        const msg1: DebateMessage = {
          model: model1,
          modelName: getModelName(model1),
          content: response1,
          round,
          timestamp: Date.now(),
        }

        allMessages.push(msg1)
        setDebateMessages((prev) => [...prev, msg1])

        // Analyze and track this message
        analyzeArgument(msg1, allMessages)
        updateScores(msg1, allMessages)

        // Perform fact-checking on claims
        if (enableFactCheck) {
          const claims = extractClaims(response1)
          for (const claim of claims) {
            await performFactCheck(claim, round, model1, getModelName(model1))
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Model 2's turn
        const prompt2 = buildDebatePrompt(model2, topic, allMessages, round, getModelName(model1), debateStyle)
        let response2 = ""

        await streamChatMessage(
          [{ role: "user", content: prompt2 }],
          model2,
          (chunk) => {
            response2 += chunk
            setCurrentlyStreaming(response2)
          },
          {
            temperature: 0.8,
            maxTokens: 500,
            apiKey: settings.apiKeys.openRouter,
          }
        )
        setCurrentlyStreaming("")

        const msg2: DebateMessage = {
          model: model2,
          modelName: getModelName(model2),
          content: response2,
          round,
          timestamp: Date.now(),
        }

        allMessages.push(msg2)
        setDebateMessages((prev) => [...prev, msg2])

        // Analyze and track this message
        analyzeArgument(msg2, allMessages)
        updateScores(msg2, allMessages)

        // Perform fact-checking on claims
        if (enableFactCheck) {
          const claims = extractClaims(response2)
          for (const claim of claims) {
            await performFactCheck(claim, round, model2, getModelName(model2))
          }
        }

        if (round < maxRounds) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }
      }

      // Judge mode - let 3rd model decide winner
      if (enableJudge && judgeModel) {
        const judgePrompt = buildJudgePrompt(topic, allMessages, getModelName(model1), getModelName(model2))
        let verdict = ""

        await streamChatMessage(
          [{ role: "user", content: judgePrompt }],
          judgeModel,
          (chunk) => {
            verdict += chunk
            setCurrentlyStreaming(verdict)
          },
          {
            temperature: 0.7,
            maxTokens: 800,
            apiKey: settings.apiKeys.openRouter,
          }
        )
        setCurrentlyStreaming("")
        setJudgeVerdict(verdict)
      }
    } catch (error) {
      console.error("Discussion failed:", error)
      let errorMessage = "Discussion failed. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "Authentication Error: Invalid or missing OpenRouter API key.\n\nPlease check your API key in Settings → API Keys."
        } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
          errorMessage = "Access Denied: Your API key doesn't have permission for this model.\n\nPlease check your OpenRouter account or try a different model."
        } else if (error.message.includes("429")) {
          errorMessage = "Rate Limit Exceeded: Too many requests.\n\nPlease wait a moment and try again."
        } else if (error.message.includes("500") || error.message.includes("502") || error.message.includes("503")) {
          errorMessage = "Server Error: The AI service is temporarily unavailable.\n\nPlease try again in a few moments."
        } else {
          errorMessage = `Discussion failed: ${error.message}`
        }
      }

      alert(errorMessage)
    } finally {
      setIsDebating(false)
    }
  }

  const buildDebatePrompt = (
    currentModel: string,
    debateTopic: string,
    previousMessages: DebateMessage[],
    round: number,
    opponentName: string,
    style: DebateStyle
  ): string => {
    const previousContext = previousMessages
      .filter((msg) => msg.round < round || (msg.round === round && msg.model !== currentModel))
      .map((msg) => `${msg.modelName}: ${msg.content}`)
      .join("\n\n")

    const styleInstructions = {
      freestyle: "Sei kreativ und authentisch. Teile deine echte Perspektive!",
      oxford: "Nutze strukturierte Argumentation: Analyse, Begründung, Beispiele. Bleib akademisch und präzise.",
      socratic: "Stelle durchdachte Fragen und erkunde verschiedene Perspektiven durch Dialog.",
    }

    return `Du bist Teilnehmer einer KI-Diskussion mit ${opponentName}. Teile deine ECHTE Meinung und Perspektive zu diesem Thema.

**DISKUSSIONSTHEMA:** ${debateTopic}

**STIL:** ${DEBATE_STYLES[style].label} (${styleInstructions[style]})

**RUNDE:** ${round} von ${maxRounds}

${previousContext ? `**BISHERIGER VERLAUF:**\n${previousContext}\n\n` : ""}

**DEINE AUFGABE:**
${round === 1
  ? `Teile deine authentische Sicht auf dieses Thema. Was denkst DU wirklich darüber? Sei ehrlich und nuanciert.`
  : `Reagiere auf ${opponentName}'s Perspektive. Du kannst zustimmen, widersprechen, oder eine andere Sichtweise einbringen. Sei authentisch! ${round === maxRounds ? "Dies ist deine finale Stellungnahme - fasse deine Sicht zusammen." : ""}`
}

**WICHTIG:**
- Maximal 3-4 Sätze
- Teile deine ECHTE Meinung (nicht künstlich Pro oder Contra)
- Du darfst nuanciert sein, teilweise zustimmen/widersprechen
- Beziehe dich auf ${opponentName}'s Punkte wenn vorhanden
- Sei authentisch und durchdacht

**DEINE EHRLICHE MEINUNG:**`
  }

  const buildJudgePrompt = (
    debateTopic: string,
    messages: DebateMessage[],
    model1Name: string,
    model2Name: string
  ): string => {
    const fullDiscussion = messages.map((msg, i) => `Runde ${msg.round} - ${msg.modelName}:\n${msg.content}`).join("\n\n")

    return `Du bist ein neutraler Beobachter einer KI-Diskussion. Analysiere die Perspektiven beider Modelle und bewerte ihre Beiträge.

**DISKUSSIONSTHEMA:** ${debateTopic}

**TEILNEHMER:**
- ${model1Name} (Model 1)
- ${model2Name} (Model 2)

**KOMPLETTE DISKUSSION:**
${fullDiscussion}

**DEINE AUFGABE:**
Bewerte die Diskussion nach folgenden Kriterien:
1. **Tiefgang** (25%): Wie nuanciert und durchdacht sind die Perspektiven?
2. **Authentizität** (25%): Wie ehrlich und genuine wirken die Ansichten?
3. **Konstruktivität** (25%): Wie gut bauen sie aufeinander auf?
4. **Klarheit** (25%): Wie verständlich wurden die Gedanken kommuniziert?

**FORMAT DEINER ANTWORT:**
1. Kurze Analyse für ${model1Name} (2 Sätze)
2. Kurze Analyse für ${model2Name} (2 Sätze)
3. **ÜBERZEUGENDSTE PERSPEKTIVE:** [Name]
4. **BEGRÜNDUNG:** 2-3 Sätze warum diese Sichtweise am überzeugendsten war

Sei objektiv und fair in deiner Bewertung!`
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-to-r from-background/95 to-muted/20 p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 shadow-lg flex items-center justify-center flex-shrink-0">
            <Swords className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold truncate">AI Discussion</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Two AI models share their genuine perspectives</p>
          </div>
        </div>

        {/* Topic Category Selection */}
        <div className="space-y-2 sm:space-y-3">
          <div>
            <Label className="text-xs sm:text-sm font-medium mb-2 block">Themen-Kategorie</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {Object.entries(DEBATE_TOPICS).map(([key, { label, emoji }]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(key as TopicCategory)}
                  disabled={isDebating}
                  className="h-auto py-2 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <span className="mr-1">{emoji}</span>
                  <span className="truncate">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Example Topics */}
          {selectedCategory !== "custom" && DEBATE_TOPICS[selectedCategory].examples.length > 0 && (
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium">Beispiele:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {DEBATE_TOPICS[selectedCategory].examples.map((example, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => selectExample(example)}
                    disabled={isDebating}
                    className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Discussion Topic Input */}
          <div>
            <Label className="text-xs sm:text-sm font-medium mb-2 block">Diskussionsthema</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. 'Was sind die Chancen und Risiken von KI?'"
              disabled={isDebating}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Discussion Style Selection */}
          <div>
            <Label className="text-xs sm:text-sm font-medium mb-2 block">Diskussions-Stil</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DEBATE_STYLES).map(([key, { label, emoji, description }]) => (
                <Button
                  key={key}
                  variant={debateStyle === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDebateStyle(key as DebateStyle)}
                  disabled={isDebating}
                  title={description}
                  className="h-auto py-2 px-2 sm:px-3 flex-col items-start gap-0.5"
                >
                  <div className="flex items-center gap-1 text-xs sm:text-sm font-medium">
                    <span>{emoji}</span>
                    <span className="truncate">{label}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-normal line-clamp-1">{description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Model & Judge Selection - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-2 block">Model 1</Label>
              <select
                value={model1}
                onChange={(e) => setModel1(e.target.value)}
                disabled={isDebating}
                className="w-full rounded-md border bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm"
              >
                {debateModels.map((modelId) => (
                  <option key={modelId} value={modelId}>
                    {getModelName(modelId)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs sm:text-sm font-medium mb-2 block">Model 2</Label>
              <select
                value={model2}
                onChange={(e) => setModel2(e.target.value)}
                disabled={isDebating}
                className="w-full rounded-md border bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm"
              >
                {debateModels.map((modelId) => (
                  <option key={modelId} value={modelId}>
                    {getModelName(modelId)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs sm:text-sm font-medium mb-2 block">Rounds</Label>
              <select
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                disabled={isDebating}
                className="w-full rounded-md border bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm"
              >
                <option value={2}>2 (Schnell)</option>
                <option value={3}>3 (Standard)</option>
                <option value={4}>4 (Lang)</option>
                <option value={5}>5 (Episch)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-1">
                <Scale className="h-3 w-3" />
                Richter (optional)
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={enableJudge ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setEnableJudge(!enableJudge)
                    if (!judgeModel) setJudgeModel(debateModels[2] || defaultModel)
                  }}
                  disabled={isDebating}
                  className="flex-1 text-xs sm:text-sm"
                >
                  {enableJudge ? "✓ An" : "Aus"}
                </Button>
                {enableJudge && (
                  <select
                    value={judgeModel || ""}
                    onChange={(e) => setJudgeModel(e.target.value)}
                    disabled={isDebating}
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {debateModels.map((modelId) => (
                      <option key={modelId} value={modelId}>
                        {getModelName(modelId)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Features Toggles */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={enableFactCheck ? "default" : "outline"}
              size="sm"
              onClick={() => setEnableFactCheck(!enableFactCheck)}
              disabled={isDebating || (!settings.apiKeys.tavily && !settings.apiKeys.serper)}
              className="h-auto py-2 flex-col items-center gap-1"
              title="Live Faktencheck mit Tavily/Serper"
            >
              <Target className="h-4 w-4" />
              <span className="text-xs">Fact-Check</span>
            </Button>
            <Button
              variant={showScoreDashboard ? "default" : "outline"}
              size="sm"
              onClick={() => setShowScoreDashboard(!showScoreDashboard)}
              disabled={isDebating}
              className="h-auto py-2 flex-col items-center gap-1"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Live Score</span>
            </Button>
            <Button
              variant={showArgumentMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArgumentMap(!showArgumentMap)}
              disabled={isDebating}
              className="h-auto py-2 flex-col items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">Arg. Map</span>
            </Button>
          </div>

          <Button onClick={startDebate} disabled={isDebating || !topic.trim()} className="w-full h-10 sm:h-11 font-semibold text-sm">
            {isDebating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Round {currentRound} of {maxRounds}...
              </>
            ) : (
              <>
                <Swords className="mr-2 h-4 w-4" />
                Start Discussion ({maxRounds} Rounds)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Discussion Arena */}
      <ScrollArea className="flex-1 p-3 sm:p-4 md:p-6">
        {debateMessages.length === 0 && !isDebating && (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <Swords className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
            <p className="text-base sm:text-lg font-medium">Ready to see what models really think?</p>
            <p className="text-xs sm:text-sm mt-2">Choose a topic, style, and two models</p>
          </div>
        )}

        {debateMessages.length > 0 && (
          <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            {Array.from({ length: maxRounds }).map((_, roundIndex) => {
              const round = roundIndex + 1
              const roundMessages = debateMessages.filter((msg) => msg.round === round)

              if (roundMessages.length === 0 && round > currentRound) return null

              return (
                <div key={round} className="space-y-3 sm:space-y-4">
                  {/* Round Header */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge variant="outline" className="px-3 sm:px-4 py-1 sm:py-1.5 text-sm sm:text-base font-bold">
                      <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Round {round}
                    </Badge>
                    {round <= currentRound && roundMessages.length < 2 && isDebating && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>

                  {/* Messages Side by Side on Desktop, Stacked on Mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Model 1 Message */}
                    {roundMessages.find((msg) => msg.model === model1) && (
                      <Card className={cn("p-3 sm:p-4 border-2 transition-all", "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-background")}>
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Badge className="bg-purple-500 text-white text-xs">
                            {roundMessages.find((msg) => msg.model === model1)?.modelName}
                          </Badge>
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed">
                          {roundMessages.find((msg) => msg.model === model1)?.content}
                        </p>
                      </Card>
                    )}

                    {/* Model 2 Message */}
                    {roundMessages.find((msg) => msg.model === model2) && (
                      <Card className={cn("p-3 sm:p-4 border-2 transition-all", "border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-background")}>
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Badge className="bg-orange-500 text-white text-xs">
                            {roundMessages.find((msg) => msg.model === model2)?.modelName}
                          </Badge>
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed">
                          {roundMessages.find((msg) => msg.model === model2)?.content}
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Live Scoring Dashboard */}
            {showScoreDashboard && debateMessages.length > 0 && (
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500/10 to-background border-blue-500/30">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  <h3 className="text-base sm:text-lg font-bold">Live Scoring Dashboard</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Model 1 Score */}
                  <div className="space-y-2">
                    <Badge className="bg-purple-500 text-white mb-2">{getModelName(model1)}</Badge>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Argumente:</span>
                        <span className="font-bold">{scores.model1.arguments}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Klarheit:</span>
                        <span className="font-bold">{scores.model1.clarity}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Rebuttals:</span>
                        <span className="font-bold">{scores.model1.rebuttals}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Fakten:</span>
                        <span className="font-bold">{scores.model1.factAccuracy}</span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between text-sm sm:text-base font-bold">
                        <span>Total:</span>
                        <span className="text-purple-500">{scores.model1.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Model 2 Score */}
                  <div className="space-y-2">
                    <Badge className="bg-orange-500 text-white mb-2">{getModelName(model2)}</Badge>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Argumente:</span>
                        <span className="font-bold">{scores.model2.arguments}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Klarheit:</span>
                        <span className="font-bold">{scores.model2.clarity}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Rebuttals:</span>
                        <span className="font-bold">{scores.model2.rebuttals}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Fakten:</span>
                        <span className="font-bold">{scores.model2.factAccuracy}</span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between text-sm sm:text-base font-bold">
                        <span>Total:</span>
                        <span className="text-orange-500">{scores.model2.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Argument Map Visualization */}
            {showArgumentMap && argumentMap.length > 0 && (
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-500/10 to-background border-green-500/30">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                  <h3 className="text-base sm:text-lg font-bold">Argument Map</h3>
                </div>
                <div className="space-y-3">
                  {argumentMap.map((node) => (
                    <div
                      key={node.id}
                      className={cn(
                        "p-3 rounded-lg border-l-4 transition-all",
                        node.model === model1 ? "border-l-purple-500 bg-purple-500/5" : "border-l-orange-500 bg-orange-500/5",
                        node.parentId && "ml-6 sm:ml-8"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {node.type === "claim" ? "💭" : node.type === "counter" ? "⚡" : "📊"} R{node.round}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm mb-1">{node.modelName}</div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{node.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Fact-Checking Results */}
            {enableFactCheck && factChecks.length > 0 && (
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-cyan-500/10 to-background border-cyan-500/30">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-500" />
                  <h3 className="text-base sm:text-lg font-bold">Live Fakten-Checks</h3>
                  <Badge variant="outline" className="ml-auto">
                    {factChecks.length} Checks
                  </Badge>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {factChecks.map((check, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0",
                            check.confidence === "high"
                              ? "bg-green-500/20"
                              : check.confidence === "medium"
                                ? "bg-yellow-500/20"
                                : "bg-red-500/20"
                          )}
                        >
                          {check.confidence === "high" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : check.confidence === "medium" ? (
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              R{check.round}
                            </Badge>
                            <span className="text-xs font-medium">{check.modelName}</span>
                          </div>
                          <p className="text-xs font-medium mb-2 line-clamp-2">{check.claim}</p>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{check.verification}</p>
                          {check.sources.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {check.sources.slice(0, 2).map((source, j) => (
                                <a
                                  key={j}
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-500 hover:underline truncate max-w-[150px]"
                                >
                                  {new URL(source).hostname}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Judge Verdict */}
            {judgeVerdict && !isDebating && (
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-amber-500/10 to-background border-amber-500/30">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                  <h3 className="text-base sm:text-lg font-bold">Richter-Entscheidung</h3>
                  <Badge className="bg-amber-500 text-white text-xs">{judgeModel && getModelName(judgeModel)}</Badge>
                </div>
                <div className="prose prose-sm sm:prose max-w-none">
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{judgeVerdict}</p>
                </div>
              </Card>
            )}

            {/* New Discussion Button */}
            {debateMessages.length === maxRounds * 2 && !isDebating && (
              <div className="text-center pt-4">
                <Button
                  onClick={() => {
                    setDebateMessages([])
                    setJudgeVerdict(null)
                    setFactChecks([])
                    setArgumentMap([])
                    setScores({
                      model1: { arguments: 0, factAccuracy: 0, rebuttals: 0, clarity: 0, total: 0 },
                      model2: { arguments: 0, factAccuracy: 0, rebuttals: 0, clarity: 0, total: 0 },
                    })
                  }}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  Neue Diskussion Starten
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
