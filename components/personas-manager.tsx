"use client"

import { useState, useEffect } from "react"
import { PERSONAS, type Persona } from "@/lib/personas"
import { PersonasStorageService } from "@/lib/personas-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit2, Trash2, X, Sparkles, Loader2, Settings, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/contexts/app-context"
import { PersonaAdvancedSettings } from "@/components/persona-advanced-settings"
import { PersonaInfoDialog } from "@/components/persona-info-dialog"
import { getPersonaDescription } from "@/lib/languages"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PersonasManager() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [generatingAvatar, setGeneratingAvatar] = useState(false)
  const [generatingPrompt, setGeneratingPrompt] = useState(false)
  const [promptDescription, setPromptDescription] = useState("")
  const [advancedSettingsPersona, setAdvancedSettingsPersona] = useState<Persona | null>(null)
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false)
  const [infoPersona, setInfoPersona] = useState<Persona | null>(null)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Persona>>({
    name: "",
    emoji: "😊",
    description: "",
    personality: "",
    prompt: "", // Keep for backward compatibility
    color: "from-blue-500 to-purple-600",
    avatarUrl: undefined,
  })
  const { toast } = useToast()
  const { settings } = useApp()

  const emojis = [
    "😊", "🎭", "🎓", "🎨", "💻", "⚡", "✨", "🗺️", "🤔", "🌌",
    "🎵", "🔊", "🔍", "💪", "🏈", "🎤", "🎮", "📖", "🚀", "⭐",
    "💡", "🔮", "🎯", "🏆", "🌟", "💎", "🦁", "🐉", "👑", "⚔️"
  ]

  useEffect(() => {
    setPersonas(PERSONAS)
    loadCustomPersonas()
  }, [])

  const loadCustomPersonas = () => {
    const custom = PersonasStorageService.loadCustomPersonas()
    setCustomPersonas(custom)
  }

  const saveCustomPersonas = (updated: Persona[]) => {
    PersonasStorageService.saveCustomPersonas(updated)
    setCustomPersonas(updated)
  }

  const handleOpenDialog = (persona?: Persona) => {
    if (persona) {
      setEditingPersona(persona)
      setFormData(persona)
      setSelectedTemplate("")
    } else {
      setEditingPersona(null)
      setFormData({
        name: "",
        emoji: "😊",
        description: "",
        prompt: "",
        color: "from-blue-500 to-purple-600",
        avatarUrl: undefined,
      })
      setSelectedTemplate("")
    }
    setIsDialogOpen(true)
  }

  const handleGenerateAvatar = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte Name und Beschreibung eingeben",
        variant: "destructive",
      })
      return
    }

    setGeneratingAvatar(true)
    try {
      const prompt = `Portrait of ${formData.name}, ${formData.description}, professional avatar style, centered face, neutral background, high quality`

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'google/gemini-2.5-flash-image',
          apiKey: settings.apiKeys.openRouter,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate avatar')
      }

      const data = await response.json()
      setFormData({ ...formData, avatarUrl: data.url })
      toast({
        title: "✅ Avatar generiert!",
        description: "Profilbild erfolgreich erstellt",
      })
    } catch (error) {
      console.error('Avatar generation error:', error)
      toast({
        title: "Fehler bei Avatar-Generierung",
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: "destructive",
      })
    } finally {
      setGeneratingAvatar(false)
    }
  }

  const handleGeneratePrompt = async () => {
    if (!promptDescription.trim()) {
      toast({
        title: "Beschreibung fehlt",
        description: "Bitte beschreibe die Persona, damit die KI eine Persönlichkeit generieren kann",
        variant: "destructive",
      })
      return
    }

    setGeneratingPrompt(true)
    try {
      const personalityTemplate = `Du bist ein Experte für KI-Persona-Design. Erstelle eine detaillierte Persönlichkeits-Beschreibung für eine AI-Chat-Persona basierend auf folgender Beschreibung:

"${promptDescription}"

Die Persönlichkeits-Beschreibung wird zu einem Basis-System-Prompt HINZUGEFÜGT, nicht ersetzt. Sie sollte:

1. Die Persönlichkeit, Rolle und den Namen der Persona klar definieren (z.B. "Du heißt Max und bist...")
2. Den Kommunikationsstil beschreiben (z.B. "Du antwortest freundlich und geduldig...")
3. Die Expertise und Spezialgebiete nennen (z.B. "Du bist Experte in...")
4. Besondere Verhaltensweisen oder Eigenarten erwähnen (z.B. "Du nutzt gerne Metaphern...")
5. Wie die Persona mit dem User interagiert (z.B. "Du stellst auch Gegenfragen...")

WICHTIG: Schreibe NUR die Persönlichkeits-Beschreibung, keine Erklärungen davor oder danach. Die Beschreibung sollte in der "Du"-Form geschrieben sein und direkt an die KI gerichtet. Füge KEINE Follow-Up-Strukturen hinzu (die sind im Basis-Prompt).`

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKeys.openRouter}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'x-ai/grok-4.1-fast', // Fast model for persona generation
          messages: [
            { role: 'user', content: personalityTemplate }
          ],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to generate personality')
      }

      const data = await response.json()
      const generatedPersonality = data.choices[0]?.message?.content || ''

      setFormData({ ...formData, personality: generatedPersonality })
      setPromptDescription("") // Clear the description after successful generation

      toast({
        title: "🎯 Persönlichkeit generiert!",
        description: "Die KI-generierte Persönlichkeit wurde eingefügt. Du kannst sie noch anpassen!",
      })
    } catch (error) {
      console.error('Personality generation error:', error)
      toast({
        title: "Fehler bei Persönlichkeits-Generierung",
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: "destructive",
      })
    } finally {
      setGeneratingPrompt(false)
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    const allPersonas = [...personas, ...customPersonas]
    const template = allPersonas.find((p) => p.id === templateId)
    if (template) {
      setFormData({
        name: `${template.name} (Kopie)`,
        emoji: template.emoji,
        description: template.description,
        prompt: template.prompt,
        color: template.color,
      })
      setSelectedTemplate(templateId)
      toast({
        title: "✅ Template geladen",
        description: `"${template.name}" als Vorlage ausgewählt`,
      })
    }
  }

  const handleSavePersona = () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Fehler",
        description: "Name ist erforderlich",
        variant: "destructive",
      })
      return
    }

    // At least personality or prompt (for backward compatibility) should be provided
    if (!formData.personality?.trim() && !formData.prompt?.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte füge eine Persönlichkeit hinzu (manuell oder KI-generiert)",
        variant: "destructive",
      })
      return
    }

    if (editingPersona) {
      // Check if it's a built-in persona or custom persona
      const isBuiltIn = personas.some((p) => p.id === editingPersona.id)

      if (isBuiltIn) {
        // If it's a built-in persona, save the modified version as a custom persona
        const customVersion: Persona = {
          id: `custom-${editingPersona.id}-${Date.now()}`,
          name: formData.name || editingPersona.name,
          emoji: formData.emoji || editingPersona.emoji,
          description: formData.description || editingPersona.description,
          personality: formData.personality,
          prompt: formData.prompt || editingPersona.prompt, // Keep for backward compatibility
          color: formData.color || editingPersona.color,
          avatarUrl: formData.avatarUrl,
        }
        saveCustomPersonas([...customPersonas, customVersion])
        toast({
          title: "✅ Persona erstellt",
          description: `"${formData.name}" wurde als neue Persona erstellt`,
        })
      } else {
        // Update existing custom persona
        const updated = customPersonas.map((p) =>
          p.id === editingPersona.id
            ? {
                ...p,
                name: formData.name || p.name,
                emoji: formData.emoji || p.emoji,
                description: formData.description || p.description,
                personality: formData.personality,
                prompt: formData.prompt || p.prompt, // Keep for backward compatibility
                color: formData.color || p.color,
                avatarUrl: formData.avatarUrl,
              }
            : p
        )
        saveCustomPersonas(updated)
        toast({
          title: "✅ Persona aktualisiert",
          description: `"${formData.name}" wurde erfolgreich bearbeitet`,
        })
      }
    } else {
      // Create new custom persona
      const newPersona: Persona = {
        id: `custom-${Date.now()}`,
        name: formData.name || "Neue Persona",
        emoji: formData.emoji || "😊",
        description: formData.description || "",
        personality: formData.personality,
        prompt: formData.prompt || "", // Keep for backward compatibility
        color: formData.color || "from-blue-500 to-purple-600",
        avatarUrl: formData.avatarUrl,
      }
      saveCustomPersonas([...customPersonas, newPersona])
      toast({
        title: "✅ Persona erstellt",
        description: `"${formData.name}" wurde erfolgreich hinzugefügt`,
      })
    }

    setIsDialogOpen(false)
  }

  const handleDeletePersona = (persona: Persona) => {
    const updated = customPersonas.filter((p) => p.id !== persona.id)
    saveCustomPersonas(updated)
    toast({
      title: "✅ Persona gelöscht",
      description: `"${persona.name}" wurde entfernt`,
    })
  }

  const handleOpenAdvancedSettings = (persona: Persona) => {
    setAdvancedSettingsPersona(persona)
    setIsAdvancedSettingsOpen(true)
  }

  const handleSaveAdvancedSettings = (updatedPersona: Persona) => {
    // Check if it's a built-in or custom persona
    const isCustom = customPersonas.some((p) => p.id === updatedPersona.id)

    if (isCustom) {
      // Update custom persona
      const updated = customPersonas.map((p) => (p.id === updatedPersona.id ? updatedPersona : p))
      saveCustomPersonas(updated)
    } else {
      // For built-in personas, we can't modify them directly
      // Instead, we need to save the settings separately or notify the user
      // For now, let's just show a toast that settings are saved (they're stored in the persona object)
      toast({
        title: "⚠️ Info",
        description:
          "Erweiterte Einstellungen für vorhandene Personas werden nur in dieser Session gespeichert. Erstelle eine eigene Persona für permanente Einstellungen.",
        duration: 5000,
      })
    }

    // Trigger personas changed event to reload
    window.dispatchEvent(new CustomEvent("personasChanged"))
  }

  const handleOpenInfo = (persona: Persona) => {
    setInfoPersona(persona)
    setIsInfoDialogOpen(true)
  }

  const allPersonas = [...personas, ...customPersonas]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Personas Manager</h3>
          <p className="text-sm text-muted-foreground">Bearbeite und erstelle deine eigenen Personas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPersona ? "Persona bearbeiten" : "Neue Persona erstellen"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="z.B. Cami"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Select value={formData.emoji || "😊"} onValueChange={(value) => setFormData({ ...formData, emoji: value })}>
                    <SelectTrigger id="emoji">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {emojis.map((emoji) => (
                        <SelectItem key={emoji} value={emoji}>
                          {emoji}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  placeholder="Kurze Beschreibung der Persona"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Profilbild (AI generiert)</Label>
                {formData.avatarUrl && (
                  <div className="flex justify-center">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAvatar}
                  disabled={generatingAvatar || !formData.name || !formData.description}
                  className="w-full gap-2"
                >
                  {generatingAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generiere Avatar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {formData.avatarUrl ? "Neuen Avatar generieren" : "Avatar generieren"}
                    </>
                  )}
                </Button>
                {!formData.name || !formData.description ? (
                  <p className="text-xs text-muted-foreground">
                    Bitte Name und Beschreibung eingeben, um Avatar zu generieren
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Farbe (Tailwind Gradient)</Label>
                <Input
                  id="color"
                  placeholder="from-blue-500 to-purple-600"
                  value={formData.color || ""}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              {/* AI-Assisted Personality Generation */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/40">
                <Label htmlFor="prompt-description" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>KI-gestützte Persönlichkeits-Generierung</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Beschreibe kurz, wer die Persona ist, und die KI generiert eine detaillierte Persönlichkeit, die zum Basis-System-Prompt hinzugefügt wird.
                </p>
                <Textarea
                  id="prompt-description"
                  placeholder="z.B. Ein lockerer Game Developer der gerne Witze macht und in Unity und Unreal Engine Experte ist..."
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGeneratePrompt}
                  disabled={generatingPrompt || !promptDescription.trim()}
                  className="w-full gap-2"
                >
                  {generatingPrompt ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generiere Persönlichkeit mit KI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Persönlichkeit generieren
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality" className="flex items-center gap-2">
                  <span>Persona Persönlichkeit</span>
                  <span className="text-xs text-muted-foreground font-normal">(wird zum Basis-Prompt hinzugefügt)</span>
                </Label>
                <Textarea
                  id="personality"
                  placeholder="Die Persönlichkeit und Verhaltensweise dieser Persona... (oder nutze die KI-Generierung oben)"
                  value={formData.personality || ""}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  rows={8}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tipp: Diese Persönlichkeit wird zum Standard-System-Prompt hinzugefügt, nicht ersetzt. Das sorgt für Konsistenz!
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSavePersona} className="flex-1">
                  {editingPersona ? "Speichern" : "Erstellen"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Built-in Personas */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Vorhandene Personas</h4>
        <div className="grid gap-3">
          {personas.map((persona) => (
            <Card key={persona.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{persona.emoji}</span>
                    <div>
                      <h5 className="font-semibold text-sm">{persona.name}</h5>
                      <p className="text-xs text-muted-foreground">{getPersonaDescription(persona.id, settings.language)}</p>
                    </div>
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground line-clamp-2">
                    {persona.personality || persona.prompt || "Keine Persönlichkeit definiert"}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenInfo(persona)}
                    className="h-8 w-8 p-0"
                    title="Info & Stats"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(persona)}
                    className="h-8 w-8 p-0"
                    title="Bearbeiten"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenAdvancedSettings(persona)}
                    className="h-8 w-8 p-0"
                    title="Erweiterte Einstellungen"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Personas */}
      {customPersonas.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Deine eigenen Personas</h4>
          <div className="grid gap-3">
            {customPersonas.map((persona) => (
              <Card key={persona.id} className="p-4 border-blue-200 dark:border-blue-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{persona.emoji}</span>
                      <div>
                        <h5 className="font-semibold text-sm">{persona.name}</h5>
                        <p className="text-xs text-muted-foreground">{getPersonaDescription(persona.id, settings.language)}</p>
                      </div>
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground line-clamp-2">
                    {persona.personality || persona.prompt || "Keine Persönlichkeit definiert"}
                  </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenInfo(persona)}
                      className="h-8 w-8 p-0"
                      title="Info & Stats"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(persona)}
                      className="h-8 w-8 p-0"
                      title="Bearbeiten"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenAdvancedSettings(persona)}
                      className="h-8 w-8 p-0"
                      title="Erweiterte Einstellungen"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePersona(persona)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings Dialog */}
      {advancedSettingsPersona && (
        <PersonaAdvancedSettings
          persona={advancedSettingsPersona}
          open={isAdvancedSettingsOpen}
          onOpenChange={setIsAdvancedSettingsOpen}
          onSave={handleSaveAdvancedSettings}
        />
      )}

      {/* Persona Info Dialog */}
      {infoPersona && (
        <PersonaInfoDialog persona={infoPersona} open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen} />
      )}
    </div>
  )
}
