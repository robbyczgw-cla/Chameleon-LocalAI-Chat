/**
 * Semantic Search Utilities
 * Implements cosine similarity search for finding relevant documents
 */

import type { StoredEmbedding } from "./embeddings-store"
import { getEmbeddingsByCollection, getAllEmbeddings, storeEmbeddings } from "./embeddings-store"

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length")
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

export interface SearchResult {
  embedding: StoredEmbedding
  similarity: number
}

/**
 * Generate embedding for a query using the embeddings API
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: [query],
      }),
    })

    if (!response.ok) {
      throw new Error(`Embeddings API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.embeddings[0]
  } catch (error) {
    console.error("[SemanticSearch] Failed to generate query embedding:", error)
    throw error
  }
}

/**
 * Search for similar documents using semantic search
 * @param query - Search query text
 * @param collectionId - Optional collection ID to limit search scope
 * @param limit - Maximum number of results to return (default: 10)
 * @param minSimilarity - Minimum similarity threshold (default: 0.5)
 */
export async function semanticSearch(
  query: string,
  options: {
    collectionId?: string
    limit?: number
    minSimilarity?: number
  } = {}
): Promise<SearchResult[]> {
  const { collectionId, limit = 10, minSimilarity = 0.5 } = options

  try {
    console.log(`[SemanticSearch] Searching for: "${query}"`)

    // Generate embedding for query
    const queryEmbedding = await generateQueryEmbedding(query)

    // Get all relevant embeddings
    const embeddings = collectionId
      ? await getEmbeddingsByCollection(collectionId)
      : await getAllEmbeddings()

    if (embeddings.length === 0) {
      console.log("[SemanticSearch] No embeddings found")
      return []
    }

    console.log(`[SemanticSearch] Comparing against ${embeddings.length} embeddings`)

    // Calculate similarity scores
    const results: SearchResult[] = embeddings
      .map((embedding) => ({
        embedding,
        similarity: cosineSimilarity(queryEmbedding, embedding.embedding),
      }))
      .filter((result) => result.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    console.log(`[SemanticSearch] Found ${results.length} results above threshold ${minSimilarity}`)

    return results
  } catch (error) {
    console.error("[SemanticSearch] Search failed:", error)
    throw error
  }
}

/**
 * Generate embeddings for document text
 * Automatically chunks large text if needed
 */
export async function generateDocumentEmbeddings(
  documentId: string,
  text: string,
  metadata?: {
    collectionId?: string
    documentName?: string
  }
): Promise<StoredEmbedding[]> {
  const maxChunkSize = 25000 // ~6k tokens to be safe
  const chunks: string[] = []

  // Split into chunks if text is too large
  if (text.length > maxChunkSize) {
    console.log(`[SemanticSearch] Splitting large document into chunks (${text.length} chars)`)

    // Simple chunking by character count with overlap
    const overlapSize = 500
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + maxChunkSize, text.length)
      chunks.push(text.substring(start, end))
      start = end - overlapSize
    }
  } else {
    chunks.push(text)
  }

  console.log(`[SemanticSearch] Generating embeddings for ${chunks.length} chunk(s)`)

  // Generate embeddings for all chunks
  const response = await fetch("/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: chunks,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to generate embeddings: ${response.statusText}`)
  }

  const data = await response.json()
  const embeddings: number[][] = data.embeddings

  // Create StoredEmbedding objects
  const storedEmbeddings: StoredEmbedding[] = embeddings.map((embedding, index) => ({
    id: chunks.length > 1 ? `${documentId}-chunk-${index}` : documentId,
    text: chunks[index],
    embedding,
    metadata: {
      ...metadata,
      chunkIndex: chunks.length > 1 ? index : undefined,
      createdAt: Date.now(),
    },
  }))

  // Store in IndexedDB
  await storeEmbeddings(storedEmbeddings)

  console.log(`[SemanticSearch] Successfully stored ${storedEmbeddings.length} embeddings`)

  return storedEmbeddings
}

/**
 * Check if embeddings exist for a document
 */
export async function hasEmbeddings(documentId: string): Promise<boolean> {
  const embeddings = await getAllEmbeddings()
  return embeddings.some((e) => e.id === documentId || e.id.startsWith(`${documentId}-chunk-`))
}
