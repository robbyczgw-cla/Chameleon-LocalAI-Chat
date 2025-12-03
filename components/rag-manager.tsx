"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, Save, X } from "lucide-react"
import { generateUUID } from "@/lib/utils"
import type { RAGDocument } from "@/lib/rag-service"
import {
  getAllDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  saveKnowledgeBase,
  loadKnowledgeBase,
} from "@/lib/rag-service"

export function RAGManager() {
  const [documents, setDocuments] = useState<RAGDocument[]>([])
  const [editingDoc, setEditingDoc] = useState<RAGDocument | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Load documents on mount
  useEffect(() => {
    loadKnowledgeBase()
    setDocuments(getAllDocuments())
  }, [])

  const handleSave = (doc: RAGDocument) => {
    if (isAdding) {
      addDocument(doc)
    } else if (editingDoc) {
      updateDocument(doc.id, doc)
    }
    saveKnowledgeBase()
    setDocuments(getAllDocuments())
    setEditingDoc(null)
    setIsAdding(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Dokument wirklich löschen?")) {
      deleteDocument(id)
      saveKnowledgeBase()
      setDocuments(getAllDocuments())
    }
  }

  const handleCancel = () => {
    setEditingDoc(null)
    setIsAdding(false)
  }

  const startAdding = () => {
    setEditingDoc({
      id: generateUUID(),
      title: "",
      content: "",
      category: "product",
      keywords: [],
      priority: 5,
    })
    setIsAdding(true)
  }

  const startEditing = (doc: RAGDocument) => {
    setEditingDoc({ ...doc })
    setIsAdding(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">RAG Wissensdatenbank</h3>
          <p className="text-sm text-muted-foreground">
            {documents.length} Dokumente • Interne Produktinformationen
          </p>
        </div>
        {!isAdding && !editingDoc && (
          <Button onClick={startAdding} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Dokument hinzufügen
          </Button>
        )}
      </div>

      {/* Edit/Add Form */}
      {(editingDoc || isAdding) && (
        <DocumentForm
          document={editingDoc!}
          onSave={handleSave}
          onCancel={handleCancel}
          isAdding={isAdding}
        />
      )}

      {/* Document List */}
      {!isAdding && !editingDoc && (
        <div className="space-y-2">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Keine Dokumente vorhanden.</p>
              <p className="text-sm mt-2">Füge Produkte, Marken oder technisches Wissen hinzu.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{doc.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        {doc.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted shrink-0">
                        Priorität: {doc.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {doc.content.substring(0, 150)}...
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {doc.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(doc)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface DocumentFormProps {
  document: RAGDocument
  onSave: (doc: RAGDocument) => void
  onCancel: () => void
  isAdding: boolean
}

function DocumentForm({ document, onSave, onCancel, isAdding }: DocumentFormProps) {
  const [formData, setFormData] = useState<RAGDocument>(document)
  const [keywordsInput, setKeywordsInput] = useState(document.keywords.join(", "))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const keywords = keywordsInput
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0)

    onSave({
      ...formData,
      keywords,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">
          {isAdding ? "Neues Dokument" : "Dokument bearbeiten"}
        </h4>
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="title">Titel*</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="z.B. Linn Majik DSM/4"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="category">Kategorie*</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
            >
              <option value="product">Produkt</option>
              <option value="brand">Marke</option>
              <option value="technical">Technisch</option>
              <option value="general">Allgemein</option>
            </select>
          </div>

          <div>
            <Label htmlFor="priority">Priorität (1-10)*</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="keywords">Keywords (kommagetrennt)*</Label>
          <Input
            id="keywords"
            value={keywordsInput}
            onChange={(e) => setKeywordsInput(e.target.value)}
            placeholder="linn, majik, dsm, streamer, verstärker"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Wichtige Suchbegriffe, nach denen das Dokument gefunden werden soll
          </p>
        </div>

        <div>
          <Label htmlFor="content">Inhalt*</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={12}
            placeholder={`Beispiel:
Linn Majik DSM/4 - Premium Network Music Player

TECHNISCHE DATEN:
- Leistung: 100W @ 4Ω, 75W @ 8Ω pro Kanal
- D/A-Wandler: 32-bit Katalyst DAC Architecture
- Streaming: AirPlay 2, Chromecast, Spotify Connect
- Anschlüsse: HDMI eARC, 3x optisch, 2x koaxial
...

VERFÜGBARKEIT: Verfügbar
PREIS: €X.XXX
QUELLE: linn.co.uk`}
            required
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Technische Details, Verfügbarkeit, Preise - alles was die AI wissen soll
          </p>
        </div>
      </div>
    </form>
  )
}
