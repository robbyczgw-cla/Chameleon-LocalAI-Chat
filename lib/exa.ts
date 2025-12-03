// Exa AI Search API integration
// https://docs.exa.ai/reference/search

export interface ExaResult {
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

export interface ExaSearchResponse {
  requestId: string
  autopromptString?: string
  resolvedSearchType?: string
  results: ExaResult[]
}

// Normalized search result for compatibility with other providers
export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
  highlights?: string[]
  summary?: string
  image?: string
}

export interface SearchResponse {
  query: string
  answer: string
  results: SearchResult[]
  images?: string[]
  response_time: number
  autoprompt?: string
  searchType?: string
}

export type ExaSearchType = "neural" | "keyword" | "auto"
export type ExaCategory = "company" | "research paper" | "news" | "pdf" | "github" | "tweet" | "personal site" | "linkedin profile" | "financial report"
export type ExaLivecrawl = "never" | "fallback" | "always"

export interface ExaSearchOptions {
  type?: ExaSearchType // Search method: neural (semantic), keyword, or auto (combined)
  useAutoprompt?: boolean // Let Exa optimize the query for better results
  maxResults?: number // 1-100 results
  category?: ExaCategory // Filter by content category
  includeDomains?: string[] // Only search these domains
  excludeDomains?: string[] // Exclude these domains
  startPublishedDate?: string // ISO 8601: filter by publish date start
  endPublishedDate?: string // ISO 8601: filter by publish date end
  includeText?: string[] // Phrases that MUST appear in results
  excludeText?: string[] // Phrases to exclude from results
  // Content retrieval
  includeFullText?: boolean // Get full page text
  includeHighlights?: boolean // Get relevant highlights
  includeSummary?: boolean // Get AI-generated summary
  highlightsPerResult?: number // Number of highlight sentences per result
  maxTextCharacters?: number // Limit text length per result
  // Freshness
  livecrawl?: ExaLivecrawl // How to handle stale content
  livecrawlTimeout?: number // Timeout for live crawling in ms
  // API key
  apiKey?: string
}

export async function searchWithExa(
  query: string,
  options: ExaSearchOptions = {}
): Promise<SearchResponse> {
  const {
    type = "auto",
    useAutoprompt = true,
    maxResults = 5,
    category,
    includeDomains,
    excludeDomains,
    startPublishedDate,
    endPublishedDate,
    includeText,
    excludeText,
    includeFullText = true,
    includeHighlights = true,
    includeSummary = false,
    highlightsPerResult = 3,
    maxTextCharacters = 3000,
    livecrawl = "fallback",
    livecrawlTimeout = 10000,
    apiKey
  } = options

  const startTime = Date.now()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers["x-exa-api-key"] = apiKey
  }

  // Build contents options for text/highlights/summary
  const contents: Record<string, any> = {}
  if (includeFullText) {
    contents.text = maxTextCharacters ? { maxCharacters: maxTextCharacters } : true
  }
  if (includeHighlights) {
    contents.highlights = highlightsPerResult ? { numSentences: highlightsPerResult } : true
  }
  if (includeSummary) {
    contents.summary = true
  }

  const response = await fetch("/api/exa", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      type,
      useAutoprompt,
      numResults: maxResults,
      category,
      includeDomains,
      excludeDomains,
      startPublishedDate,
      endPublishedDate,
      includeText,
      excludeText,
      contents,
      livecrawl,
      livecrawlTimeout,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to search with Exa")
  }

  const data: ExaSearchResponse = await response.json()
  const responseTime = Date.now() - startTime

  // Convert Exa results to normalized SearchResult format
  const results: SearchResult[] = data.results.map((result, index) => ({
    title: result.title,
    url: result.url,
    content: result.text || result.highlights?.join(" ") || result.summary || "",
    score: result.score ?? (1 - index * 0.1), // Use Exa score or position-based
    published_date: result.publishedDate,
    highlights: result.highlights,
    summary: result.summary,
    image: result.image,
  }))

  // Build answer from first result or summary
  let answer = ""
  if (results.length > 0) {
    if (results[0].summary) {
      answer = results[0].summary
    } else if (results[0].highlights?.length) {
      answer = results[0].highlights[0]
    } else {
      answer = results[0].content.substring(0, 500)
    }
  }

  // Extract images from results
  const images: string[] = results
    .filter(r => r.image)
    .map(r => r.image!)
    .slice(0, 5)

  return {
    query,
    answer,
    results,
    images,
    response_time: responseTime,
    autoprompt: data.autopromptString,
    searchType: data.resolvedSearchType,
  }
}

/**
 * Format Exa search results for LLM context
 * Optimized for RAG with highlights and full text
 */
export function formatExaResults(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      let formatted = `
[${index + 1}] ${result.title}
URL: ${result.url}`

      // Add highlights if available (most relevant snippets)
      if (result.highlights?.length) {
        formatted += `\nKey Points:\n${result.highlights.map(h => `• ${h}`).join("\n")}`
      }

      // Add full content
      if (result.content && result.content !== result.highlights?.join(" ")) {
        const contentPreview = result.content.length > 1500
          ? result.content.substring(0, 1500) + "..."
          : result.content
        formatted += `\nContent: ${contentPreview}`
      }

      // Add summary if available
      if (result.summary) {
        formatted += `\nSummary: ${result.summary}`
      }

      if (result.published_date) {
        formatted += `\nPublished: ${result.published_date}`
      }

      return formatted
    })
    .join("\n\n---\n")
}

/**
 * Format results for compact display (similar to Tavily/Serper)
 */
export function formatSearchResults(results: SearchResult[]): string {
  return results
    .map(
      (result, index) => `
[${index + 1}] ${result.title}
URL: ${result.url}
${result.content.substring(0, 300)}${result.content.length > 300 ? "..." : ""}
${result.published_date ? `Published: ${result.published_date}` : ""}
`
    )
    .join("\n---\n")
}
