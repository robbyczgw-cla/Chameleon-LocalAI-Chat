"use client"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Brain, Sparkles, Loader2 } from "lucide-react"
import { streamChatMessage } from "@/lib/openrouter"

interface PersonalityAnalysis {
  analysis: string
  timestamp: number
  promptCount: number
}

export function PersonalityAnalysis() {
  const { chats, settings } = useApp()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null)

  // Load saved analysis from localStorage
  useState(() => {
    const saved = localStorage.getItem("chameleon-personality-analysis")
    if (saved) {
      try {
        setAnalysis(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load personality analysis:", e)
      }
    }
  })

  const collectUserPrompts = (): string[] => {
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

  const analyzePersonality = async () => {
    setIsAnalyzing(true)

    try {
      const userPrompts = collectUserPrompts()

      if (userPrompts.length === 0) {
        alert("Keine Prompts gefunden! Starte erst einige Gespräche.")
        setIsAnalyzing(false)
        return
      }

      const analysisPrompt = `Du bist ein Experte für Persönlichkeitsanalyse. Basierend auf den folgenden ${userPrompts.length} User-Prompts, erstelle eine tiefgründige, einfühlsame und interessante Persönlichkeitsanalyse der Person.

**USER PROMPTS:**
${userPrompts.slice(0, 100).join("\n---\n")}

${userPrompts.length > 100 ? `\n(Zeige nur die ersten 100 von ${userPrompts.length} Prompts)` : ""}

**ANALYSE-ANFORDERUNGEN:**

Erstelle eine strukturierte Persönlichkeitsanalyse mit folgenden Punkten:

1. **Kommunikationsstil** (2-3 Sätze): Wie kommuniziert die Person? Direkt, höflich, kreativ, technisch?

2. **Interessengebiete** (3-4 Hauptthemen): Was interessiert die Person besonders? Kategorisiere die Hauptthemen.

3. **Denkweise & Problemlösung** (2-3 Sätze): Wie geht die Person an Probleme heran? Analytisch, kreativ, pragmatisch?

4. **Persönlichkeitstyp** (1 Satz): Welcher Persönlichkeitstyp könnte das sein? (z.B. MBTI-inspiriert oder eigene Kategorisierung)

5. **Stärken** (3-4 Bulletpoints): Was sind erkennbare Stärken?

6. **Entwicklungspotential** (2-3 Bulletpoints): Wo gibt es Wachstumspotential?

7. **Besondere Merkmale** (1-2 Sätze): Was ist einzigartig oder bemerkenswert?

**WICHTIG:**
- Sei positiv aber ehrlich
- Verwende Markdown-Formatierung
- Sei konkret und beziehe dich auf die Prompts
- Keine negativen Wertungen, nur konstruktive Beobachtungen
- Maximal 500 Wörter

**DEINE ANALYSE:**`

      let fullAnalysis = ""

      await streamChatMessage(
        [{ role: "user", content: analysisPrompt }],
        "x-ai/grok-4-fast",
        (chunk) => {
          fullAnalysis += chunk
        },
        {
          temperature: 0.7,
          maxTokens: 2048,
          apiKey: settings.apiKeys.openRouter,
        }
      )

      const newAnalysis: PersonalityAnalysis = {
        analysis: fullAnalysis,
        timestamp: Date.now(),
        promptCount: userPrompts.length,
      }

      setAnalysis(newAnalysis)
      localStorage.setItem("chameleon-personality-analysis", JSON.stringify(newAnalysis))
    } catch (error) {
      console.error("Personality analysis failed:", error)
      alert("Analyse fehlgeschlagen. Bitte versuche es später erneut.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const currentPromptCount = collectUserPrompts().length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 shadow-lg flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <Label className="text-base font-semibold">Wer bin ich?</Label>
          <p className="text-xs text-muted-foreground">
            KI-Persönlichkeitsanalyse basierend auf deinen Prompts
          </p>
        </div>
      </div>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-muted/50 to-muted/30 border-border/60">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Aktuelle Prompts: <span className="text-primary">{currentPromptCount}</span>
              </span>
            </div>
            {analysis && (
              <span className="text-xs text-muted-foreground">
                Letzte Analyse: {formatDate(analysis.timestamp)} ({analysis.promptCount} Prompts)
              </span>
            )}
          </div>

          <Button
            onClick={analyzePersonality}
            disabled={isAnalyzing || currentPromptCount === 0}
            className="w-full h-11 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysiere deine Persönlichkeit...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                {analysis ? "Neue Analyse starten" : "Persönlichkeitsanalyse starten"}
              </>
            )}
          </Button>

          {analysis && !isAnalyzing && (
            <div className="mt-6 p-4 sm:p-5 rounded-xl bg-background/80 border border-border/40 shadow-sm">
              <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: analysis.analysis
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                      .replace(/^### (.*$)/gim, "<h3 class='text-base font-bold mt-4 mb-2'>$1</h3>")
                      .replace(/^## (.*$)/gim, "<h2 class='text-lg font-bold mt-4 mb-2'>$1</h2>")
                      .replace(/^# (.*$)/gim, "<h1 class='text-xl font-bold mt-4 mb-2'>$1</h1>")
                      .replace(/^- (.*$)/gim, "<li class='ml-4'>$1</li>")
                      .replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            </div>
          )}

          {currentPromptCount === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Prompts vorhanden.</p>
              <p className="text-xs mt-1">Starte einige Gespräche, um eine Analyse zu erhalten.</p>
            </div>
          )}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground/80 leading-relaxed">
        ℹ️ Diese Analyse wird lokal mit Grok 4 Fast erstellt und basiert ausschließlich auf deinen Chat-Prompts.
        Die Analyse wird in deinem Browser gespeichert und nicht mit anderen geteilt.
      </p>
    </div>
  )
}
