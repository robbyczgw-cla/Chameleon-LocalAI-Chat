/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * This service provides a knowledge base that can be retrieved and added to the context
 * for more accurate and contextual responses.
 */

export interface RAGDocument {
  id: string
  title: string
  content: string
  category: "brand" | "product" | "technical" | "general"
  keywords: string[]
  priority: number // Higher priority docs are ranked first
}

// Knowledge Base - Managed via RAG Management UI
let KNOWLEDGE_BASE: RAGDocument[] = []

/**
 * Get all documents from knowledge base
 */
export function getAllDocuments(): RAGDocument[] {
  return [...KNOWLEDGE_BASE]
}

/**
 * Add a document to knowledge base
 */
export function addDocument(doc: RAGDocument): void {
  KNOWLEDGE_BASE.push(doc)
}

/**
 * Update a document in knowledge base
 */
export function updateDocument(id: string, updates: Partial<RAGDocument>): void {
  const index = KNOWLEDGE_BASE.findIndex(doc => doc.id === id)
  if (index !== -1) {
    KNOWLEDGE_BASE[index] = { ...KNOWLEDGE_BASE[index], ...updates }
  }
}

/**
 * Delete a document from knowledge base
 */
export function deleteDocument(id: string): void {
  KNOWLEDGE_BASE = KNOWLEDGE_BASE.filter(doc => doc.id !== id)
}

/**
 * Load knowledge base from localStorage
 */
export function loadKnowledgeBase(): void {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('rag_knowledge_base')
      if (stored) {
        KNOWLEDGE_BASE = JSON.parse(stored)
        console.log('[RAG] Loaded knowledge base:', KNOWLEDGE_BASE.length, 'documents')
      }
    } catch (error) {
      console.error('[RAG] Error loading knowledge base:', error)
    }
  }
}

/**
 * Save knowledge base to localStorage
 */
export function saveKnowledgeBase(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('rag_knowledge_base', JSON.stringify(KNOWLEDGE_BASE))
      console.log('[RAG] Saved knowledge base:', KNOWLEDGE_BASE.length, 'documents')
    } catch (error) {
      console.error('[RAG] Error saving knowledge base:', error)
    }
  }
}

// Load knowledge base on module initialization
if (typeof window !== 'undefined') {
  loadKnowledgeBase()
}

/**
 * Retrieve relevant documents from knowledge base based on user query
 */
export function retrieveRAGDocuments(query: string, maxResults: number = 3): RAGDocument[] {
  if (KNOWLEDGE_BASE.length === 0) {
    return []
  }

  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2) // Words with >2 chars

  // Score each document based on keyword matches
  const scoredDocs = KNOWLEDGE_BASE.map(doc => {
    let score = 0

    // Check title match
    if (doc.title.toLowerCase().includes(queryLower)) {
      score += 10
    }

    // Check keyword matches
    for (const keyword of doc.keywords) {
      if (queryLower.includes(keyword)) {
        score += 5
      }
    }

    // Check content word matches
    for (const word of queryWords) {
      if (doc.content.toLowerCase().includes(word)) {
        score += 1
      }
    }

    // Add priority boost
    score += doc.priority

    return { doc, score }
  })

  // Sort by score and return top results
  return scoredDocs
    .filter(item => item.score > 5) // Minimum relevance threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.doc)
}

/**
 * Format RAG documents as context for LLM
 */
export function formatRAGContext(documents: RAGDocument[]): string {
  if (documents.length === 0) {
    return ""
  }

  let context = `📚 KNOWLEDGE BASE (Internal Information):\n\n`

  documents.forEach((doc, index) => {
    context += `[${index + 1}] ${doc.title}\n`
    context += `${doc.content}\n\n`
    context += `---\n\n`
  })

  context += `IMPORTANT: This information comes from the knowledge base and is reliable.
Use this data PRIMARILY before web search results for technical specifications!\n\n`

  return context
}

/**
 * Main RAG function: Retrieve and format context
 */
export function getRAGContext(query: string, maxResults: number = 3): string {
  const documents = retrieveRAGDocuments(query, maxResults)
  return formatRAGContext(documents)
}
