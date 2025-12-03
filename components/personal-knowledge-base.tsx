"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Database,
  Search,
  Loader2,
  BookOpen,
  MessageSquare,
  Calendar,
  Sparkles,
  Info,
  ExternalLink
} from "lucide-react"
import { streamChatMessage } from "@/lib/openrouter"
import { cn } from "@/lib/utils"

interface SearchResult {
  chatId: string
  chatTitle: string
  messageContent: string
  role: "user" | "assistant"
  timestamp: number
  relevanceScore?: number
}

export function PersonalKnowledgeBase() {
  const { chats, settings, setCurrentChat } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [useAISearch, setUseAISearch] = useState(false)
  const [totalMessages, setTotalMessages] = useState(0)

  useEffect(() => {
    // Count total messages
    let count = 0
    chats.forEach((chat) => {
      count += chat.messages.length
    })
    setTotalMessages(count)
  }, [chats])

  const performBasicSearch = (query: string): SearchResult[] => {
    const results: SearchResult[] = []
    const queryLower = query.toLowerCase()

    chats.forEach((chat) => {
      chat.messages.forEach((message) => {
        if (message.content.toLowerCase().includes(queryLower)) {
          results.push({
            chatId: chat.id,
            chatTitle: chat.title,
            messageContent: message.content,
            role: message.role,
            timestamp: message.timestamp,
          })
        }
      })
    })

    // Sort by timestamp (newest first)
    return results.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)
  }

  const performAISearch = async (query: string): Promise<SearchResult[]> => {
    // Collect all conversation data with metadata
    const conversationData: string[] = []

    chats.forEach((chat, chatIdx) => {
      chat.messages.forEach((message, msgIdx) => {
        const entry = `[Chat: "${chat.title}" | ID: ${chatIdx}-${msgIdx} | Role: ${message.role} | Date: ${new Date(message.timestamp).toLocaleDateString()}]\n${message.content}`
        conversationData.push(entry)
      })
    })

    // Sample if too large (max 10000 chars for context)
    const contextData = conversationData.join("\n---\n").slice(0, 10000)

    const searchPrompt = `Du bist ein intelligenter Suchassistent für eine persönliche Wissensdatenbank. Der User sucht nach: "${query}"

**VERFÜGBARE KONVERSATIONEN (Auszug):**
${contextData}

**AUFGABE:**
Finde die 5 relevantesten Konversationen/Nachrichten, die zur Suchanfrage passen. Berücksichtige:
- Semantische Ähnlichkeit (nicht nur exakte Wortübereinstimmung)
- Kontext und Thema
- Relevanz für die Suchanfrage

Antworte im folgenden JSON-Format:
\`\`\`json
{
  "results": [
    {
      "chatIndex": <Chat-Index aus ID>,
      "messageIndex": <Message-Index aus ID>,
      "relevanceScore": <0-100>,
      "reason": "Warum relevant"
    }
  ]
}
\`\`\`

Wenn keine relevanten Ergebnisse gefunden werden, gib ein leeres results Array zurück.
Antworte NUR mit dem JSON-Objekt.`

    let fullResponse = ""

    await streamChatMessage(
      [{ role: "user", content: searchPrompt }],
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

    // Parse response
    let jsonText = fullResponse.trim()
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim()
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim()
    }

    const parsed = JSON.parse(jsonText)
    const results: SearchResult[] = []

    // Map back to actual messages
    parsed.results.forEach((result: any) => {
      const chat = chats[result.chatIndex]
      if (chat && chat.messages[result.messageIndex]) {
        const message = chat.messages[result.messageIndex]
        results.push({
          chatId: chat.id,
          chatTitle: chat.title,
          messageContent: message.content,
          role: message.role,
          timestamp: message.timestamp,
          relevanceScore: result.relevanceScore,
        })
      }
    })

    return results
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Bitte gib eine Suchanfrage ein!")
      return
    }

    setIsSearching(true)
    setSearchResults([])

    try {
      let results: SearchResult[]

      if (useAISearch) {
        results = await performAISearch(searchQuery)
      } else {
        results = performBasicSearch(searchQuery)
      }

      setSearchResults(results)
      console.log(`[KnowledgeBase] Found ${results.length} results`)
    } catch (error) {
      console.error("[KnowledgeBase] Search failed:", error)
      alert("Suche fehlgeschlagen. Bitte versuche es erneut.")
    } finally {
      setIsSearching(false)
    }
  }

  const navigateToChat = (chatId: string) => {
    setCurrentChat(chatId)
    // Close settings dialog (user will see it in context)
    window.dispatchEvent(new CustomEvent("closeSettings"))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
          <Database className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base">Personal Knowledge Base</h3>
          <p className="text-xs text-muted-foreground">
            Durchsuche {chats.length} Konversationen ({totalMessages} Nachrichten)
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-500/30">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Basic Search:</strong> Schnelle Textsuche, keine Tokens
            </p>
            <p>
              <strong>AI Search:</strong> Semantische Suche mit Kontext (~500-1000 Tokens)
            </p>
          </div>
        </div>
      </Card>

      {/* Search Controls */}
      <Card className="p-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="search-query">Suchanfrage</Label>
          <div className="flex gap-2">
            <Input
              id="search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="z.B. 'Python Tipps' oder 'Wie funktioniert...'"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor="ai-search" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>AI-gestützte Suche (verbraucht Tokens)</span>
          </Label>
          <Switch
            id="ai-search"
            checked={useAISearch}
            onCheckedChange={setUseAISearch}
          />
        </div>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Suchergebnisse ({searchResults.length})
          </h4>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {searchResults.map((result, idx) => (
                <Card
                  key={idx}
                  className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigateToChat(result.chatId)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-sm truncate">{result.chatTitle}</span>
                    </div>
                    {result.relevanceScore && (
                      <Badge variant="secondary" className="shrink-0">
                        {result.relevanceScore}% relevant
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      result.role === "user" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                    )}>
                      {result.role === "user" ? "User" : "Assistant"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(result.timestamp).toLocaleDateString("de-DE")}
                    </span>
                  </div>

                  <p className="text-sm line-clamp-3 mb-2">
                    {result.messageContent}
                  </p>

                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Zur Konversation
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Empty State - No Results */}
      {!isSearching && searchQuery && searchResults.length === 0 && (
        <Card className="p-6 text-center bg-muted/30 border-dashed">
          <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            Keine Ergebnisse für "{searchQuery}"
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Versuche andere Suchbegriffe oder aktiviere die AI-Suche
          </p>
        </Card>
      )}

      {/* Empty State - Initial */}
      {!searchQuery && searchResults.length === 0 && (
        <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-dashed">
          <Database className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-70" />
          <p className="text-sm text-muted-foreground mb-2">
            Durchsuche dein persönliches Wissen
          </p>
          <p className="text-xs text-muted-foreground">
            Alle deine Konversationen sind durchsuchbar - mit oder ohne KI
          </p>
        </Card>
      )}
    </div>
  )
}
