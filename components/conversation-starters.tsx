"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { conversationStarters, creativeActions, simpleStatsService, type ConversationStarter, type CreativeAction } from "@/lib/simple-mode-features"
import { cn } from "@/lib/utils"
import { Sparkles, MessageCircle, Lightbulb, Palette, BookOpen, X, ChevronRight } from "lucide-react"

const translations = {
  en: {
    starters: "Quick Actions",
    startersDesc: "Need inspiration? Try one of these!",
    creative: "Creative Corner",
    creativeDesc: "Let your creativity flow!",
    fun: "Fun",
    helpful: "Helpful",
    learning: "Learning",
    creativeCategory: "Creative",
    use: "Use",
    back: "Back",
    fillBlanks: "Fill in the blanks:",
    generate: "Generate",
    cancel: "Cancel",
  },
  de: {
    starters: "Schnellaktionen",
    startersDesc: "Brauchst du Inspiration? Probier eines davon!",
    creative: "Kreativ-Ecke",
    creativeDesc: "Lass deiner Kreativität freien Lauf!",
    fun: "Spaß",
    helpful: "Hilfreich",
    learning: "Lernen",
    creativeCategory: "Kreativ",
    use: "Nutzen",
    back: "Zurück",
    fillBlanks: "Fülle die Lücken:",
    generate: "Generieren",
    cancel: "Abbrechen",
  },
}

interface ConversationStartersProps {
  onSelectPrompt: (prompt: string) => void
  lang: "en" | "de"
}

export function ConversationStartersGrid({ onSelectPrompt, lang }: ConversationStartersProps) {
  const t = translations[lang]

  const categoryEmojis = {
    fun: "🎉",
    helpful: "🤝",
    learning: "📚",
    creative: "✨",
  }

  const categoryColors = {
    fun: "from-pink-500 to-rose-500",
    helpful: "from-blue-500 to-cyan-500",
    learning: "from-amber-500 to-orange-500",
    creative: "from-purple-500 to-violet-500",
  }

  // Take first 6 starters for quick display
  const quickStarters = conversationStarters.slice(0, 6)

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
      {quickStarters.map((starter) => (
        <button
          key={starter.id}
          onClick={() => onSelectPrompt(starter.prompt[lang])}
          className={cn(
            "flex flex-col items-center gap-1.5 p-2.5 sm:p-4 rounded-xl border border-border",
            "hover:border-violet-300 hover:bg-violet-500/5 transition-all text-center"
          )}
        >
          <span className="text-xl sm:text-3xl">{starter.emoji}</span>
          <span className="text-[10px] sm:text-sm font-medium leading-tight line-clamp-2">{starter.label[lang]}</span>
        </button>
      ))}
    </div>
  )
}

// Full Conversation Starters Dialog
interface StartersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPrompt: (prompt: string) => void
  lang: "en" | "de"
}

export function StartersDialog({ open, onOpenChange, onSelectPrompt, lang }: StartersDialogProps) {
  const t = translations[lang]
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    { id: "fun", label: t.fun, emoji: "🎉", color: "from-pink-500 to-rose-500" },
    { id: "helpful", label: t.helpful, emoji: "🤝", color: "from-blue-500 to-cyan-500" },
    { id: "learning", label: t.learning, emoji: "📚", color: "from-amber-500 to-orange-500" },
    { id: "creative", label: t.creativeCategory, emoji: "✨", color: "from-purple-500 to-violet-500" },
  ]

  const filteredStarters = selectedCategory
    ? conversationStarters.filter((s) => s.category === selectedCategory)
    : conversationStarters

  const handleSelect = (starter: ConversationStarter) => {
    onSelectPrompt(starter.prompt[lang])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-violet-500" />
            {t.starters}
          </DialogTitle>
          <DialogDescription>{t.startersDesc}</DialogDescription>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all",
                selectedCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white`
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Starters List */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-4">
          {filteredStarters.map((starter) => (
            <button
              key={starter.id}
              onClick={() => handleSelect(starter)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-violet-300 hover:bg-violet-500/5 transition-all text-left"
            >
              <span className="text-2xl">{starter.emoji}</span>
              <span className="flex-1 font-medium text-sm">{starter.label[lang]}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Creative Corner Dialog
interface CreativeCornerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (prompt: string) => void
  lang: "en" | "de"
}

export function CreativeCornerDialog({ open, onOpenChange, onGenerate, lang }: CreativeCornerDialogProps) {
  const t = translations[lang]
  const [selectedAction, setSelectedAction] = useState<CreativeAction | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})

  // Extract variables from template (e.g., {genre}, {topic})
  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{(\w+)\}/g)
    return matches ? matches.map((m) => m.slice(1, -1)) : []
  }

  const handleActionSelect = (action: CreativeAction) => {
    setSelectedAction(action)
    setVariables({})
  }

  const handleGenerate = () => {
    if (!selectedAction) return

    let prompt = selectedAction.promptTemplate[lang]
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(`{${key}}`, value || `[${key}]`)
    })

    simpleStatsService.recordCreativeCorner()
    onGenerate(prompt)
    onOpenChange(false)
    setSelectedAction(null)
    setVariables({})
  }

  const handleBack = () => {
    setSelectedAction(null)
    setVariables({})
  }

  const requiredVars = selectedAction
    ? extractVariables(selectedAction.promptTemplate[lang])
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            {t.creative}
          </DialogTitle>
          <DialogDescription>{t.creativeDesc}</DialogDescription>
        </DialogHeader>

        {!selectedAction ? (
          /* Action Selection */
          <div className="flex-1 overflow-y-auto space-y-2 mt-4">
            {creativeActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionSelect(action)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border hover:border-purple-300 hover:bg-purple-500/5 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-2xl">
                  {action.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{action.label[lang]}</p>
                  <p className="text-sm text-muted-foreground">{action.description[lang]}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          /* Variable Input */
          <div className="flex-1 overflow-y-auto space-y-4 mt-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-2xl">{selectedAction.emoji}</span>
              <div>
                <p className="font-medium">{selectedAction.label[lang]}</p>
                <p className="text-xs text-muted-foreground">{selectedAction.description[lang]}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t.fillBlanks}</Label>
              {requiredVars.map((varName) => (
                <div key={varName} className="space-y-1">
                  <Label htmlFor={varName} className="text-sm capitalize">
                    {varName}
                  </Label>
                  <Input
                    id={varName}
                    placeholder={`Enter ${varName}...`}
                    value={variables[varName] || ""}
                    onChange={(e) =>
                      setVariables({ ...variables, [varName]: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                {t.back}
              </Button>
              <Button
                onClick={handleGenerate}
                className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t.generate}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Quick Creative Corner Button
interface CreativeCornerButtonProps {
  onClick: () => void
  lang: "en" | "de"
}

export function CreativeCornerButton({ onClick, lang }: CreativeCornerButtonProps) {
  const t = translations[lang]

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-violet-500/10 hover:from-purple-500/20 hover:to-violet-500/20 border border-purple-500/20 transition-all"
      title={t.creative}
    >
      <Palette className="h-3.5 w-3.5 text-purple-500" />
      <span className="text-xs font-medium">{t.creative}</span>
    </button>
  )
}
