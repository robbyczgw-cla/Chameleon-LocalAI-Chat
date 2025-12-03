"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Brain, Mic, Clock, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Persona, PersonaMemorySettings, PersonaVoiceSettings, PersonaContextSettings } from "@/lib/personas"
import { voiceService } from "@/lib/voice"
import { personaMemoryService } from "@/lib/persona-memory-service"

interface PersonaAdvancedSettingsProps {
  persona: Persona
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedPersona: Persona) => void
}

export function PersonaAdvancedSettings({ persona, open, onOpenChange, onSave }: PersonaAdvancedSettingsProps) {
  const { toast } = useToast()
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  // Memory settings
  const [memoryEnabled, setMemoryEnabled] = useState(persona.memorySettings?.enabled || false)
  const [maxConversations, setMaxConversations] = useState(persona.memorySettings?.maxConversations || 10)

  // Voice settings
  const [voiceEnabled, setVoiceEnabled] = useState(persona.voiceSettings?.enabled || false)
  const [selectedVoice, setSelectedVoice] = useState(persona.voiceSettings?.voiceName || "")
  const [voiceRate, setVoiceRate] = useState([persona.voiceSettings?.rate || 1])
  const [voicePitch, setVoicePitch] = useState([persona.voiceSettings?.pitch || 1])

  // Context awareness settings
  const [contextEnabled, setContextEnabled] = useState(persona.contextSettings?.enabled || false)
  const [useTimeBasedGreetings, setUseTimeBasedGreetings] = useState(
    persona.contextSettings?.useTimeBasedGreetings || false
  )
  const [detectMood, setDetectMood] = useState(persona.contextSettings?.detectMood || false)
  const [trackTopics, setTrackTopics] = useState(persona.contextSettings?.trackTopics || false)

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = voiceService.getVoices()
      setAvailableVoices(voices)
    }

    loadVoices()

    // Voices might not be loaded immediately
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const handleSave = () => {
    const memorySettings: PersonaMemorySettings = {
      enabled: memoryEnabled,
      maxConversations,
    }

    const voiceSettings: PersonaVoiceSettings = {
      enabled: voiceEnabled,
      voiceName: selectedVoice,
      rate: voiceRate[0],
      pitch: voicePitch[0],
    }

    const contextSettings: PersonaContextSettings = {
      enabled: contextEnabled,
      useTimeBasedGreetings,
      detectMood,
      trackTopics,
    }

    const updatedPersona: Persona = {
      ...persona,
      memorySettings,
      voiceSettings,
      contextSettings,
    }

    onSave(updatedPersona)
    toast({
      title: "✅ Einstellungen gespeichert",
      description: `Erweiterte Einstellungen für "${persona.name}" wurden aktualisiert`,
    })
    onOpenChange(false)
  }

  const handleClearMemories = () => {
    personaMemoryService.clearPersonaMemories(persona.id)
    toast({
      title: "🗑️ Erinnerungen gelöscht",
      description: `Alle Erinnerungen für "${persona.name}" wurden entfernt`,
    })
  }

  const memoryStats = personaMemoryService.getStats(persona.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{persona.emoji}</span>
            Erweiterte Einstellungen: {persona.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Memory Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle>Persona Memory</CardTitle>
              </div>
              <CardDescription>
                {persona.name} erinnert sich an vergangene Gespräche mit dir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="memory-enabled" className="flex flex-col gap-1">
                  <span>Memory aktivieren</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Erlaubt {persona.name}, sich an frühere Konversationen zu erinnern
                  </span>
                </Label>
                <Switch id="memory-enabled" checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
              </div>

              {memoryEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="max-conversations">
                      Max. gespeicherte Konversationen: {maxConversations}
                    </Label>
                    <Slider
                      id="max-conversations"
                      min={5}
                      max={30}
                      step={5}
                      value={[maxConversations]}
                      onValueChange={(value) => setMaxConversations(value[0])}
                      className="w-full"
                    />
                  </div>

                  {memoryStats.totalConversations > 0 && (
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="text-sm font-medium">Aktuelle Erinnerungen:</div>
                      <div className="text-xs text-muted-foreground">
                        {memoryStats.totalConversations} Gespräche gespeichert
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearMemories}
                        className="w-full gap-2 mt-2"
                      >
                        <Trash2 className="h-3 w-3" />
                        Alle Erinnerungen löschen
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Voice Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <CardTitle>Persona Voice</CardTitle>
              </div>
              <CardDescription>
                {persona.name} bekommt eine einzigartige Stimme für Text-to-Speech
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-enabled" className="flex flex-col gap-1">
                  <span>Eigene Stimme aktivieren</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Verwendet spezifische TTS-Einstellungen für {persona.name}
                  </span>
                </Label>
                <Switch id="voice-enabled" checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
              </div>

              {voiceEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="voice-select">Stimme wählen</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger id="voice-select">
                        <SelectValue placeholder="Standard-Stimme" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {availableVoices.map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voice-rate">Sprechgeschwindigkeit: {voiceRate[0].toFixed(1)}x</Label>
                    <Slider
                      id="voice-rate"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={voiceRate}
                      onValueChange={setVoiceRate}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voice-pitch">Tonhöhe: {voicePitch[0].toFixed(1)}</Label>
                    <Slider
                      id="voice-pitch"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={voicePitch}
                      onValueChange={setVoicePitch}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Context Awareness Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Context Awareness</CardTitle>
              </div>
              <CardDescription>
                {persona.name} passt sich an Zeit, Stimmung und Gesprächsthemen an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="context-enabled" className="flex flex-col gap-1">
                  <span>Context Awareness aktivieren</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Ermöglicht kontextbewusste Antworten
                  </span>
                </Label>
                <Switch id="context-enabled" checked={contextEnabled} onCheckedChange={setContextEnabled} />
              </div>

              {contextEnabled && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="time-greetings" className="flex flex-col gap-1">
                      <span>Zeitbasierte Begrüßungen</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        "Guten Morgen!" vs "Arbeitest du noch so spät?"
                      </span>
                    </Label>
                    <Switch
                      id="time-greetings"
                      checked={useTimeBasedGreetings}
                      onCheckedChange={setUseTimeBasedGreetings}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="mood-detection" className="flex flex-col gap-1">
                      <span>Stimmungserkennung</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Erkennt deine Stimmung und passt sich an
                      </span>
                    </Label>
                    <Switch id="mood-detection" checked={detectMood} onCheckedChange={setDetectMood} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="topic-tracking" className="flex flex-col gap-1">
                      <span>Themen-Tracking</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Merkt sich, worüber ihr gerade redet
                      </span>
                    </Label>
                    <Switch id="topic-tracking" checked={trackTopics} onCheckedChange={setTrackTopics} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Speichern
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
