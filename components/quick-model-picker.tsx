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
import { Bot, ChevronDown, Check, Cpu } from "lucide-react"
import { POPULAR_OPENROUTER_MODELS } from "@/lib/openrouter"
import { getUserSelectedModels } from "@/lib/model-preferences"
import { getModelDescription, getModelCategory } from "@/lib/model-descriptions"
import { cn } from "@/lib/utils"

interface ModelOption {
  id: string
  name: string
  provider: string
  category: string
  isLocal?: boolean
}

export function QuickModelPicker() {
  const { settings, updateSettings, currentChatId, chats, updateChat } = useApp()
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(POPULAR_OPENROUTER_MODELS)
  const [lmStudioModels, setLmStudioModels] = useState<ModelOption[]>([])

  const currentChat = chats.find((c) => c.id === currentChatId)
  const currentModel = currentChat?.model || settings.selectedModel

  // Fetch LM Studio models
  const fetchLMStudioModels = async () => {
    try {
      const response = await fetch('/api/lmstudio/models')
      if (response.ok) {
        const data = await response.json()
        if (data.data && Array.isArray(data.data)) {
          const models: ModelOption[] = data.data.map((m: any) => ({
            id: m.id,
            name: m.id.replace('local/', '').split('/').pop() || m.id,
            provider: 'LM Studio',
            category: 'local',
            isLocal: true,
          }))
          setLmStudioModels(models)
          console.log('[QuickModelPicker] Loaded LM Studio models:', models.length)
        }
      }
    } catch (error) {
      console.log('[QuickModelPicker] LM Studio not available')
      setLmStudioModels([])
    }
  }

  // Load user's selected models from localStorage
  const loadModels = () => {
    const userModels = getUserSelectedModels()

    if (userModels.length > 0) {
      // Map IDs to model objects
      const modelObjects = userModels.map((id) => {
        // Try to find in POPULAR_OPENROUTER_MODELS first (has nice names)
        const popular = POPULAR_OPENROUTER_MODELS.find((m) => m.id === id)
        if (popular) return { ...popular, isLocal: false }

        // Check if it's a local model
        if (id.startsWith('local/')) {
          return {
            id,
            name: id.replace('local/', '').split('/').pop() || id,
            provider: 'LM Studio',
            category: 'local',
            isLocal: true,
          }
        }

        // Fallback to basic object
        return {
          id,
          name: id.split("/")[1] || id,
          provider: id.split("/")[0] || "Unknown",
          category: "custom",
          isLocal: false,
        }
      })

      setAvailableModels(modelObjects)
    } else {
      // Fallback to POPULAR_OPENROUTER_MODELS
      setAvailableModels(POPULAR_OPENROUTER_MODELS.map(m => ({ ...m, isLocal: false })))
    }
  }

  useEffect(() => {
    loadModels()
    fetchLMStudioModels()

    // Listen for changes
    const handleModelPreferencesChanged = () => {
      console.log("[QuickModelPicker] Model preferences changed, reloading...")
      loadModels()
    }

    window.addEventListener("modelPreferencesChanged", handleModelPreferencesChanged)

    return () => {
      window.removeEventListener("modelPreferencesChanged", handleModelPreferencesChanged)
    }
  }, [])

  const handleModelChange = (modelId: string) => {
    if (currentChatId) {
      updateChat(currentChatId, { model: modelId })
    } else {
      updateSettings({ selectedModel: modelId })
    }
  }

  const getModelDisplay = (modelId: string) => {
    if (!modelId) return "Modell wählen"
    // Check LM Studio models first
    const lmModel = lmStudioModels.find((m) => m.id === modelId)
    if (lmModel) return lmModel.name
    const model = availableModels.find((m) => m.id === modelId)
    return model?.name || modelId.split("/")[1] || modelId
  }

  // Combine LM Studio models with available models, LM Studio first
  const allModels = [...lmStudioModels, ...availableModels.filter(m => !m.isLocal)]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 md:h-8 px-2 md:px-3 rounded-md border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs"
        >
          {currentModel?.startsWith('local/') ? (
            <Cpu className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1.5 text-green-500" />
          ) : (
            <Bot className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1.5 text-primary" />
          )}
          <span className="font-medium max-w-[80px] md:max-w-[120px] truncate">
            {getModelDisplay(currentModel)}
          </span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[320px] md:w-[380px] max-h-[400px] overflow-y-auto"
      >
        {/* LM Studio Models Section */}
        {lmStudioModels.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-green-600 flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />
              LM Studio (Lokal)
            </DropdownMenuLabel>
            {lmStudioModels.map((model) => {
              const isSelected = model.id === currentModel
              return (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 py-2.5 cursor-pointer transition-colors",
                    isSelected && "bg-green-500/10"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isSelected && <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                      <span className={cn(
                        "font-medium text-sm truncate",
                        isSelected && "text-green-600"
                      )}>
                        {model.name}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-600 font-medium shrink-0">
                      Lokal
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/80 leading-tight pl-5">
                    Läuft auf deinem Mac via LM Studio
                  </span>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Cloud Models Section */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Cloud Modelle
        </DropdownMenuLabel>
        {availableModels.filter(m => !m.isLocal).slice(0, 10).map((model) => {
          const isSelected = model.id === currentModel
          const description = getModelDescription(model.id)
          const category = getModelCategory(model.id)

          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              className={cn(
                "flex flex-col items-start gap-1 py-2.5 cursor-pointer transition-colors",
                isSelected && "bg-primary/10"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  <span className={cn(
                    "font-medium text-sm truncate",
                    isSelected && "text-primary"
                  )}>
                    {model.name}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium shrink-0">
                  {category}
                </span>
              </div>
              <span className="text-xs text-muted-foreground/80 leading-tight pl-5">
                {description}
              </span>
            </DropdownMenuItem>
          )
        })}
        {availableModels.filter(m => !m.isLocal).length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-xs text-muted-foreground/60 justify-center">
              +{availableModels.filter(m => !m.isLocal).length - 10} weitere Modelle in Einstellungen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
