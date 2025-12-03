"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CONVERSATION_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory, type ConversationTemplate } from "@/lib/templates"
import { useApp } from "@/contexts/app-context"
import { Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConversationTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConversationTemplatesDialog({ open, onOpenChange }: ConversationTemplatesDialogProps) {
  const { createChat, setCurrentChat, addMessage, settings } = useApp()
  const [selectedCategory, setSelectedCategory] = useState<string>('creative')

  const handleTemplateSelect = (template: ConversationTemplate) => {
    // Create new chat with template persona
    const newChatId = createChat(settings.selectedModel)
    setCurrentChat(newChatId)

    // Set persona if template specifies one
    // (This would require updating the chat's persona - we'll add to updateChat)

    // Add the template's initial prompt as first user message
    addMessage(newChatId, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: template.initialPrompt,
      timestamp: Date.now(),
    })

    // Close dialog
    onOpenChange(false)

    // Trigger sending the message (this would need integration with chat-input)
    // For now, user will see the prompt and can edit/send
  }

  const templates = getTemplatesByCategory(selectedCategory as any)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Conversation Templates</DialogTitle>
              <DialogDescription>
                Starte mit vorgefertigten Prompts für häufige Aufgaben
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-5">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                  <span>{cat.emoji}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            {TEMPLATE_CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getTemplatesByCategory(category.id as any).map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => handleTemplateSelect(template)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  template: ConversationTemplate
  onSelect: () => void
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        "p-4 hover:border-primary/50 transition-all cursor-pointer group",
        "hover:shadow-lg hover:shadow-primary/10"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl mt-1">{template.emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
            {template.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {template.personaId}
            </Badge>
            {template.followUpSuggestions && template.followUpSuggestions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                +{template.followUpSuggestions.length} follow-ups
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
