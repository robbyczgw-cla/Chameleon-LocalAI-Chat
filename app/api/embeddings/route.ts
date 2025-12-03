import { type NextRequest, NextResponse } from "next/server"

// Use Node.js runtime for local model support
export const runtime = "nodejs"

// LM Studio endpoint for embeddings
const LM_STUDIO_ENDPOINT = "http://localhost:1234/v1"
const LOCAL_EMBEDDING_MODEL = "text-embedding-nomic-embed-text-v1.5"

interface EmbeddingRequest {
  texts: string[]
  model?: string
  useLocal?: boolean // Force local model
}

/**
 * Embeddings API Route - Local-First Edition
 * Uses LM Studio's nomic-embed-text model locally, falls back to OpenRouter
 * Used for semantic search in Document Collections
 */
export async function POST(req: NextRequest) {
  try {
    const body: EmbeddingRequest = await req.json()
    const { texts, model, useLocal = true } = body

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: "texts array is required and must not be empty" },
        { status: 400 }
      )
    }

    // Validate text lengths
    const maxLength = 30000
    for (const text of texts) {
      if (text.length > maxLength) {
        return NextResponse.json(
          { error: `Text exceeds maximum length of ${maxLength} characters` },
          { status: 400 }
        )
      }
    }

    // Try local LM Studio first (default behavior)
    if (useLocal) {
      try {
        console.log(`[Embeddings] Trying local LM Studio with ${LOCAL_EMBEDDING_MODEL}...`)
        const localResult = await generateLocalEmbeddings(texts)
        if (localResult) {
          return NextResponse.json(localResult)
        }
      } catch (error) {
        console.log("[Embeddings] Local model not available, falling back to OpenRouter...")
      }
    }

    // Fallback to OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY || req.headers.get("x-openrouter-api-key")

    if (!apiKey) {
      return NextResponse.json(
        { error: "Neither LM Studio nor OpenRouter API key available" },
        { status: 401 }
      )
    }

    const cloudModel = model || "openai/text-embedding-3-small"
    console.log(`[Embeddings] Using OpenRouter fallback with ${cloudModel}`)

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Chameleon AI Chat - Embeddings",
      },
      body: JSON.stringify({
        model: cloudModel,
        input: texts,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Embeddings] OpenRouter error:", response.status, errorText)
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json(
          { error: error.error?.message || "Embeddings API error" },
          { status: response.status }
        )
      } catch {
        return NextResponse.json(
          { error: errorText || "Embeddings API error" },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
    console.log(`[Embeddings] Successfully generated ${data.data?.length || 0} embeddings via OpenRouter`)

    const embeddings = data.data.map((item: any) => item.embedding)

    return NextResponse.json({
      embeddings,
      model: data.model,
      usage: data.usage,
      source: "openrouter",
    })
  } catch (error) {
    console.error("[Embeddings] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Generate embeddings using local LM Studio
 */
async function generateLocalEmbeddings(texts: string[]): Promise<{
  embeddings: number[][]
  model: string
  usage?: { prompt_tokens: number; total_tokens: number }
  source: string
} | null> {
  try {
    const response = await fetch(`${LM_STUDIO_ENDPOINT}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LOCAL_EMBEDDING_MODEL,
        input: texts,
      }),
      // Short timeout for local model check
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.warn("[Embeddings/Local] Error:", response.status)
      return null
    }

    const data = await response.json()
    console.log(`[Embeddings/Local] Successfully generated ${data.data?.length || 0} embeddings`)

    const embeddings = data.data.map((item: any) => item.embedding)

    return {
      embeddings,
      model: LOCAL_EMBEDDING_MODEL,
      usage: data.usage,
      source: "lmstudio",
    }
  } catch (error) {
    console.warn("[Embeddings/Local] Not available:", error)
    return null
  }
}
