"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sparkles,
  Loader2,
  Brain,
  Target,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from "lucide-react"
import { streamChatMessage } from "@/lib/openrouter"
import { cn } from "@/lib/utils"

interface ConversationInsight {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  topics: string[]
  timestamp: number
  messageCount: number
}

export function ConversationInsights() {
  const { settings, chats, currentChatId, updateChat } = useApp()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [insights, setInsights] = useState<ConversationInsight | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const currentChat = chats.find((c) => c.id === currentChatId)

  useEffect(() => {
    // Load insights from current chat if available
    if (currentChat?.insights) {
      setInsights(currentChat.insights)
    } else {
      setInsights(null)
    }
  }, [currentChatId, currentChat])

  const generateInsights = async () => {
    if (!currentChat || currentChat.messages.length < 2) {
      alert("Nicht genug Nachrichten für eine Analyse. Mindestens 2 Nachrichten erforderlich.")
      return
    }

    setIsAnalyzing(true)

    try {
      // Collect conversation history
      const conversationText = currentChat.messages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n")

      const analysisPrompt = `Du bist ein Experte für Konversationsanalyse. Analysiere die folgende Konversation und extrahiere wichtige Erkenntnisse.

**KONVERSATION (${currentChat.messages.length} Nachrichten):**
${conversationText.slice(0, 15000)} ${conversationText.length > 15000 ? "\n\n[...gekürzt für Token-Effizienz]" : ""}

**AUFGABE:**
Erstelle eine strukturierte Analyse im folgenden JSON-Format:

\`\`\`json
{
  "summary": "Eine prägnante 2-3 Satz Zusammenfassung der gesamten Konversation",
  "keyPoints": ["Wichtiger Punkt 1", "Wichtiger Punkt 2", "Wichtiger Punkt 3"],
  "actionItems": ["Action Item 1", "Action Item 2"],
  "topics": ["Thema 1", "Thema 2", "Thema 3"]
}
\`\`\`

**ANFORDERUNGEN:**
- Summary: 2-3 Sätze, Kern der Konversation
- Key Points: 3-5 wichtigste Erkenntnisse oder Diskussionspunkte
- Action Items: Konkrete nächste Schritte oder Aufgaben (falls vorhanden)
- Topics: 3-5 Hauptthemen der Konversation

Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text.`

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

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = fullResponse.trim()
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim()
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0].trim()
      }

      const parsedInsights = JSON.parse(jsonText)

      const newInsights: ConversationInsight = {
        summary: parsedInsights.summary,
        keyPoints: parsedInsights.keyPoints || [],
        actionItems: parsedInsights.actionItems || [],
        topics: parsedInsights.topics || [],
        timestamp: Date.now(),
        messageCount: currentChat.messages.length,
      }

      setInsights(newInsights)

      // Save insights to chat
      updateChat(currentChatId!, { insights: newInsights })

      console.log("[ConversationInsights] Generated insights:", newInsights)
    } catch (error) {
      console.error("[ConversationInsights] Failed to generate insights:", error)
      alert("Fehler beim Generieren der Insights. Bitte versuche es erneut.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!currentChat || currentChat.messages.length === 0) {
    return (
      <Card className="p-6 text-center bg-muted/30 border-dashed">
        <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          Keine Konversation aktiv. Starte ein Gespräch, um Insights zu generieren.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header & Generate Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Conversation Insights</h3>
            <p className="text-xs text-muted-foreground">
              {currentChat.messages.length} Nachrichten in dieser Konversation
            </p>
          </div>
        </div>
        <Button
          onClick={generateInsights}
          disabled={isAnalyzing || currentChat.messages.length < 2}
          size="sm"
          className="shrink-0"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analysiere...
            </>
          ) : insights ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Insights Generieren
            </>
          )}
        </Button>
      </div>

      {/* Insights Display */}
      {insights && (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5">
          {/* Summary Section */}
          <div
            className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b cursor-pointer hover:from-purple-500/15 hover:to-pink-500/15 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <h4 className="font-semibold text-sm">Zusammenfassung</h4>
                  <Badge variant="outline" className="text-xs">
                    {new Date(insights.timestamp).toLocaleDateString("de-DE")}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {insights.summary}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Detailed Insights */}
          {isExpanded && (
            <div className="p-4 space-y-4">
              {/* Topics */}
              {insights.topics.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <h5 className="font-medium text-sm">Hauptthemen</h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insights.topics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Points */}
              {insights.keyPoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <h5 className="font-medium text-sm">Wichtige Erkenntnisse</h5>
                  </div>
                  <ul className="space-y-2">
                    {insights.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span className="flex-1">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {insights.actionItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <h5 className="font-medium text-sm">Action Items</h5>
                  </div>
                  <ul className="space-y-2">
                    {insights.actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">→</span>
                        <span className="flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
                <span>Basierend auf {insights.messageCount} Nachrichten</span>
                <span>Generiert mit Grok 4 Fast</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Empty State */}
      {!insights && !isAnalyzing && (
        <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-dashed">
          <Brain className="h-12 w-12 mx-auto mb-3 text-purple-500 opacity-70" />
          <p className="text-sm text-muted-foreground mb-3">
            Noch keine Insights für diese Konversation
          </p>
          <p className="text-xs text-muted-foreground">
            Klicke auf "Insights Generieren", um eine KI-gestützte Analyse zu erstellen
          </p>
        </Card>
      )}
    </div>
  )
}
