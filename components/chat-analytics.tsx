"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Brain,
  MessageSquare,
  TrendingUp,
  Loader2,
  Sparkles,
  Calendar,
  DollarSign,
  Clock,
  Zap,
  Target,
  Award
} from "lucide-react"
import { streamChatMessage } from "@/lib/openrouter"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  totalChats: number
  totalMessages: number
  totalTokens: number
  estimatedCost: number
  avgMessagesPerChat: number
  mostActiveDay: string
  topTopics: string[]
  userMessageCount: number
  assistantMessageCount: number
}

interface AIInsights {
  summary: string
  strengths: string[]
  suggestions: string[]
  timestamp: number
}

export function ChatAnalytics() {
  const { chats, settings } = useApp()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    calculateAnalytics()
    loadSavedInsights()
  }, [chats])

  const loadSavedInsights = () => {
    const saved = localStorage.getItem("chameleon-analytics-insights")
    if (saved) {
      try {
        setInsights(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load insights:", e)
      }
    }
  }

  const calculateAnalytics = () => {
    let totalMessages = 0
    let totalTokens = 0
    let totalCost = 0
    let userMessages = 0
    let assistantMessages = 0
    const dayCount: Record<string, number> = {}

    chats.forEach((chat) => {
      totalMessages += chat.messages.length

      chat.messages.forEach((msg) => {
        if (msg.role === "user") userMessages++
        if (msg.role === "assistant") assistantMessages++

        if (msg.tokens) {
          totalTokens += msg.tokens.total || 0
          totalCost += msg.tokens.estimatedCost || 0
        }

        const day = new Date(msg.timestamp).toLocaleDateString()
        dayCount[day] = (dayCount[day] || 0) + 1
      })
    })

    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
    const avgMessagesPerChat = chats.length > 0 ? Math.round(totalMessages / chats.length) : 0

    setAnalytics({
      totalChats: chats.length,
      totalMessages,
      totalTokens,
      estimatedCost: totalCost,
      avgMessagesPerChat,
      mostActiveDay,
      topTopics: [], // Could be enhanced with topic detection
      userMessageCount: userMessages,
      assistantMessageCount: assistantMessages
    })
  }

  const generateAIInsights = async () => {
    if (chats.length === 0) return

    setIsAnalyzing(true)
    try {
      // Collect sample of recent prompts
      const recentPrompts: string[] = []
      chats.slice(-5).forEach((chat) => {
        chat.messages
          .filter((m) => m.role === "user")
          .slice(-3)
          .forEach((m) => recentPrompts.push(m.content))
      })

      const analysisPrompt = `Analysiere die folgenden Nutzer-Prompts und erstelle eine kurze Analyse (max 150 Wörter):

Prompts:
${recentPrompts.slice(0, 15).join("\n---\n")}

Gib eine Analyse in folgendem JSON-Format:
{
  "summary": "Kurze Zusammenfassung des Nutzungsverhaltens",
  "strengths": ["Stärke 1", "Stärke 2"],
  "suggestions": ["Verbesserungsvorschlag 1", "Verbesserungsvorschlag 2"]
}`

      let result = ""
      await streamChatMessage(
        [{ role: "user", content: analysisPrompt }],
        settings.selectedModel,
        {
          temperature: 0.7,
          maxTokens: 500,
          apiKey: settings.apiKeys.openRouter,
          onChunk: (chunk) => {
            result += chunk
          }
        }
      )

      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = result.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || result.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1])
          const newInsights: AIInsights = {
            summary: parsed.summary || "Keine Zusammenfassung verfügbar",
            strengths: parsed.strengths || [],
            suggestions: parsed.suggestions || [],
            timestamp: Date.now()
          }
          setInsights(newInsights)
          localStorage.setItem("chameleon-analytics-insights", JSON.stringify(newInsights))
        }
      } catch (parseError) {
        console.error("Failed to parse AI insights:", parseError)
      }
    } catch (error) {
      console.error("Failed to generate insights:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            KI-Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Chats</span>
              </div>
              <p className="text-2xl font-bold">{analytics.totalChats}</p>
              <div className="mt-2 h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Nachrichten</span>
              </div>
              <p className="text-2xl font-bold">{analytics.totalMessages}</p>
              <div className="mt-2 h-1 bg-gradient-to-r from-green-500 to-green-300 rounded-full"></div>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Tokens</span>
              </div>
              <p className="text-2xl font-bold">{(analytics.totalTokens / 1000).toFixed(1)}k</p>
              <div className="mt-2 h-1 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full"></div>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Kosten</span>
              </div>
              <p className="text-2xl font-bold">${analytics.estimatedCost.toFixed(2)}</p>
              <div className="mt-2 h-1 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"></div>
            </Card>
          </div>

          {/* Visual Distribution Charts */}
          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4" />
              Nachrichten-Verteilung
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-600 dark:text-blue-400">Deine Nachrichten</span>
                  <span className="font-medium">{analytics.userMessageCount}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${(analytics.userMessageCount / analytics.totalMessages) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-600 dark:text-purple-400">KI Antworten</span>
                  <span className="font-medium">{analytics.assistantMessageCount}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${(analytics.assistantMessageCount / analytics.totalMessages) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              Durchschnitt: {analytics.avgMessagesPerChat} Nachrichten pro Chat
            </div>
          </Card>

          {/* Additional Stats */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Details
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durchschn. Nachrichten pro Chat:</span>
                <span className="font-medium">{analytics.avgMessagesPerChat}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Deine Nachrichten:</span>
                <span className="font-medium">{analytics.userMessageCount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">KI Antworten:</span>
                <span className="font-medium">{analytics.assistantMessageCount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Aktivster Tag:</span>
                <span className="font-medium">{analytics.mostActiveDay}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {!insights ? (
            <Card className="p-6 text-center space-y-4">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold mb-2">KI-Analyse deiner Prompts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Lass die KI deine Prompts analysieren und Verbesserungsvorschläge geben
                </p>
                <Button onClick={generateAIInsights} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Jetzt analysieren
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Zusammenfassung
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateAIInsights}
                    disabled={isAnalyzing}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Neu generieren
                  </Button>
                </div>
                <p className="text-sm leading-relaxed">{insights.summary}</p>
                <p className="text-xs text-muted-foreground">
                  Zuletzt aktualisiert: {new Date(insights.timestamp).toLocaleString()}
                </p>
              </Card>

              {insights.strengths.length > 0 && (
                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-green-600">
                    <Award className="h-4 w-4" />
                    Stärken
                  </h3>
                  <ul className="space-y-2">
                    {insights.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {insights.suggestions.length > 0 && (
                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-blue-600">
                    <Target className="h-4 w-4" />
                    Verbesserungsvorschläge
                  </h3>
                  <ul className="space-y-2">
                    {insights.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
