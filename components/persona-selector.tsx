"use client"

import { PERSONAS, type Persona } from "@/lib/personas"
import { cn } from "@/lib/utils"

interface PersonaSelectorProps {
  selectedPersona: Persona
  onSelectPersona: (persona: Persona) => void
}

export function PersonaSelector({ selectedPersona, onSelectPersona }: PersonaSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {PERSONAS.map((persona) => (
        <button
          key={persona.id}
          onClick={() => onSelectPersona(persona)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-105",
            "border-2",
            selectedPersona.id === persona.id
              ? `border-violet-500 bg-gradient-to-br ${persona.color} bg-opacity-10 shadow-lg shadow-violet-500/20`
              : "border-transparent bg-card hover:border-violet-300 hover:bg-accent"
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all",
              selectedPersona.id === persona.id
                ? `bg-gradient-to-br ${persona.color} shadow-md`
                : "bg-muted"
            )}
          >
            {persona.emoji}
          </div>
          <div className="text-center">
            <p className="text-xs font-medium line-clamp-2">{persona.name}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
