"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { personaPreferencesService } from "@/lib/persona-preferences-service"
import { PERSONAS } from "@/lib/personas"
import { PersonasStorageService } from "@/lib/personas-storage"

/**
 * Component that listens for persona level-up events and shows notifications
 */
export function PersonaLevelUpNotifier() {
  const { toast } = useToast()

  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      const { personaId, newStage, oldStage, depth } = event.detail

      // Find persona name
      const allPersonas = [...PERSONAS, ...PersonasStorageService.loadCustomPersonas()]
      const persona = allPersonas.find((p) => p.id === personaId)
      const personaName = persona?.name || "Persona"
      const personaEmoji = persona?.emoji || "🎉"

      // Get stage emoji
      const stageEmoji = personaPreferencesService.getRelationshipEmoji(newStage)

      toast({
        title: `${stageEmoji} Beziehung entwickelt!`,
        description: (
          <div className="mt-2 space-y-1">
            <p className="font-semibold">{personaEmoji} {personaName}</p>
            <p className="text-sm text-muted-foreground">
              {oldStage} → <span className="font-medium text-foreground">{newStage}</span>
            </p>
            <p className="text-xs opacity-80 mt-2">
              Eure Verbindung wird immer stärker! {personaName} lernt dich besser kennen.
            </p>
          </div>
        ),
        duration: 5000,
      })
    }

    window.addEventListener("personaLevelUp" as any, handleLevelUp)

    return () => {
      window.removeEventListener("personaLevelUp" as any, handleLevelUp)
    }
  }, [toast])

  return null // This component only handles side effects
}
