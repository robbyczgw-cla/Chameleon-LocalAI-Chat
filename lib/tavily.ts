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

export async function searchWeb(
  query: string,
  options: {
    maxResults?: number
    searchDepth?: "basic" | "advanced"
    includeImages?: boolean
    includeDomains?: string[]
    excludeDomains?: string[]
    includeRawContent?: boolean
    topic?: "general" | "news"
    apiKey?: string
  } = {},
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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers["x-tavily-api-key"] = apiKey
  }

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
    throw new Error(error.error || "Failed to search")
  }

  return response.json()
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
