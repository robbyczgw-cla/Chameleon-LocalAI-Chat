"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TrendingUp,
  Loader2,
  Zap,
  Target,
  BookOpen,
  Calendar,
  Award,
  LineChart,
  RefreshCw
} from "lucide-react"
import { streamChatMessage } from "@/lib/openrouter"
import { cn } from "@/lib/utils"

interface PromptAnalysis {
  totalPrompts: number
  averageLength: number
  categories: Record<string, number>
  qualityTrend: "improving" | "stable" | "declining"
  topTopics: string[]
  recommendations: string[]
  evolutionScore: number // 0-100
  lastUpdated: number
}

interface PromptMetrics {
  date: string
  count: number
  avgLength: number
  topics: string[]
}

export function PromptEvolutionTracker() {
  const { chats, settings } = useApp()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null)
  const [recentPrompts, setRecentPrompts] = useState<string[]>([])

  useEffect(() => {
    // Load cached analysis
    const cached = localStorage.getItem("chameleon-prompt-evolution")
    if (cached) {
      try {
        setAnalysis(JSON.parse(cached))
      } catch (error) {
        console.error("[PromptEvolution] Failed to load cached analysis", error)
      }
    }

    // Load recent prompts for display
    loadRecentPrompts()
  }, [chats])

  const loadRecentPrompts = () => {
    const allPrompts: string[] = []

    // Collect all user messages across all chats
    chats.forEach((chat) => {
      chat.messages.forEach((message) => {
        if (message.role === "user") {
          allPrompts.push(message.content)
        }
      })
    })

    // Get last 10 prompts
    setRecentPrompts(allPrompts.slice(-10).reverse())
  }

  const collectAllPrompts = (): string[] => {
    const allPrompts: string[] = []

    chats.forEach((chat) => {
      chat.messages.forEach((message) => {
        if (message.role === "user") {
          allPrompts.push(message.content)
        }
      })
    })

    return allPrompts
  }

  const analyzePromptEvolution = async () => {
    const allPrompts = collectAllPrompts()

    if (allPrompts.length < 5) {
      alert("Mindestens 5 Prompts erforderlich für eine Analyse. Führe mehr Gespräche, um deine Prompt-Evolution zu tracken!")
      return
    }

    setIsAnalyzing(true)

    try {
      // Sample prompts for analysis (first 20 and last 20 for evolution)
      const earlyPrompts = allPrompts.slice(0, Math.min(20, allPrompts.length / 2))
      const recentPromptsForAnalysis = allPrompts.slice(-20)

      const analysisPrompt = `Du bist ein Experte für Prompt-Engineering und Analyse von Nutzerverhalten. Analysiere die Entwicklung der Prompts eines Users.

**FRÜHE PROMPTS (${earlyPrompts.length}):**
${earlyPrompts.join("\n---\n")}

**AKTUELLE PROMPTS (${recentPromptsForAnalysis.length}):**
${recentPromptsForAnalysis.join("\n---\n")}

**GESAMT:** ${allPrompts.length} Prompts

**AUFGABE:**
Erstelle eine strukturierte Analyse im folgenden JSON-Format:

\`\`\`json
{
  "totalPrompts": ${allPrompts.length},
  "averageLength": <durchschnittliche Wortanzahl>,
  "categories": {
    "technisch": <anzahl>,
    "kreativ": <anzahl>,
    "recherche": <anzahl>,
    "problemlösung": <anzahl>
  },
  "qualityTrend": "improving" | "stable" | "declining",
  "topTopics": ["Thema 1", "Thema 2", "Thema 3"],
  "recommendations": ["Tipp 1", "Tipp 2", "Tipp 3"],
  "evolutionScore": <0-100 Score>
}
\`\`\`

**BEWERTUNGSKRITERIEN:**
- Klarheit & Spezifität der Prompts
- Verwendung von Kontext & Details
- Komplexität & Tiefe der Anfragen
- Vergleich frühe vs. aktuelle Prompts
- Evolution Score: 0-40 = Anfänger, 41-70 = Fortgeschritten, 71-100 = Experte

Antworte NUR mit dem JSON-Objekt.`

      let fullResponse = ""

      await streamChatMessage(
        [{ role: "user", content: analysisPrompt }],
        "x-ai/grok-4-fast",
        (chunk) => {
          fullResponse += chunk
        },
        {
          temperature: 0.3,
          maxTokens: 2048,
          apiKey: settings.apiKeys.openRouter,
        }
      )

      // Extract JSON
      let jsonText = fullResponse.trim()
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim()
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0].trim()
      }

      const parsedAnalysis = JSON.parse(jsonText)
      const newAnalysis: PromptAnalysis = {
        ...parsedAnalysis,
        lastUpdated: Date.now(),
      }

      setAnalysis(newAnalysis)
      localStorage.setItem("chameleon-prompt-evolution", JSON.stringify(newAnalysis))

      console.log("[PromptEvolution] Analysis complete:", newAnalysis)
    } catch (error) {
      console.error("[PromptEvolution] Analysis failed:", error)
      alert("Fehler bei der Analyse. Bitte versuche es erneut.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 71) return { label: "Experte", color: "bg-green-500" }
    if (score >= 41) return { label: "Fortgeschritten", color: "bg-blue-500" }
    return { label: "Anfänger", color: "bg-yellow-500" }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === "declining") return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
    return <Target className="h-4 w-4 text-blue-500" />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <LineChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Prompt Evolution Tracker</h3>
            <p className="text-xs text-muted-foreground">
              {collectAllPrompts().length} Prompts insgesamt
            </p>
          </div>
        </div>
        <Button
          onClick={analyzePromptEvolution}
          disabled={isAnalyzing || collectAllPrompts().length < 5}
          size="sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analysiere...
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Evolution Analysieren
            </>
          )}
        </Button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Score Card */}
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-background border-blue-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-semibold text-lg">Evolution Score</h4>
                  <p className="text-xs text-muted-foreground">
                    Zuletzt aktualisiert: {new Date(analysis.lastUpdated).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-500">{analysis.evolutionScore}</div>
                <Badge className={cn("mt-1", getScoreBadge(analysis.evolutionScore).color)}>
                  {getScoreBadge(analysis.evolutionScore).label}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${analysis.evolutionScore}%` }}
              />
            </div>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">Total Prompts</span>
              </div>
              <div className="text-2xl font-bold">{analysis.totalPrompts}</div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium text-muted-foreground">Ø Länge</span>
              </div>
              <div className="text-2xl font-bold">{Math.round(analysis.averageLength)} Wörter</div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(analysis.qualityTrend)}
                <span className="text-xs font-medium text-muted-foreground">Trend</span>
              </div>
              <div className="text-base font-semibold capitalize">{analysis.qualityTrend}</div>
            </Card>
          </div>

          {/* Categories */}
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Kategorien
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(analysis.categories).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm capitalize">{category}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Topics */}
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Top Themen
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.topTopics.map((topic, idx) => (
                <Badge key={idx} variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300">
                  {topic}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-500/30">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Verbesserungsvorschläge
            </h4>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500 mt-0.5">💡</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Recent Prompts Preview */}
      {!analysis && !isAnalyzing && recentPrompts.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3">Letzte Prompts (Vorschau)</h4>
          <ScrollArea className="h-64">
            <div className="space-y-2 pr-4">
              {recentPrompts.slice(0, 5).map((prompt, idx) => (
                <div key={idx} className="p-2 rounded bg-muted/50 text-xs">
                  <p className="line-clamp-2">{prompt}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && collectAllPrompts().length < 5 && (
        <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-dashed">
          <LineChart className="h-12 w-12 mx-auto mb-3 text-blue-500 opacity-70" />
          <p className="text-sm text-muted-foreground mb-2">
            Noch nicht genug Daten
          </p>
          <p className="text-xs text-muted-foreground">
            Führe mindestens 5 Gespräche, um deine Prompt-Evolution zu tracken
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Aktuell: {collectAllPrompts().length} Prompts
          </p>
        </Card>
      )}
    </div>
  )
}
