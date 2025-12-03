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
import { ChevronDown, Sparkles, Server } from "lucide-react"
import { POPULAR_OPENROUTER_MODELS } from "@/lib/openrouter"
import { getUserSelectedModels, hasCustomModelSelection } from "@/lib/model-preferences"
import { getLMStudioModelsForSelector } from "@/lib/lmstudio"

export function ModelSelector() {
  const { settings, updateSettings, currentChatId, chats, updateChat } = useApp()
  const [availableModels, setAvailableModels] = useState(POPULAR_OPENROUTER_MODELS)
  const [localModels, setLocalModels] = useState<Array<{ id: string; name: string; provider: string; category: string }>>([])

  const currentChat = chats.find((c) => c.id === currentChatId)
  const currentModel = currentChat?.model || settings.selectedModel

  // Load user's selected models from localStorage
  const loadModels = () => {
    const userModels = getUserSelectedModels()

    if (userModels.length > 0) {
      // Map IDs to model objects
      const modelObjects = userModels.map((id) => {
        // Try to find in POPULAR_OPENROUTER_MODELS first (has nice names)
        const popular = POPULAR_OPENROUTER_MODELS.find((m) => m.id === id)
        if (popular) return popular

        // Fallback to basic object
        return {
          id,
          name: id.split("/")[1] || id,
          provider: id.split("/")[0] || "Unknown",
          category: "custom",
        }
      })

      setAvailableModels(modelObjects)
    } else {
      // Fallback to POPULAR_OPENROUTER_MODELS
      setAvailableModels(POPULAR_OPENROUTER_MODELS)
    }

    // Load LM Studio local models
    const lmModels = getLMStudioModelsForSelector(settings.lmStudio)
    setLocalModels(lmModels)
  }

  useEffect(() => {
    loadModels()

    // Listen for changes
    const handleModelPreferencesChanged = () => {
      console.log("[ModelSelector] Model preferences changed, reloading...")
      loadModels()
    }

    window.addEventListener("modelPreferencesChanged", handleModelPreferencesChanged)

    return () => {
      window.removeEventListener("modelPreferencesChanged", handleModelPreferencesChanged)
    }
  }, [settings.lmStudio]) // Re-load when LM Studio settings change

  const handleModelChange = (modelId: string) => {
    if (currentChatId) {
      updateChat(currentChatId, { model: modelId })
    } else {
      updateSettings({ selectedModel: modelId })
    }
  }

  const getModelDisplay = (modelId: string) => {
    if (!modelId) return "Unknown Model"
    // Check local models first
    const localModel = localModels.find((m) => m.id === modelId)
    if (localModel) return localModel.name
    // Then check cloud models
    const model = availableModels.find((m) => m.id === modelId)
    return model?.name || modelId
  }

  const isLocalModel = (modelId: string) => modelId?.startsWith("local/")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          {isLocalModel(currentModel) ? (
            <Server className="h-4 w-4 text-green-600" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="max-w-[150px] truncate">{getModelDisplay(currentModel)}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] max-h-[500px] overflow-y-auto">
        {/* Local Models Section */}
        {localModels.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Local Models</span>
              <Server className="h-4 w-4 text-green-600" />
            </DropdownMenuLabel>
            {localModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleModelChange(model.id)}
                className={currentModel === model.id ? "bg-accent" : ""}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium">{model.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4">LM Studio • Free</div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Cloud Models Section */}
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Cloud Models</span>
          <Sparkles className="h-4 w-4" />
        </DropdownMenuLabel>
        {availableModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleModelChange(model.id)}
            className={currentModel === model.id ? "bg-accent" : ""}
          >
            <div className="flex flex-col gap-1">
              <div className="font-medium">{model.name}</div>
              <div className="text-xs text-muted-foreground">{model.provider}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
