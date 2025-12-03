/**
 * Embeddings Storage using IndexedDB
 * Stores vector embeddings for documents to enable semantic search
 */

const DB_NAME = "chameleon-embeddings"
const DB_VERSION = 1
const STORE_NAME = "embeddings"

export interface StoredEmbedding {
  id: string // Document or collection ID
  text: string // Original text
  embedding: number[] // Vector embedding
  metadata?: {
    collectionId?: string
    documentName?: string
    chunkIndex?: number
    createdAt: number
  }
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create embeddings store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("collectionId", "metadata.collectionId", { unique: false })
        console.log("[EmbeddingsStore] Created embeddings object store")
      }
    }
  })
}

/**
 * Store embedding in IndexedDB
 */
export async function storeEmbedding(embedding: StoredEmbedding): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(embedding)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Store multiple embeddings in batch
 */
export async function storeEmbeddings(embeddings: StoredEmbedding[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    let completed = 0
    let failed = false

    embeddings.forEach((embedding) => {
      const request = store.put(embedding)

      request.onsuccess = () => {
        completed++
        if (completed === embeddings.length) {
          resolve()
        }
      }

      request.onerror = () => {
        if (!failed) {
          failed = true
          reject(request.error)
        }
      }
    })
  })
}

/**
 * Get embedding by ID
 */
export async function getEmbedding(id: string): Promise<StoredEmbedding | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all embeddings for a collection
 */
export async function getEmbeddingsByCollection(collectionId: string): Promise<StoredEmbedding[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("collectionId")
    const request = index.getAll(collectionId)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all embeddings
 */
export async function getAllEmbeddings(): Promise<StoredEmbedding[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete embedding by ID
 */
export async function deleteEmbedding(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete all embeddings for a collection
 */
export async function deleteEmbeddingsByCollection(collectionId: string): Promise<void> {
  const embeddings = await getEmbeddingsByCollection(collectionId)
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    let completed = 0
    let failed = false

    embeddings.forEach((embedding) => {
      const request = store.delete(embedding.id)

      request.onsuccess = () => {
        completed++
        if (completed === embeddings.length) {
          resolve()
        }
      }

      request.onerror = () => {
        if (!failed) {
          failed = true
          reject(request.error)
        }
      }
    })

    // If no embeddings to delete, resolve immediately
    if (embeddings.length === 0) {
      resolve()
    }
  })
}

/**
 * Clear all embeddings
 */
export async function clearAllEmbeddings(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
