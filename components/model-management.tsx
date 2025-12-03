"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Plus, Lock, Sparkles, Search } from "lucide-react"
import { POPULAR_OPENROUTER_MODELS } from "@/lib/openrouter"
import type { OpenRouterModel } from "@/lib/openrouter"
import {
  getUserSelectedModels,
  addModelToSelection,
  removeModelFromSelection,
  getDefaultModelId,
  getMaxModelsLimit,
  resetModelSelection,
} from "@/lib/model-preferences"
import { fetchAvailableModels } from "@/lib/openrouter"

export function ModelManagement() {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [allModels, setAllModels] = useState<OpenRouterModel[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [modelsToAdd, setModelsToAdd] = useState<string[]>([])

  const defaultModelId = getDefaultModelId()
  const maxModels = getMaxModelsLimit()

  // Load selected models on mount and when preferences change
  useEffect(() => {
    loadSelectedModels()

    const handlePrefsChanged = () => {
      console.log("[ModelManagement] Preferences changed, reloading...")
      loadSelectedModels()
    }

    window.addEventListener("modelPreferencesChanged", handlePrefsChanged)

    return () => {
      window.removeEventListener("modelPreferencesChanged", handlePrefsChanged)
    }
  }, [])

  const loadSelectedModels = () => {
    const models = getUserSelectedModels()
    setSelectedModels(models)
  }

  // Load all available models when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      loadAllModels()
    }
  }, [isAddDialogOpen])

  const loadAllModels = async () => {
    setLoading(true)
    try {
      const models = await fetchAvailableModels()
      // Sort by created date (newest first) - assuming models have a 'created' timestamp
      const sorted = models.sort((a: any, b: any) => {
        // If no created field, use id as fallback (newer models often have newer IDs)
        const aTime = a.created || 0
        const bTime = b.created || 0
        return bTime - aTime
      })
      setAllModels(sorted)
    } catch (error) {
      console.error("[ModelManagement] Failed to load models:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveModel = (modelId: string) => {
    if (modelId === defaultModelId) return // Cannot remove default

    removeModelFromSelection(modelId)
    // The event listener will handle the reload automatically
  }

  const handleAddModel = (modelId: string) => {
    if (selectedModels.length >= maxModels) {
      alert(`Maximum ${maxModels} models erreicht!`)
      return
    }

    const success = addModelToSelection(modelId)
    if (success) {
      setIsAddDialogOpen(false)
      setSearchQuery("")
      setModelsToAdd([])
      // The event listener will handle the reload automatically
    }
  }

  const toggleModelToAdd = (modelId: string) => {
    setModelsToAdd((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId)
      } else {
        // Check if adding this would exceed the limit
        const potentialTotal = selectedModels.length + prev.length + 1
        if (potentialTotal > maxModels) {
          alert(`Maximum ${maxModels} Modelle erreicht!`)
          return prev
        }
        return [...prev, modelId]
      }
    })
  }

  const handleAddSelectedModels = () => {
    if (modelsToAdd.length === 0) return

    const remainingSlots = maxModels - selectedModels.length
    if (modelsToAdd.length > remainingSlots) {
      alert(`Nur noch ${remainingSlots} Plätze verfügbar!`)
      return
    }

    // Add all selected models
    modelsToAdd.forEach((modelId) => {
      addModelToSelection(modelId)
    })

    setIsAddDialogOpen(false)
    setSearchQuery("")
    setModelsToAdd([])
    // The event listener will handle the reload automatically
  }

  const handleResetToDefault = () => {
    if (confirm("Zurücksetzen auf Standard-Modelle?")) {
      resetModelSelection()
      // The event listener will handle the reload automatically
    }
  }

  // Get model display info
  const getModelInfo = (modelId: string) => {
    // Try to find in POPULAR_OPENROUTER_MODELS first (has nice names)
    const popular = POPULAR_OPENROUTER_MODELS.find((m) => m.id === modelId)
    if (popular) return popular

    // Try to find in allModels
    const full = allModels.find((m) => m.id === modelId)
    if (full) {
      return {
        id: full.id,
        name: full.id.split("/")[1] || full.id,
        provider: full.id.split("/")[0] || "Unknown",
        category: "custom",
      }
    }

    // Fallback
    return {
      id: modelId,
      name: modelId,
      provider: "Unknown",
      category: "custom",
    }
  }

  // Filter models by search query
  const filteredModels = allModels.filter((model) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      model.id.toLowerCase().includes(query) ||
      (model.name && model.name.toLowerCase().includes(query))
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Model Management</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Verwalte deine verfügbaren Modelle ({selectedModels.length}/{maxModels})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetToDefault} className="flex-1 sm:flex-none">
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={selectedModels.length >= maxModels}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" />
            <span>Add Model</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] rounded-lg border p-4">
        <div className="space-y-2">
          {selectedModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Sparkles className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Keine Modelle ausgewählt</p>
              <p className="text-xs">Klicke auf "Add Model" um zu starten</p>
            </div>
          ) : (
            selectedModels.map((modelId) => {
              const model = getModelInfo(modelId)
              const isDefault = modelId === defaultModelId

              return (
                <div
                  key={modelId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isDefault && <Lock className="h-4 w-4 text-primary flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.provider}</div>
                    </div>
                  </div>
                  {!isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleRemoveModel(modelId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Add Models Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          setModelsToAdd([])
          setSearchQuery("")
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-2xl h-[85vh] flex flex-col bg-background">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add Models ({modelsToAdd.length} selected)</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Wähle mehrere Modelle aus und füge sie alle auf einmal hinzu ({selectedModels.length}/{maxModels})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche... (z.B. Gemini, Claude)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm h-9"
              />
            </div>

            {/* Models List */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-background">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-muted-foreground">Loading models...</div>
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Keine Modelle gefunden</p>
                  <p className="text-xs">Versuche einen anderen Suchbegriff</p>
                </div>
              ) : (
                <div className="p-2 sm:p-4 space-y-2">
                  {filteredModels.map((model) => {
                    const isAlreadySelected = selectedModels.includes(model.id)
                    const isInSelectionList = modelsToAdd.includes(model.id)
                    const remainingSlots = maxModels - selectedModels.length
                    const cannotAddMore = remainingSlots <= modelsToAdd.length && !isInSelectionList

                    return (
                      <div
                        key={model.id}
                        className={`flex items-center gap-3 p-2 sm:p-3 rounded-lg border transition-all ${
                          isInSelectionList
                            ? "bg-primary/10 border-primary/40"
                            : isAlreadySelected
                            ? "bg-muted/50 opacity-60"
                            : "bg-card hover:bg-accent/50"
                        }`}
                      >
                        <Checkbox
                          checked={isInSelectionList}
                          onCheckedChange={() => toggleModelToAdd(model.id)}
                          disabled={isAlreadySelected || cannotAddMore}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{model.id}</div>
                          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
                            <span>
                              {model.context_length ? `${(model.context_length / 1000).toFixed(0)}K context` : ""}
                            </span>
                            {model.pricing && (
                              <span className="text-xs">
                                ${model.pricing.prompt}/${model.pricing.completion}
                              </span>
                            )}
                          </div>
                          {isAlreadySelected && (
                            <span className="text-xs text-muted-foreground italic">Already added</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="text-xs text-muted-foreground">
                {modelsToAdd.length > 0 && (
                  <span className="font-medium">
                    {modelsToAdd.length} Modell{modelsToAdd.length !== 1 ? "e" : ""} ausgewählt
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setModelsToAdd([])
                    setSearchQuery("")
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleAddSelectedModels}
                  disabled={modelsToAdd.length === 0}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {modelsToAdd.length > 0 ? `${modelsToAdd.length} hinzufügen` : "Auswählen"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
