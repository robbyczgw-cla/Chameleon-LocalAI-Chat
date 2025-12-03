"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useApp } from "@/contexts/app-context"
import { Download, FileJson } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Chat, Message } from "@/types"

interface ExportTrainingDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TrainingExample {
  messages: Array<{
    role: "system" | "user" | "assistant"
    content: string
  }>
}

export function ExportTrainingDataDialog({ open, onOpenChange }: ExportTrainingDataDialogProps) {
  const { chats } = useApp()
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set())
  const [includeSystemPrompt, setIncludeSystemPrompt] = useState(true)
  const [minTurns, setMinTurns] = useState(2)
  const { toast } = useToast()

  const handleToggleChat = (chatId: string) => {
    const newSelected = new Set(selectedChats)
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId)
    } else {
      newSelected.add(chatId)
    }
    setSelectedChats(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedChats.size === chats.length) {
      setSelectedChats(new Set())
    } else {
      setSelectedChats(new Set(chats.map((chat) => chat.id)))
    }
  }

  const convertToTrainingFormat = (): TrainingExample[] => {
    const examples: TrainingExample[] = []

    const selectedChatObjects = chats.filter((chat) => selectedChats.has(chat.id))

    for (const chat of selectedChatObjects) {
      // Filter out messages without enough turns
      if (chat.messages.length < minTurns * 2) continue

      const messages: TrainingExample["messages"] = []

      // Add system prompt if enabled
      if (includeSystemPrompt && chat.messages[0]?.role === "system") {
        messages.push({
          role: "system",
          content: chat.messages[0].content,
        })
      }

      // Add user and assistant messages
      for (const message of chat.messages) {
        if (message.role === "user" || message.role === "assistant") {
          messages.push({
            role: message.role,
            content: message.content,
          })
        }
      }

      if (messages.length >= minTurns * 2) {
        examples.push({ messages })
      }
    }

    return examples
  }

  const handleExportJSONL = () => {
    const examples = convertToTrainingFormat()

    if (examples.length === 0) {
      toast({
        title: "No data to export",
        description: "Select at least one chat with enough conversation turns",
        variant: "destructive",
      })
      return
    }

    // Convert to JSONL format (one JSON per line)
    const jsonl = examples.map((example) => JSON.stringify(example)).join("\n")

    const blob = new Blob([jsonl], { type: "application/jsonl" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `training-data-${new Date().toISOString().split("T")[0]}.jsonl`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exported!",
      description: `Exported ${examples.length} conversation(s) in JSONL format`,
    })

    onOpenChange(false)
  }

  const handleExportJSON = () => {
    const examples = convertToTrainingFormat()

    if (examples.length === 0) {
      toast({
        title: "No data to export",
        description: "Select at least one chat with enough conversation turns",
        variant: "destructive",
      })
      return
    }

    const json = JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalExamples: examples.length,
        config: {
          includeSystemPrompt,
          minTurns,
        },
        examples,
      },
      null,
      2,
    )

    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `training-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exported!",
      description: `Exported ${examples.length} conversation(s) in JSON format`,
    })

    onOpenChange(false)
  }

  const eligibleChats = chats.filter((chat) => chat.messages.length >= minTurns * 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Export as Training Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 text-sm">
            <div className="font-medium mb-1">💡 About Training Data Export</div>
            <div className="text-muted-foreground">
              Export your conversations in JSONL format for fine-tuning LLMs (OpenAI, Anthropic, etc.). Each
              conversation becomes a training example with system/user/assistant turns.
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-system"
                checked={includeSystemPrompt}
                onCheckedChange={(checked) => setIncludeSystemPrompt(checked === true)}
              />
              <Label htmlFor="include-system" className="text-sm cursor-pointer">
                Include system prompt in each example
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Minimum conversation turns: {minTurns}</Label>
              <input
                type="range"
                min="1"
                max="10"
                value={minTurns}
                onChange={(e) => setMinTurns(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Only export chats with at least {minTurns} user-assistant exchanges
              </div>
            </div>
          </div>

          {/* Chat Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Conversations ({eligibleChats.length} eligible)</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedChats.size === chats.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
              {eligibleChats.length > 0 ? (
                eligibleChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleToggleChat(chat.id)}
                  >
                    <Checkbox checked={selectedChats.has(chat.id)} onCheckedChange={() => handleToggleChat(chat.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{chat.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {chat.messages.length} messages • {new Date(chat.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No conversations meet the minimum turn requirement
                </div>
              )}
            </div>
          </div>

          {/* Export Stats */}
          <div className="p-3 rounded-lg border bg-muted/30 text-sm">
            <div className="font-medium mb-2">📊 Export Preview</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Selected:</span> {selectedChats.size} conversation(s)
              </div>
              <div>
                <span className="text-muted-foreground">Total messages:</span>{" "}
                {chats
                  .filter((chat) => selectedChats.has(chat.id))
                  .reduce((sum, chat) => sum + chat.messages.length, 0)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleExportJSON} disabled={selectedChats.size === 0} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button onClick={handleExportJSONL} disabled={selectedChats.size === 0} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export JSONL (Fine-tuning)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
