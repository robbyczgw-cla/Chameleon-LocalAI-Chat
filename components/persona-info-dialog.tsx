"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Brain, Mic, Clock, Heart, TrendingUp, Calendar, MessageCircle } from "lucide-react"
import type { Persona } from "@/lib/personas"
import { personaMemoryService } from "@/lib/persona-memory-service"
import { personaPreferencesService } from "@/lib/persona-preferences-service"

interface PersonaInfoDialogProps {
  persona: Persona
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonaInfoDialog({ persona, open, onOpenChange }: PersonaInfoDialogProps) {
  const [relationshipStats, setRelationshipStats] = useState<ReturnType<
    typeof personaPreferencesService.getRelationshipStats
  > | null>(null)
  const [memoryStats, setMemoryStats] = useState<ReturnType<typeof personaMemoryService.getStats> | null>(null)
  const [preferences, setPreferences] = useState<ReturnType<typeof personaPreferencesService.getPreferences>>([])

  useEffect(() => {
    if (open) {
      setRelationshipStats(personaPreferencesService.getRelationshipStats(persona.id))
      setMemoryStats(personaMemoryService.getStats(persona.id))
      setPreferences(personaPreferencesService.getHighConfidencePreferences(persona.id))
    }
  }, [open, persona.id])

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Nie"
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Gerade eben"
    if (diffMins < 60) return `Vor ${diffMins} Minuten`
    if (diffHours < 24) return `Vor ${diffHours} Stunden`
    if (diffDays === 1) return "Gestern"
    if (diffDays < 7) return `Vor ${diffDays} Tagen`
    return date.toLocaleDateString("de-DE")
  }

  const getProgressColor = (depth: number) => {
    if (depth < 25) return "bg-blue-500"
    if (depth < 50) return "bg-green-500"
    if (depth < 75) return "bg-yellow-500"
    return "bg-purple-500"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {persona.avatarUrl ? (
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border">
                <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <span className="text-3xl">{persona.emoji}</span>
            )}
            <div>
              <div className="text-xl font-bold">{persona.name}</div>
              <div className="text-sm text-muted-foreground font-normal">{persona.description}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Relationship Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <CardTitle>Beziehung</CardTitle>
                </div>
                {relationshipStats && (
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {relationshipStats.emoji} {relationshipStats.stage}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {relationshipStats && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiefe der Beziehung</span>
                      <span className="font-medium">{Math.floor(relationshipStats.depth)}%</span>
                    </div>
                    <Progress value={relationshipStats.depth} className="h-2" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Gespräche</div>
                        <div className="font-semibold">{relationshipStats.totalInteractions}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Tage zusammen</div>
                        <div className="font-semibold">{relationshipStats.daysTogether}</div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Zuletzt gesehen</div>
                      <div className="font-medium">{formatDate(relationshipStats.lastSeen)}</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Learned Preferences Card */}
          {preferences.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <CardTitle>Gelernte Präferenzen</CardTitle>
                </div>
                <CardDescription>
                  {persona.name} hat {preferences.length} Dinge über dich gelernt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {preferences.map((pref, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize">
                          {pref.category.replace("_", " ")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.floor(pref.confidence * 100)}% sicher
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {pref.key}: <span className="text-foreground font-medium">{pref.value}</span>
                      </div>
                      {pref.examples[0] && (
                        <div className="text-xs text-muted-foreground mt-1 italic">"{pref.examples[0]}"</div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Memory Card */}
          {memoryStats && memoryStats.totalConversations > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <CardTitle>Erinnerungen</CardTitle>
                </div>
                <CardDescription>
                  {persona.name} erinnert sich an {memoryStats.totalConversations} vergangene Gespräche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gespeicherte Konversationen</span>
                    <span className="font-semibold">{memoryStats.totalConversations}</span>
                  </div>
                  {memoryStats.oldestTimestamp > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Älteste Erinnerung</span>
                      <span className="font-medium">{formatDate(memoryStats.oldestTimestamp)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Features Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aktivierte Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span>Persona Memory</span>
                </div>
                <Badge variant={persona.memorySettings?.enabled ? "default" : "secondary"}>
                  {persona.memorySettings?.enabled ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span>Persona Voice</span>
                </div>
                <Badge variant={persona.voiceSettings?.enabled ? "default" : "secondary"}>
                  {persona.voiceSettings?.enabled ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Context Awareness</span>
                </div>
                <Badge variant={persona.contextSettings?.enabled ? "default" : "secondary"}>
                  {persona.contextSettings?.enabled ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
