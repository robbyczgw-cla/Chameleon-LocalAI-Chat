"use client"

import { useState, useEffect } from "react"
import { memoryService } from "@/lib/memory-service"
import type { Memory } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Brain, Plus, Trash2, Edit2, Search, TrendingUp, Zap, Target, Info, Download, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function MemoryManager() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<Memory["type"] | "all">("all")
  const [filterImportance, setFilterImportance] = useState<1 | 2 | 3 | "all">("all")
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMemory, setNewMemory] = useState({
    type: "fact" as Memory["type"],
    content: "",
    category: "",
    importance: 2 as 1 | 2 | 3,
  })
  const { toast } = useToast()

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = () => {
    setMemories(memoryService.getAllMemories())
  }

  const filteredMemories = memories.filter((m) => {
    // Type filter
    if (filterType !== "all" && m.type !== filterType) return false

    // Importance filter
    if (filterImportance !== "all" && m.importance !== filterImportance) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        m.content.toLowerCase().includes(query) ||
        (m.category && m.category.toLowerCase().includes(query))
      )
    }

    return true
  })

  const handleAddMemory = () => {
    if (!newMemory.content.trim()) {
      toast({
        title: "Error",
        description: "Memory content cannot be empty",
        variant: "destructive",
      })
      return
    }

    memoryService.addMemory(newMemory)
    loadMemories()
    setShowAddDialog(false)
    setNewMemory({
      type: "fact",
      content: "",
      category: "",
      importance: 2,
    })

    toast({
      title: "Memory added",
      description: "New memory has been saved",
    })
  }

  const handleUpdateMemory = () => {
    if (!editingMemory) return

    memoryService.updateMemory(editingMemory.id, {
      content: editingMemory.content,
      type: editingMemory.type,
      importance: editingMemory.importance,
      category: editingMemory.category,
    })
    loadMemories()
    setEditingMemory(null)

    toast({
      title: "Memory updated",
      description: "Changes have been saved",
    })
  }

  const handleDeleteMemory = (id: string) => {
    memoryService.deleteMemory(id)
    loadMemories()

    toast({
      title: "Memory deleted",
      description: "Memory has been removed",
    })
  }

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all memories? This cannot be undone.")) {
      memoryService.clearAllMemories()
      loadMemories()

      toast({
        title: "All memories cleared",
        description: "Memory storage has been reset",
      })
    }
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
      description: `Exported ${memories.length} memories to JSON file`,
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

        // Validate structure
        if (!data.memories || !Array.isArray(data.memories)) {
          throw new Error("Invalid file format")
        }

        let imported = 0
        let skipped = 0

        for (const memory of data.memories) {
          // Validate each memory
          if (!memory.type || !memory.content || !memory.importance) {
            skipped++
            continue
          }

          // Check for duplicates
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
          description: `Imported ${imported} memories${skipped > 0 ? `, skipped ${skipped} duplicates` : ""}`,
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Could not parse the file. Make sure it's a valid JSON export.",
          variant: "destructive",
        })
      }
    }
    input.click()
  }

  const stats = memoryService.getStats()

  const getTypeIcon = (type: Memory["type"]) => {
    switch (type) {
      case "preference":
        return <Zap className="h-3 w-3" />
      case "fact":
        return <Info className="h-3 w-3" />
      case "context":
        return <Brain className="h-3 w-3" />
      case "skill":
        return <TrendingUp className="h-3 w-3" />
      case "goal":
        return <Target className="h-3 w-3" />
    }
  }

  const getTypeColor = (type: Memory["type"]) => {
    switch (type) {
      case "preference":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "fact":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "context":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "skill":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "goal":
        return "bg-pink-500/10 text-pink-600 border-pink-500/20"
    }
  }

  const getImportanceBadge = (importance: 1 | 2 | 3) => {
    const colors = {
      1: "bg-gray-500/10 text-gray-600",
      2: "bg-yellow-500/10 text-yellow-600",
      3: "bg-red-500/10 text-red-600",
    }
    const labels = { 1: "Low", 2: "Medium", 3: "High" }

    return (
      <Badge variant="outline" className={colors[importance]}>
        {labels[importance]}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Memory System
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Long-term context across conversations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={memories.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll} className="text-destructive">
            Clear
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="rounded-lg border bg-card p-3">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-2xl font-bold text-blue-600">{stats.byType.preference}</div>
          <div className="text-xs text-muted-foreground">Preferences</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-2xl font-bold text-green-600">{stats.byType.fact}</div>
          <div className="text-xs text-muted-foreground">Facts</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-2xl font-bold text-orange-600">{stats.byType.skill}</div>
          <div className="text-xs text-muted-foreground">Skills</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-2xl font-bold text-pink-600">{stats.byType.goal}</div>
          <div className="text-xs text-muted-foreground">Goals</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="preference">Preference</SelectItem>
            <SelectItem value="fact">Fact</SelectItem>
            <SelectItem value="context">Context</SelectItem>
            <SelectItem value="skill">Skill</SelectItem>
            <SelectItem value="goal">Goal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(filterImportance)} onValueChange={(v) => setFilterImportance(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Importance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="3">High</SelectItem>
            <SelectItem value="2">Medium</SelectItem>
            <SelectItem value="1">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Memory List */}
      <ScrollArea className="h-[400px] rounded-lg border">
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold">No memories found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || filterType !== "all" || filterImportance !== "all"
                ? "Try adjusting your filters"
                : "Add memories to maintain context across conversations"}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredMemories.map((memory) => (
              <div
                key={memory.id}
                className="group rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("gap-1", getTypeColor(memory.type))}>
                        {getTypeIcon(memory.type)}
                        {memory.type}
                      </Badge>
                      {getImportanceBadge(memory.importance)}
                      {memory.category && (
                        <Badge variant="outline" className="text-xs">
                          {memory.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{memory.content}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Created: {new Date(memory.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Accessed: {memory.accessCount} times</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingMemory(memory)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteMemory(memory.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Memory Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Memory</DialogTitle>
            <DialogDescription>Create a new memory to maintain context across conversations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={newMemory.type} onValueChange={(v) => setNewMemory({ ...newMemory, type: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preference">Preference - User likes/dislikes</SelectItem>
                  <SelectItem value="fact">Fact - User information</SelectItem>
                  <SelectItem value="context">Context - Background info</SelectItem>
                  <SelectItem value="skill">Skill - User abilities</SelectItem>
                  <SelectItem value="goal">Goal - User objectives</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Content *</label>
              <Textarea
                placeholder="Describe the memory..."
                value={newMemory.content}
                onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category (optional)</label>
              <Input
                placeholder="e.g., programming, personal, work"
                value={newMemory.category}
                onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Importance</label>
              <Select
                value={String(newMemory.importance)}
                onValueChange={(v) => setNewMemory({ ...newMemory, importance: Number(v) as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low - Background info</SelectItem>
                  <SelectItem value="2">Medium - Relevant context</SelectItem>
                  <SelectItem value="3">High - Critical info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMemory}>Add Memory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Memory Dialog */}
      <Dialog open={!!editingMemory} onOpenChange={(open) => !open && setEditingMemory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
            <DialogDescription>Update the memory details</DialogDescription>
          </DialogHeader>
          {editingMemory && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={editingMemory.type}
                  onValueChange={(v) => setEditingMemory({ ...editingMemory, type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preference">Preference</SelectItem>
                    <SelectItem value="fact">Fact</SelectItem>
                    <SelectItem value="context">Context</SelectItem>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="goal">Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  value={editingMemory.content}
                  onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Input
                  value={editingMemory.category || ""}
                  onChange={(e) => setEditingMemory({ ...editingMemory, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Importance</label>
                <Select
                  value={String(editingMemory.importance)}
                  onValueChange={(v) => setEditingMemory({ ...editingMemory, importance: Number(v) as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMemory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMemory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
