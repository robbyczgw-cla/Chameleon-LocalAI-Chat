import type { DocumentCollection, CollectionDocument } from "@/types"

export class DocumentCollectionService {
  private collections: DocumentCollection[] = []

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("documentCollections")
      if (saved) {
        this.collections = JSON.parse(saved)
      }
    }
  }

  createCollection(name: string, description: string): DocumentCollection {
    const collection: DocumentCollection = {
      id: `collection-${Date.now()}`,
      name,
      description,
      documents: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.collections.push(collection)
    this.save()
    return collection
  }

  addDocument(collectionId: string, document: Omit<CollectionDocument, "id" | "addedAt">): CollectionDocument {
    const collection = this.collections.find((c) => c.id === collectionId)
    if (!collection) throw new Error("Collection not found")

    const doc: CollectionDocument = {
      ...document,
      id: `doc-${Date.now()}`,
      addedAt: Date.now(),
    }

    collection.documents.push(doc)
    collection.updatedAt = Date.now()
    this.save()
    return doc
  }

  removeDocument(collectionId: string, documentId: string): void {
    const collection = this.collections.find((c) => c.id === collectionId)
    if (!collection) return

    collection.documents = collection.documents.filter((d) => d.id !== documentId)
    collection.updatedAt = Date.now()
    this.save()
  }

  deleteCollection(collectionId: string): void {
    this.collections = this.collections.filter((c) => c.id !== collectionId)
    this.save()
  }

  getCollection(collectionId: string): DocumentCollection | undefined {
    return this.collections.find((c) => c.id === collectionId)
  }

  getAllCollections(): DocumentCollection[] {
    return this.collections
  }

  searchInCollection(collectionId: string, query: string): CollectionDocument[] {
    const collection = this.getCollection(collectionId)
    if (!collection) return []

    const lowerQuery = query.toLowerCase()
    return collection.documents.filter(
      (doc) => doc.name.toLowerCase().includes(lowerQuery) || doc.content.toLowerCase().includes(lowerQuery),
    )
  }

  getCollectionContext(collectionId: string, query: string, maxChars = 4000): string {
    const results = this.searchInCollection(collectionId, query)
    let context = ""
    let charCount = 0

    for (const doc of results) {
      const docContext = `\n\n--- ${doc.name} ---\n${doc.content}\n`
      if (charCount + docContext.length > maxChars) break
      context += docContext
      charCount += docContext.length
    }

    return context
  }

  private save(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("documentCollections", JSON.stringify(this.collections))
    }
  }
}

export const documentCollectionService = new DocumentCollectionService()
