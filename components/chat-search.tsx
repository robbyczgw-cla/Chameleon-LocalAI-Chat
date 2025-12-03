"use client"

import { useState, useMemo, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MessageSquare, Trash2, Loader2, Zap } from "lucide-react"
import { searchService } from "@/lib/search-service"
import type { Chat } from "@/types"

interface SearchResult {
  chat: Chat
  matchType: "title" | "content"
  preview: string
  matchCount: number
  score: number
}

interface ChatSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatSearch({ open, onOpenChange }: ChatSearchProps) {
  const { chats, setCurrentChat, deleteChat } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setIsSearching(false)
    }, 300)

    if (searchQuery !== debouncedQuery) {
      setIsSearching(true)
    }

    return () => clearTimeout(timer)
  }, [searchQuery, debouncedQuery])

  // Build index when dialog opens
  useEffect(() => {
    if (open && !searchService.isIndexFresh()) {
      searchService.buildIndex(chats)
    }
  }, [open, chats])

  // Perform indexed search with better performance
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return []

    const startTime = performance.now()
    const results = searchService.search(debouncedQuery, chats)
    const displayResults: SearchResult[] = []

    results.forEach((result) => {
      const chat = chats.find((c) => c.id === result.chatId)
      if (!chat) return

      // Extract preview from first matching message
      let preview = chat.title
      if (result.messageMatches.length > 0 && !result.titleMatch) {
        const firstMatchMsg = chat.messages.find((m) => m.id === result.messageMatches[0])
        if (firstMatchMsg) {
          const query = debouncedQuery.toLowerCase()
          const content = firstMatchMsg.content
          const index = content.toLowerCase().indexOf(query)
          if (index >= 0) {
            const start = Math.max(0, index - 50)
            const end = Math.min(content.length, index + query.length + 50)
            preview = (start > 0 ? "..." : "") + content.substring(start, end) + (end < content.length ? "..." : "")
          } else {
            preview = content.substring(0, 100) + (content.length > 100 ? "..." : "")
          }
        }
      }

      displayResults.push({
        chat,
        matchType: result.titleMatch ? "title" : "content",
        preview,
        matchCount: result.messageMatches.length + (result.titleMatch ? 1 : 0),
        score: result.score,
      })
    })

    const searchTime = performance.now() - startTime
    console.log(`[Search] Found ${displayResults.length} results in ${searchTime.toFixed(2)}ms`)

    return displayResults
  }, [debouncedQuery, chats])

  const handleSelectChat = (chatId: string) => {
    setCurrentChat(chatId)
    onOpenChange(false)
    setSearchQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Chats durchsuchen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Chat-Titel oder Nachricht durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-base pr-10"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {searchService.isIndexFresh() && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
              <Zap className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span>Indexed search active - Lightning fast results!</span>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (
                  isSearching ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : (
                    "Keine Chats gefunden"
                  )
                ) : (
                  "Gib etwas ein um zu suchen"
                )}
              </div>
            ) : (
              searchResults.map((result) => (
                <div
                  key={result.chat.id}
                  className="p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors group"
                  onClick={() => handleSelectChat(result.chat.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <h3 className="font-semibold text-sm truncate">
                          {result.chat.title}
                        </h3>
                        {result.matchCount > 0 && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded">
                            {result.matchCount} {result.matchCount === 1 ? "Treffer" : "Treffer"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {result.preview}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.chat.messages.length} Nachrichten •{" "}
                        {new Date(result.chat.updatedAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Chat "${result.chat.title}" wirklich löschen?`)) {
                          deleteChat(result.chat.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              {searchResults.length} Chat{searchResults.length !== 1 ? "s" : ""} gefunden
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
