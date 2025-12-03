"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { documentCollectionService } from "@/lib/document-collections"
import { processFile } from "@/lib/file-handler"
import { generateDocumentEmbeddings } from "@/lib/semantic-search"
import { deleteEmbedding } from "@/lib/embeddings-store"
import { FolderOpen, Plus, Trash2, Upload, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DocumentCollection } from "@/types"

interface DocumentCollectionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCollection?: (collectionId: string) => void
}

export function DocumentCollectionsDialog({ open, onOpenChange, onSelectCollection }: DocumentCollectionsDialogProps) {
  const [collections, setCollections] = useState(documentCollectionService.getAllCollections())
  const [selectedCollection, setSelectedCollection] = useState<DocumentCollection | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollection, setNewCollection] = useState({ name: "", description: "" })

  const handleCreateCollection = () => {
    if (!newCollection.name) return
    const collection = documentCollectionService.createCollection(newCollection.name, newCollection.description)
    setCollections(documentCollectionService.getAllCollections())
    setNewCollection({ name: "", description: "" })
    setShowCreateForm(false)
    setSelectedCollection(collection)
  }

  const handleDeleteCollection = async (id: string) => {
    if (confirm("Delete this collection and all its documents?")) {
      // Delete all embeddings for this collection
      try {
        const { deleteEmbeddingsByCollection } = await import("@/lib/embeddings-store")
        await deleteEmbeddingsByCollection(id)
        console.log(`[DocumentCollections] Deleted all embeddings for collection ${id}`)
      } catch (error) {
        console.error("[DocumentCollections] Failed to delete collection embeddings:", error)
      }

      documentCollectionService.deleteCollection(id)
      setCollections(documentCollectionService.getAllCollections())
      if (selectedCollection?.id === id) {
        setSelectedCollection(null)
      }
    }
  }

  const handleAddDocument = async (collectionId: string, file: File) => {
    try {
      const processed = await processFile(file)
      const doc = documentCollectionService.addDocument(collectionId, {
        name: file.name,
        content: processed.content,
        type: file.type,
        size: file.size,
      })

      // Generate embeddings for the document automatically
      if (doc && processed.content) {
        console.log(`[DocumentCollections] Generating embeddings for ${file.name}`)
        try {
          await generateDocumentEmbeddings(doc.id, processed.content, {
            collectionId,
            documentName: file.name,
          })
          console.log(`[DocumentCollections] Embeddings generated successfully`)
        } catch (error) {
          console.error("[DocumentCollections] Failed to generate embeddings:", error)
          // Don't fail the upload if embeddings fail
        }
      }

      setCollections(documentCollectionService.getAllCollections())
      const updated = documentCollectionService.getCollection(collectionId)
      if (updated) setSelectedCollection(updated)
    } catch (error) {
      console.error("[DocumentCollections] Failed to process file:", error)
      alert("Failed to process file")
    }
  }

  const handleRemoveDocument = async (collectionId: string, documentId: string) => {
    // Delete embeddings for this document
    try {
      await deleteEmbedding(documentId)
      // Also delete chunked embeddings if they exist
      const allEmbeddings = await import("@/lib/embeddings-store").then(m => m.getAllEmbeddings())
      const chunkEmbeddings = allEmbeddings.filter(e => e.id.startsWith(`${documentId}-chunk-`))
      for (const chunk of chunkEmbeddings) {
        await deleteEmbedding(chunk.id)
      }
      console.log(`[DocumentCollections] Deleted embeddings for document ${documentId}`)
    } catch (error) {
      console.error("[DocumentCollections] Failed to delete embeddings:", error)
    }

    documentCollectionService.removeDocument(collectionId, documentId)
    setCollections(documentCollectionService.getAllCollections())
    const updated = documentCollectionService.getCollection(collectionId)
    if (updated) setSelectedCollection(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Document Collections
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {/* Collections List */}
          <div className="space-y-3 border-r border-border/50 pr-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Collections</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showCreateForm && (
              <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
                <Input
                  placeholder="Collection name"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  rows={2}
                />
                <Button size="sm" onClick={handleCreateCollection} disabled={!newCollection.name} className="w-full">
                  Create
                </Button>
              </div>
            )}

            <ScrollArea className="h-[50vh] min-h-[250px] max-h-[400px]">
              <div className="space-y-1 pr-2">
                {collections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 border-2 border-dashed rounded-lg m-2">
                    <FolderOpen className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">No collections yet</p>
                    <p className="text-xs mt-1">Click + to create one</p>
                  </div>
                ) : (
                  collections.map((collection) => (
                    <div
                      key={collection.id}
                      className={cn(
                        "group flex cursor-pointer items-center justify-between rounded-lg p-3 transition-all",
                        selectedCollection?.id === collection.id
                          ? "bg-primary/10 border border-primary/20 shadow-sm"
                          : "hover:bg-muted border border-transparent"
                      )}
                      onClick={() => setSelectedCollection(collection)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn("p-2 rounded-lg shrink-0", selectedCollection?.id === collection.id ? "bg-primary/20" : "bg-muted")}>
                          <FolderOpen className={cn("h-4 w-4", selectedCollection?.id === collection.id ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{collection.name}</div>
                          <div className="text-xs text-muted-foreground">{collection.documents.length} documents</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCollection(collection.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Documents View */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            {selectedCollection ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{selectedCollection.name}</h3>
                    {selectedCollection.description && (
                      <p className="text-sm text-muted-foreground truncate">{selectedCollection.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.multiple = true
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files
                          if (files) {
                            Array.from(files).forEach((file) => handleAddDocument(selectedCollection.id, file))
                          }
                        }
                        input.click()
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Add Documents
                    </Button>
                    {onSelectCollection && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onSelectCollection(selectedCollection.id)
                          onOpenChange(false)
                        }}
                      >
                        Use in Chat
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="h-[50vh] min-h-[250px] max-h-[400px]">
                  <div className="space-y-2 pr-2">
                    {selectedCollection.documents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 border-2 border-dashed rounded-lg m-2">
                        <FileText className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">No documents yet</p>
                        <p className="text-xs mt-1">Click "Add Documents" to upload files</p>
                      </div>
                    ) : (
                      selectedCollection.documents.map((doc) => (
                        <div key={doc.id} className="flex items-start justify-between rounded-lg border p-3 bg-card">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{doc.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.addedAt).toLocaleDateString()}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{doc.content}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleRemoveDocument(selectedCollection.id, doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col h-[400px] items-center justify-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">Select a collection</p>
                <p className="text-xs mt-1">to view documents</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
