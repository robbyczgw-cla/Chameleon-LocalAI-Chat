"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Brain,
  Sparkles,
  Target,
  User,
  Lightbulb,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Info,
  Download,
  Upload,
  Shield,
  Cloud,
  AlertTriangle,
} from "lucide-react"
import { memoryService } from "@/lib/memory-service"
import type { Memory } from "@/types"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"

export function AIMemoryHub() {
  const { settings, updateSettings } = useApp()
  const currentLanguage = settings.language || "en"
  const { t, translations } = useTranslation(currentLanguage)
  const { toast } = useToast()
  const [memories, setMemories] = useState<Memory[]>([])
  const [isEnabled, setIsEnabled] = useState(settings.memorySettings?.enabled ?? false)
  const [syncToDatabase, setSyncToDatabase] = useState(settings.memorySettings?.syncToDatabase ?? false)
  const [activeTab, setActiveTab] = useState<Memory["type"]>("preference")
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newMemory, setNewMemory] = useState({
    type: "preference" as Memory["type"],
    content: "",
    importance: 2 as 1 | 2 | 3,
    category: "",
  })
  const [stats, setStats] = useState(memoryService.getStats())

  useEffect(() => {
    loadMemories()
  }, [])

  // Sync local state with settings changes (fixes persistence bug)
  useEffect(() => {
    setIsEnabled(settings.memorySettings?.enabled ?? false)
    setSyncToDatabase(settings.memorySettings?.syncToDatabase ?? false)
  }, [settings.memorySettings?.enabled, settings.memorySettings?.syncToDatabase])

  const loadMemories = () => {
    const allMemories = memoryService.getAllMemories()
    setMemories(allMemories)
    setStats(memoryService.getStats())
  }

  const toggleMemorySystem = (enabled: boolean) => {
    console.log("[AIMemoryHub] Toggle clicked:", {
      newValue: enabled,
      currentSettings: settings.memorySettings
    })
    setIsEnabled(enabled)

    const newMemorySettings = {
      ...settings.memorySettings,
      enabled,
    }
    console.log("[AIMemoryHub] Calling updateSettings with:", newMemorySettings)

    // CRITICAL: Preserve existing memorySettings, only update enabled flag
    updateSettings({
      memorySettings: newMemorySettings,
    })
  }

  const toggleDatabaseSync = (enabled: boolean) => {
    console.log("[AIMemoryHub] Database sync toggled:", enabled)
    setSyncToDatabase(enabled)

    updateSettings({
      memorySettings: {
        ...settings.memorySettings,
        syncToDatabase: enabled,
      },
    })

    if (enabled) {
      toast({
        title: "Database Sync Enabled",
        description: "Memories will be saved to local SQLite database.",
        duration: 3000,
      })
    } else {
      toast({
        title: "Database Sync Disabled",
        description: "Memories stored in browser only.",
        duration: 3000,
      })
    }
  }

  const addMemory = () => {
    if (!newMemory.content.trim()) {
      alert(translations.memory.content)
      return
    }

    memoryService.addMemory({
      type: newMemory.type,
      content: newMemory.content,
      importance: newMemory.importance,
      category: newMemory.category || undefined,
    })

    setNewMemory({
      type: "preference",
      content: "",
      importance: 2,
      category: "",
    })
    setIsAddingNew(false)
    loadMemories()
  }

  const deleteMemory = (id: string) => {
    if (confirm(translations.memory.deleteConfirm)) {
      memoryService.deleteMemory(id)
      loadMemories()
    }
  }

  const updateMemoryImportance = (id: string, importance: 1 | 2 | 3) => {
    memoryService.updateMemory(id, { importance })
    loadMemories()
  }

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      memories: memories,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chameleon-memories-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Memories exported",
      description: `Exported ${memories.length} memories`,
      duration: 2000,
    })
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (!data.memories || !Array.isArray(data.memories)) {
          throw new Error("Invalid file format")
        }

        let imported = 0
        let skipped = 0

        for (const memory of data.memories) {
          if (!memory.type || !memory.content || memory.importance === undefined) {
            skipped++
            continue
          }

          const existingContent = memories.map(m => m.content.toLowerCase())
          if (existingContent.includes(memory.content.toLowerCase())) {
            skipped++
            continue
          }

          memoryService.addMemory({
            type: memory.type,
            content: memory.content,
            importance: memory.importance,
            category: memory.category,
          })
          imported++
        }

        loadMemories()

        toast({
          title: "Import complete",
          description: `Imported ${imported} memories${skipped > 0 ? `, skipped ${skipped}` : ""}`,
          duration: 2000,
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid JSON file",
          variant: "destructive",
          duration: 2000,
        })
      }
    }
    input.click()
  }

  const getTypeIcon = (type: Memory["type"]) => {
    switch (type) {
      case "preference":
        return <User className="h-4 w-4" />
      case "fact":
        return <Lightbulb className="h-4 w-4" />
      case "context":
        return <Sparkles className="h-4 w-4" />
      case "skill":
        return <TrendingUp className="h-4 w-4" />
      case "goal":
        return <Target className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: Memory["type"]) => {
    const labels = {
      preference: translations.memory.preferences,
      fact: translations.memory.facts,
      context: translations.memory.context,
      skill: translations.memory.skills,
      goal: translations.memory.goals,
    }
    return labels[type]
  }

  const getImportanceColor = (importance: 1 | 2 | 3) => {
    if (importance === 3) return "bg-red-500"
    if (importance === 2) return "bg-yellow-500"
    return "bg-green-500"
  }

  const filteredMemories = memories.filter((m) => m.type === activeTab)

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{translations.memory.title}</h3>
            <p className="text-xs text-muted-foreground">
              {translations.memory.subtitle}
            </p>
          </div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={toggleMemorySystem} />
      </div>

      {/* Privacy Setting - Local Database Sync Toggle */}
      {isEnabled && (
        <div className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-10 w-10 rounded-lg shadow-lg flex items-center justify-center",
                syncToDatabase
                  ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                  : "bg-gradient-to-br from-green-500 to-emerald-500"
              )}>
                {syncToDatabase ? (
                  <Cloud className="h-5 w-5 text-white" />
                ) : (
                  <Shield className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {syncToDatabase ? "Local Database Sync" : "Browser Storage Only"}
                  {syncToDatabase && (
                    <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-600">
                      Persistent
                    </Badge>
                  )}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {syncToDatabase
                    ? "Memories saved to local SQLite database. Private and persistent."
                    : "Memories stored in browser only. May be lost if browser data is cleared."
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={syncToDatabase}
              onCheckedChange={toggleDatabaseSync}
            />
          </div>
        </div>
      )}

      {!isEnabled && (
        <Card className="p-6 text-center bg-muted/30 border-dashed">
          <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">
            {translations.memory.disabled}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {translations.memory.disabledDescription}
          </p>
          <Button onClick={() => toggleMemorySystem(true)} size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            {translations.memory.enableButton}
          </Button>
        </Card>
      )}

      {isEnabled && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-500">{stats.total}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.total}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.preference}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.preferences}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.fact}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.facts}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.skill}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.skills}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.goal}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.goals}</div>
            </Card>
          </div>

          {/* Import/Export Buttons */}
          <div className="flex gap-2 justify-end">
            <Button onClick={handleExport} size="sm" variant="outline" disabled={memories.length === 0}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button onClick={handleImport} size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-1.5" />
              Import
            </Button>
          </div>

          {/* Info Card */}
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-500/30">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <p>
                  <strong>{translations.memory.howItWorks}</strong>
                </p>
                <p className="whitespace-pre-line">{translations.memory.howItWorksDescription}</p>
              </div>
            </div>
          </Card>

          {/* Memory Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Memory["type"])}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="preference" className="text-xs">
                {getTypeIcon("preference")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.preferences}</span>
              </TabsTrigger>
              <TabsTrigger value="fact" className="text-xs">
                {getTypeIcon("fact")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.facts}</span>
              </TabsTrigger>
              <TabsTrigger value="context" className="text-xs">
                {getTypeIcon("context")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.context}</span>
              </TabsTrigger>
              <TabsTrigger value="skill" className="text-xs">
                {getTypeIcon("skill")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.skills}</span>
              </TabsTrigger>
              <TabsTrigger value="goal" className="text-xs">
                {getTypeIcon("goal")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.goals}</span>
              </TabsTrigger>
            </TabsList>

            {/* Add New Memory Button */}
            <div className="mt-3">
              {!isAddingNew ? (
                <Button onClick={() => setIsAddingNew(true)} size="sm" variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {translations.memory.addNew} {getTypeLabel(activeTab)}
                </Button>
              ) : (
                <Card className="p-4 space-y-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="space-y-2">
                    <Label className="text-sm">{translations.memory.content}</Label>
                    <Input
                      value={newMemory.content}
                      onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                      placeholder={translations.memory.contentPlaceholder}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm">{translations.memory.category}</Label>
                      <Input
                        value={newMemory.category}
                        onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                        placeholder={translations.memory.categoryPlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">{translations.memory.importance}</Label>
                      <select
                        value={newMemory.importance}
                        onChange={(e) => setNewMemory({ ...newMemory, importance: parseInt(e.target.value) as 1 | 2 | 3 })}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value={1}>{translations.memory.importanceLow}</option>
                        <option value={2}>{translations.memory.importanceMedium}</option>
                        <option value={3}>{translations.memory.importanceHigh}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addMemory} size="sm" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {translations.memory.saveMemory}
                    </Button>
                    <Button onClick={() => setIsAddingNew(false)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Memory List */}
            <TabsContent value={activeTab} className="mt-4">
              {filteredMemories.length === 0 ? (
                <Card className="p-6 text-center bg-muted/30 border-dashed">
                  <div className="flex justify-center mb-3">
                    {getTypeIcon(activeTab)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {translations.memory.noMemories}
                  </p>
                </Card>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {filteredMemories.map((memory) => (
                      <Card key={memory.id} className="p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                {getTypeIcon(memory.type)}
                                <span className="text-xs font-medium">{getTypeLabel(memory.type)}</span>
                              </div>
                              {memory.category && (
                                <Badge variant="outline" className="text-xs">
                                  {memory.category}
                                </Badge>
                              )}
                              <div className="flex gap-1">
                                {[1, 2, 3].map((level) => (
                                  <button
                                    key={level}
                                    onClick={() => updateMemoryImportance(memory.id, level as 1 | 2 | 3)}
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full transition-all",
                                      level <= memory.importance ? getImportanceColor(memory.importance) : "bg-muted"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm">{memory.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>
                                {new Date(memory.createdAt).toLocaleDateString(currentLanguage === "de" ? "de-DE" : "en-US")}
                              </span>
                              <span>• {memory.accessCount} {translations.memory.usedTimes}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMemory(memory.id)}
                            className="h-8 w-8 p-0 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
