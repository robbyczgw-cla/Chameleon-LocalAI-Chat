/**
 * Unified Search Service
 * Single entry point for all search providers
 */

export * from "./types"
export * from "./format"

import type {
  SearchProvider,
  SearchResponse,
  SearchResult,
  TavilySearchOptions,
  SerperSearchOptions,
  ExaSearchOptions
} from "./types"

/**
 * Unified search function - routes to appropriate provider
 */
export async function search(
  provider: SearchProvider,
  query: string,
  options: TavilySearchOptions | SerperSearchOptions | ExaSearchOptions = {}
): Promise<SearchResponse> {
  const startTime = Date.now()

  switch (provider) {
    case "tavily":
      return searchTavily(query, options as TavilySearchOptions, startTime)
    case "serper":
      return searchSerper(query, options as SerperSearchOptions, startTime)
    case "exa":
      return searchExa(query, options as ExaSearchOptions, startTime)
    default:
      throw new Error(`Unknown search provider: ${provider}`)
  }
}

/**
 * Tavily Search Implementation
 */
async function searchTavily(
  query: string,
  options: TavilySearchOptions,
  startTime: number
): Promise<SearchResponse> {
  const {
    maxResults = 5,
    searchDepth = "basic",
    includeImages = false,
    includeDomains,
    excludeDomains,
    includeRawContent = false,
    topic = "general",
    apiKey
  } = options

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers["x-tavily-api-key"] = apiKey

  const response = await fetch("/api/search", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      maxResults,
      searchDepth,
      includeImages,
      includeDomains,
      excludeDomains,
      includeRawContent,
      topic,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Tavily search failed")
  }

  const data = await response.json()

  return {
    query,
    answer: data.answer || "",
    results: data.results.map((r: any) => normalizeResult(r, "tavily")),
    images: data.images,
    responseTime: Date.now() - startTime,
    provider: "tavily"
  }
}

/**
 * Serper Search Implementation
 */
async function searchSerper(
  query: string,
  options: SerperSearchOptions,
  startTime: number
): Promise<SearchResponse> {
  const {
    maxResults = 5,
    includeImages = false,
    country = "at",
    language = "de",
    type = "search",
    timeRange = "none",
    autocorrect = true,
    apiKey
  } = options

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers["x-serper-api-key"] = apiKey

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
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Serper search failed")
  }

  const data = await response.json()

  // Extract answer from knowledge graph or answer box
  let answer = ""
  if (data.answerBox?.answer) {
    answer = data.answerBox.answer
  } else if (data.answerBox?.snippet) {
    answer = data.answerBox.snippet
  } else if (data.knowledgeGraph?.description) {
    answer = data.knowledgeGraph.description
  }

  const results: SearchResult[] = (data.organic || []).slice(0, maxResults).map((r: any, i: number) => ({
    title: r.title,
    url: r.link,
    content: r.snippet,
    score: 1 - i * 0.1,
    publishedDate: r.date,
  }))

  return {
    query,
    answer: answer || (results[0]?.content || ""),
    results,
    images: data.images?.map((img: any) => img.imageUrl),
    responseTime: Date.now() - startTime,
    provider: "serper",
    metadata: {
      knowledgeGraph: data.knowledgeGraph,
      answerBox: data.answerBox
    }
  }
}

/**
 * Exa Search Implementation
 */
async function searchExa(
  query: string,
  options: ExaSearchOptions,
  startTime: number
): Promise<SearchResponse> {
  const {
    maxResults = 5,
    type = "auto",
    useAutoprompt = true,
    category,
    includeFullText = true,
    includeHighlights = true,
    includeSummary = false,
    includeImages = false, // Don't include images by default
    highlightsPerResult = 3,
    maxTextCharacters = 3000,
    livecrawl = "fallback",
    includeDomains,
    excludeDomains,
    apiKey
  } = options

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers["x-exa-api-key"] = apiKey

  // Build contents options
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
      contents,
      livecrawl,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Exa search failed")
  }

  const data = await response.json()

  const results: SearchResult[] = data.results.map((r: any, i: number) => ({
    title: r.title,
    url: r.url,
    content: r.text || r.highlights?.join(" ") || r.summary || "",
    score: r.score ?? (1 - i * 0.1),
    publishedDate: r.publishedDate,
    highlights: r.highlights,
    summary: r.summary,
    image: r.image,
    author: r.author,
  }))

  // Build answer from first result
  let answer = ""
  if (results[0]) {
    answer = results[0].summary || results[0].highlights?.[0] || results[0].content.substring(0, 500)
  }

  return {
    query,
    answer,
    results,
    images: includeImages ? results.filter(r => r.image).map(r => r.image!).slice(0, 5) : undefined,
    responseTime: Date.now() - startTime,
    provider: "exa",
    metadata: {
      autoprompt: data.autopromptString,
      searchType: data.resolvedSearchType
    }
  }
}

/**
 * Normalize result from different provider formats
 */
function normalizeResult(raw: any, provider: SearchProvider): SearchResult {
  switch (provider) {
    case "tavily":
      return {
        title: raw.title,
        url: raw.url,
        content: raw.content,
        score: raw.score || 0.5,
        publishedDate: raw.published_date,
      }
    default:
      return raw
  }
}
