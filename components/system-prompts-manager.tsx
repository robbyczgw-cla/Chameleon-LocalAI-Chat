"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Check } from "lucide-react"
import type { SystemPrompt } from "@/types"
import { toast } from "sonner"

/**
 * System Prompts Manager - Local-First Edition
 * Uses SQLite via API for persistence
 */
export function SystemPromptsManager() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: "",
  })

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/db/system-prompts')
      if (response.ok) {
        const loadedPrompts = await response.json()
        setPrompts(loadedPrompts)
      }
    } catch (error) {
      console.error("Error loading prompts:", error)
      toast.error("Fehler beim Laden der System Prompts")
    }
  }

  const handleOpenDialog = (prompt?: SystemPrompt) => {
    if (prompt) {
      setEditingPrompt(prompt)
      setFormData({
        name: prompt.name,
        description: prompt.description,
        prompt: prompt.prompt,
      })
    } else {
      setEditingPrompt(null)
      setFormData({ name: "", description: "", prompt: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSavePrompt = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      toast.error("Name und Prompt sind erforderlich")
      return
    }

    try {
      if (editingPrompt) {
        // Update existing prompt
        const updated: SystemPrompt = {
          ...editingPrompt,
          name: formData.name,
          description: formData.description,
          prompt: formData.prompt,
          updatedAt: Date.now(),
        }

        const response = await fetch('/api/db/system-prompts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        })

        if (response.ok) {
          setPrompts(prompts.map((p) => (p.id === updated.id ? updated : p)))
          toast.success("System Prompt aktualisiert")
        }
      } else {
        // Create new prompt
        const newPrompt: SystemPrompt = {
          id: crypto.randomUUID(),
          name: formData.name,
          description: formData.description,
          prompt: formData.prompt,
          isDefault: prompts.length === 0, // First prompt is default
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        const response = await fetch('/api/db/system-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPrompt),
        })

        if (response.ok) {
          setPrompts([...prompts, newPrompt])
          toast.success("System Prompt erstellt")
        }
      }

      setIsDialogOpen(false)
      setFormData({ name: "", description: "", prompt: "" })
    } catch (error) {
      console.error("Error saving prompt:", error)
      toast.error("Fehler beim Speichern")
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    const prompt = prompts.find((p) => p.id === promptId)
    if (prompt?.isDefault) {
      toast.error("Der Standard-Prompt kann nicht gelöscht werden")
      return
    }

    try {
      const response = await fetch(`/api/db/system-prompts?id=${promptId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPrompts(prompts.filter((p) => p.id !== promptId))
        toast.success("System Prompt gelöscht")
      }
    } catch (error) {
      console.error("Error deleting prompt:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  const handleSetDefault = async (promptId: string) => {
    try {
      const response = await fetch('/api/db/system-prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promptId, isDefault: true }),
      })

      if (response.ok) {
        setPrompts(prompts.map((p) => ({ ...p, isDefault: p.id === promptId })))
        toast.success("Standard-Prompt gesetzt")
      }
    } catch (error) {
      console.error("Error setting default:", error)
      toast.error("Fehler beim Setzen des Standards")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">System Prompts</h3>
          <p className="text-sm text-muted-foreground">Verwalten Sie Ihre benutzerdefinierten AI-Personas</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Prompt
        </Button>
      </div>

      <div className="grid gap-3">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className={prompt.isDefault ? "border-primary" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{prompt.name}</CardTitle>
                    {prompt.isDefault && (
                      <Badge variant="default" className="text-xs">
                        Standard
                      </Badge>
                    )}
                  </div>
                  {prompt.description && <CardDescription className="text-xs">{prompt.description}</CardDescription>}
                </div>
                <div className="flex gap-1">
                  {!prompt.isDefault && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetDefault(prompt.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(prompt)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!prompt.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeletePrompt(prompt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{prompt.prompt}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? "Prompt bearbeiten" : "Neuer System Prompt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">Name</Label>
              <Input
                id="prompt-name"
                placeholder="z.B. Code Expert, Creative Writer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-description">Beschreibung (optional)</Label>
              <Input
                id="prompt-description"
                placeholder="Kurze Beschreibung dieser Persona"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-content">System Prompt</Label>
              <Textarea
                id="prompt-content"
                placeholder="You are a helpful AI assistant..."
                rows={8}
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSavePrompt}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
