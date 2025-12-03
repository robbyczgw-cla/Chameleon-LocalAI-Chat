"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, ChevronDown, Check } from "lucide-react"
import { PERSONAS, type Persona } from "@/lib/personas"
import { PersonasStorageService } from "@/lib/personas-storage"
import { cn } from "@/lib/utils"
import { getPersonaDescription } from "@/lib/languages"

export function QuickPersonaPicker() {
  const { settings, updateSettings } = useApp()
  const [allPersonas, setAllPersonas] = useState<Persona[]>([])
  const currentPersona = settings.selectedPersona

  // Load personas (built-in + custom)
  const loadPersonas = () => {
    const customPersonas = PersonasStorageService.loadCustomPersonas()
    setAllPersonas([...PERSONAS, ...customPersonas])
  }

  useEffect(() => {
    loadPersonas()

    // Listen for persona changes
    const handlePersonasChanged = () => {
      console.log("[QuickPersonaPicker] Personas changed, reloading...")
      loadPersonas()
    }

    window.addEventListener("personasChanged", handlePersonasChanged)

    return () => {
      window.removeEventListener("personasChanged", handlePersonasChanged)
    }
  }, [])

  const handlePersonaChange = (persona: Persona) => {
    updateSettings({ selectedPersona: persona })
  }

  const handleClearPersona = () => {
    updateSettings({ selectedPersona: undefined })
  }

  const getPersonaDisplay = () => {
    if (!currentPersona) return "Standard"
    return currentPersona.name
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 md:h-8 px-2 md:px-3 rounded-md border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs"
        >
          {currentPersona?.emoji ? (
            <span className="text-sm mr-1.5">{currentPersona.emoji}</span>
          ) : (
            <User className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1.5 text-primary" />
          )}
          <span className="font-medium max-w-[80px] md:max-w-[120px] truncate">
            {getPersonaDisplay()}
          </span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[320px] md:w-[380px] max-h-[400px] overflow-y-auto"
      >
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Select Persona
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Default / No Persona option */}
        <DropdownMenuItem
          onClick={handleClearPersona}
          className={cn(
            "flex items-center gap-2 py-2.5 cursor-pointer transition-colors",
            !currentPersona && "bg-primary/10"
          )}
        >
          {!currentPersona && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          <User className="h-4 w-4 opacity-60" />
          <span className={cn(
            "font-medium text-sm",
            !currentPersona && "text-primary"
          )}>
            Standard (no persona)
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* All personas */}
        {allPersonas.map((persona) => {
          const isSelected = currentPersona?.id === persona.id

          return (
            <DropdownMenuItem
              key={persona.id}
              onClick={() => handlePersonaChange(persona)}
              className={cn(
                "flex flex-col items-start gap-1 py-2.5 cursor-pointer transition-colors",
                isSelected && "bg-primary/10"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  {persona.avatarUrl ? (
                    <div className="h-6 w-6 rounded-full overflow-hidden border border-border shrink-0">
                      <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <span className="text-base shrink-0">{persona.emoji}</span>
                  )}
                  <span className={cn(
                    "font-medium text-sm truncate",
                    isSelected && "text-primary"
                  )}>
                    {persona.name}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground/80 leading-tight pl-5">
                {getPersonaDescription(persona.id, settings.language)}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
