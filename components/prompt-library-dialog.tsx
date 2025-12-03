"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { promptTemplateService } from "@/lib/prompt-templates"
import { Search, Plus, Trash2 } from "lucide-react"
import type { PromptTemplate } from "@/types"

interface PromptLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (content: string) => void
}

export function PromptLibraryDialog({ open, onOpenChange, onSelectTemplate }: PromptLibraryDialogProps) {
  const [templates, setTemplates] = useState(promptTemplateService.getAll())
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "Custom",
    content: "",
  })

  const categories = ["all", ...promptTemplateService.getCategories()]
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleUseTemplate = (template: PromptTemplate) => {
    if (template.variables && template.variables.length > 0) {
      // Show variable input form
      const variables: Record<string, string> = {}
      for (const variable of template.variables) {
        const value = prompt(`Enter value for {{${variable}}}:`)
        if (value === null) return // User cancelled
        variables[variable] = value
      }
      const filled = promptTemplateService.fillTemplate(template.id, variables)
      onSelectTemplate(filled)
    } else {
      onSelectTemplate(template.content)
    }
    onOpenChange(false)
  }

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return
    promptTemplateService.create(newTemplate)
    setTemplates(promptTemplateService.getAll())
    setNewTemplate({ name: "", description: "", category: "Custom", content: "" })
    setShowCreateForm(false)
  }

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Delete this template?")) {
      promptTemplateService.delete(id)
      setTemplates(promptTemplateService.getAll())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Prompt Library</DialogTitle>
        </DialogHeader>

        <Tabs value={showCreateForm ? "create" : "browse"} onValueChange={(v) => setShowCreateForm(v === "create")}>
          <TabsList>
            <TabsTrigger value="browse">Browse Templates</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border bg-background px-3 py-2"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs">{template.category}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                        {template.variables && template.variables.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {template.variables.map((v) => (
                              <span key={v} className="rounded bg-primary/10 px-2 py-0.5 text-xs">
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUseTemplate(template)}>
                          Use
                        </Button>
                        {template.id && !template.id.startsWith("template-") && (
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Template name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="What does this template do?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  placeholder="Category"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Template content... Use {{variable}} for variables"
                  rows={10}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use {`{{variable}}`} syntax for variables that will be filled in when using the template
                </p>
              </div>
              <Button onClick={handleCreateTemplate} disabled={!newTemplate.name || !newTemplate.content}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
