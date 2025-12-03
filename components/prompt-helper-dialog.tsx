"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Copy, Send, Lightbulb, BookOpen, CheckCircle2, XCircle } from "lucide-react"
import { PROMPT_ENGINEERING_TIPS, PROMPT_TEMPLATES, improvePrompt } from "@/lib/prompt-engineering"
import { useApp } from "@/contexts/app-context"

interface PromptHelperDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUsePrompt?: (prompt: string) => void
}

export function PromptHelperDialog({ open, onOpenChange, onUsePrompt }: PromptHelperDialogProps) {
  const { settings } = useApp()
  const [draftPrompt, setDraftPrompt] = useState("")
  const [improvedPrompt, setImprovedPrompt] = useState("")
  const [isImproving, setIsImproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImprove = async () => {
    if (!draftPrompt.trim()) {
      setError("Please enter a prompt first")
      return
    }

    setIsImproving(true)
    setError(null)

    try {
      const apiKey = settings.apiKeys?.openRouter || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
      if (!apiKey) {
        throw new Error("OpenRouter API key not configured. Please add your API key in Settings → API Keys")
      }

      const improved = await improvePrompt(draftPrompt, apiKey)
      setImprovedPrompt(improved)
    } catch (err) {
      console.error("[PromptHelper] Failed to improve prompt:", err)
      setError(err instanceof Error ? err.message : "Failed to improve prompt")
    } finally {
      setIsImproving(false)
    }
  }

  const handleCopy = async () => {
    if (improvedPrompt) {
      await navigator.clipboard.writeText(improvedPrompt)
    }
  }

  const handleUseNow = () => {
    if (improvedPrompt && onUsePrompt) {
      onUsePrompt(improvedPrompt)
      onOpenChange(false)
    }
  }

  const handleUseTemplate = (template: string) => {
    setDraftPrompt(template)
    setImprovedPrompt("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] !max-w-[95vw] md:w-[67vw] md:!max-w-[67vw] h-[90vh] p-4 md:p-6 overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Prompt Engineering Helper
          </DialogTitle>
          <DialogDescription className="text-sm">
            Transform your prompts into effective, well-structured requests that get better AI responses
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0 overflow-hidden">
          {/* Left Panel: Tips & Templates */}
          <div className="w-full md:w-[380px] flex-shrink-0 border rounded-lg overflow-hidden h-full max-h-[300px] md:max-h-full">
            <Tabs defaultValue="tips" className="h-full flex flex-col">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="tips" className="flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  Tips
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tips" className="flex-1 overflow-hidden mt-2">
                <ScrollArea className="h-full px-4">
                  <div className="space-y-4 pb-4">
                    {PROMPT_ENGINEERING_TIPS.map((tip, index) => (
                      <div key={index} className="space-y-2 p-3 rounded-lg bg-muted/30">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {tip.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{tip.description}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-red-600/80">{tip.example.bad}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-green-600/80">{tip.example.good}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="templates" className="flex-1 overflow-hidden mt-2">
                <ScrollArea className="h-full px-4">
                  <div className="space-y-3 pb-4">
                    {PROMPT_TEMPLATES.map((template, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-xs text-muted-foreground">{template.category}</div>
                            <h4 className="font-semibold text-sm">{template.name}</h4>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUseTemplate(template.template)}
                            className="h-7 text-xs"
                          >
                            Use
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{template.template}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel: Prompt Editor */}
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto min-w-0 pr-2">
            {/* Draft Prompt */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Your Draft Prompt</label>
              <Textarea
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
                placeholder="Enter your prompt here... (e.g., 'help me with code')"
                className="resize-none font-mono text-sm h-[200px] md:h-[350px]"
              />
              <div className="flex items-center gap-2">
                <Button onClick={handleImprove} disabled={isImproving || !draftPrompt.trim()} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {isImproving ? "Improving..." : "Improve Prompt"}
                </Button>
                {error && <span className="text-sm text-red-500">{error}</span>}
              </div>
            </div>

            {/* Improved Prompt */}
            {improvedPrompt && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-green-600">Improved Prompt</label>
                <Textarea
                  value={improvedPrompt}
                  onChange={(e) => setImprovedPrompt(e.target.value)}
                  className="resize-none font-mono text-sm border-green-500/30 bg-green-50/5 h-[200px] md:h-[350px]"
                />
                <div className="flex items-center gap-2">
                  <Button onClick={handleUseNow} className="gap-2">
                    <Send className="h-4 w-4" />
                    Use in Chat
                  </Button>
                  <Button onClick={handleCopy} variant="outline" className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {/* Placeholder when no improvement yet */}
            {!improvedPrompt && !isImproving && (
              <div className="flex items-center justify-center border-2 border-dashed rounded-lg h-[200px] md:h-[350px]">
                <div className="text-center text-muted-foreground p-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Your improved prompt will appear here</p>
                  <p className="text-xs mt-2">Enter a draft above and click "Improve Prompt"</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isImproving && (
              <div className="flex items-center justify-center border-2 border-dashed rounded-lg h-[200px] md:h-[350px]">
                <div className="text-center text-muted-foreground p-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
                  <p className="text-sm">Analyzing and improving your prompt...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
