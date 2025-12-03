// Serper.dev Google Search API integration
// https://serper.dev/

export interface SerperResult {
  title: string
  link: string
  snippet: string
  position: number
  date?: string
}

export interface SerperImage {
  title: string
  imageUrl: string
  link: string
}

export interface SerperKnowledgeGraph {
  title?: string
  type?: string
  description?: string
  price?: string
  attributes?: Record<string, string>
}

export interface SerperSearchResponse {
  searchParameters: {
    q: string
    gl?: string
    hl?: string
    num?: number
  }
  organic: SerperResult[]
  images?: SerperImage[]
  knowledgeGraph?: SerperKnowledgeGraph
  answerBox?: {
    answer?: string
    snippet?: string
    title?: string
  }
}

export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

export interface SearchResponse {
  query: string
  answer: string
  results: SearchResult[]
  images?: string[]
  response_time: number
}

export async function searchWithSerper(
  query: string,
  options: {
    maxResults?: number
    includeImages?: boolean
    country?: string // "at" for Austria, "de" for Germany
    language?: string // "de" for German
    type?: "search" | "images" | "news" | "videos" | "places" | "shopping"
    timeRange?: "none" | "hour" | "day" | "week" | "month" | "year"
    autocorrect?: boolean
    page?: number
    apiKey?: string
  } = {},
): Promise<SearchResponse> {
  const {
    maxResults = 5,
    includeImages = false,
    country = "at",
    language = "de",
    type = "search",
    timeRange = "none",
    autocorrect = true,
    page = 1,
    apiKey
  } = options

  const startTime = Date.now()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers["x-serper-api-key"] = apiKey
  }

  const response = await fetch("/api/serper", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      maxResults,
      includeImages,
      country,
      language,
      type,
      timeRange,
      autocorrect,
      page,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to search with Serper")
  }

  const data: SerperSearchResponse = await response.json()

  // Convert Serper format to our SearchResponse format
  const results: SearchResult[] = data.organic.slice(0, maxResults).map((result, index) => ({
    title: result.title,
    url: result.link,
    content: result.snippet,
    score: 1 - index * 0.1, // Simple scoring based on position
    published_date: result.date,
  }))

  // Extract answer from knowledge graph or answer box
  let answer = ""
  if (data.answerBox?.answer) {
    answer = data.answerBox.answer
  } else if (data.answerBox?.snippet) {
    answer = data.answerBox.snippet
  } else if (data.knowledgeGraph?.description) {
    answer = data.knowledgeGraph.description
  } else if (results.length > 0) {
    // Fallback: use first result snippet
    answer = results[0].content
  }

  // Extract images if requested
  const images: string[] = includeImages && data.images ? data.images.slice(0, 5).map((img) => img.imageUrl) : []

  console.log("[Serper] includeImages:", includeImages)
  console.log("[Serper] data.images:", data.images?.length || 0)
  console.log("[Serper] Final images array:", images.length)

  const responseTime = Date.now() - startTime

  return {
    query,
    answer,
    results,
    images,
    response_time: responseTime,
  }
}

export function formatSearchResults(results: SearchResult[]): string {
  return results
    .map(
      (result, index) => `
[${index + 1}] ${result.title}
URL: ${result.url}
${result.content}
${result.published_date ? `Published: ${result.published_date}` : ""}
`,
    )
    .join("\n---\n")
}
