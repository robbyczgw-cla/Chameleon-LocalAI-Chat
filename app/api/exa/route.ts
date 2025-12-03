import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

// Exa Search API Types
interface ExaRequest {
  query: string
  type?: "neural" | "keyword" | "auto" // Search type (auto combines both)
  useAutoprompt?: boolean // Let Exa optimize the query
  numResults?: number // 1-100, default 10
  category?: "company" | "research paper" | "news" | "pdf" | "github" | "tweet" | "personal site" | "linkedin profile" | "financial report"
  includeDomains?: string[] // Up to 1200 domains
  excludeDomains?: string[] // Up to 1200 domains
  startPublishedDate?: string // ISO 8601 format
  endPublishedDate?: string // ISO 8601 format
  includeText?: string[] // Phrases that must appear (max 5 words each)
  excludeText?: string[] // Phrases to exclude
  // Content retrieval options
  contents?: {
    text?: boolean | { maxCharacters?: number; includeHtmlTags?: boolean }
    highlights?: boolean | { numSentences?: number; highlightsPerUrl?: number; query?: string }
    summary?: boolean | { query?: string }
  }
  // Livecrawl for fresh content
  livecrawl?: "never" | "fallback" | "always"
  livecrawlTimeout?: number // ms, default 10000
}

interface ExaResult {
  id: string
  url: string
  title: string
  score?: number
  publishedDate?: string
  author?: string
  text?: string
  highlights?: string[]
  highlightScores?: number[]
  summary?: string
  image?: string
  favicon?: string
}

interface ExaResponse {
  requestId: string
  autopromptString?: string
  resolvedSearchType?: string
  results: ExaResult[]
}

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      type = "auto",
      useAutoprompt = true,
      numResults = 5,
      category,
      includeDomains,
      excludeDomains,
      startPublishedDate,
      endPublishedDate,
      includeText,
      excludeText,
      contents = { text: true, highlights: true },
      livecrawl = "fallback",
      livecrawlTimeout = 10000
    } = (await req.json()) as ExaRequest

    // Try user-provided API key first, then fall back to environment variable
    const apiKey = process.env.EXA_API_KEY || req.headers.get("x-exa-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "Exa API key not configured" }, { status: 401 })
    }

    // Build request body
    const requestBody: Record<string, any> = {
      query,
      type,
      useAutoprompt,
      numResults,
      livecrawl,
      livecrawlTimeout,
      contents
    }

    // Add optional filters
    if (category) requestBody.category = category
    if (includeDomains?.length) requestBody.includeDomains = includeDomains
    if (excludeDomains?.length) requestBody.excludeDomains = excludeDomains
    if (startPublishedDate) requestBody.startPublishedDate = startPublishedDate
    if (endPublishedDate) requestBody.endPublishedDate = endPublishedDate
    if (includeText?.length) requestBody.includeText = includeText
    if (excludeText?.length) requestBody.excludeText = excludeText

    console.log("[Exa API] Searching:", query, "type:", type, "numResults:", numResults)

    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Exa API] Error:", response.status, errorText)
      return NextResponse.json(
        { error: `Exa API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data: ExaResponse = await response.json()

    console.log("[Exa API] Found", data.results.length, "results")
    if (data.autopromptString) {
      console.log("[Exa API] Autoprompt:", data.autopromptString)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Exa API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
