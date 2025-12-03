/**
 * You.com Search API Integration
 *
 * Provides web search with optional livecrawl for full page content
 * Docs: https://documentation.you.com/api-reference/search
 */

export interface YoucomSearchOptions {
  maxResults?: number
  country?: string
  livecrawl?: boolean
  safeSearch?: "off" | "moderate" | "strict"
  freshness?: "none" | "day" | "week" | "month"
  apiKey?: string
}

export interface YoucomSearchResult {
  url: string
  title: string
  description: string
  snippets: string[]
  thumbnail_url?: string
  page_age?: string
  content?: string // Full page content if livecrawl enabled
}

export interface YoucomSearchResponse {
  results: YoucomSearchResult[]
  images?: string[]
  answer?: string
}

/**
 * Search with You.com API
 */
export async function searchWithYoucom(
  query: string,
  options: YoucomSearchOptions = {}
): Promise<YoucomSearchResponse> {
  const {
    maxResults = 5,
    country = "at",
    livecrawl = true,
    safeSearch = "moderate",
    freshness = "none",
    apiKey = process.env.NEXT_PUBLIC_YOUCOM_API_KEY
  } = options

  if (!apiKey) {
    throw new Error("You.com API key not found")
  }

  try {
    const params = new URLSearchParams({
      query,
      count: maxResults.toString(),
      country,
    })

    // Add safe search filter
    if (safeSearch && safeSearch !== "moderate") {
      params.append('safesearch', safeSearch)
    }

    // Add freshness filter
    if (freshness && freshness !== "none") {
      params.append('freshness', freshness)
    }

    // Add livecrawl for full page content
    if (livecrawl) {
      params.append('livecrawl', 'web')
      params.append('livecrawl_formats', 'markdown')
    }

    const response = await fetch(
      `https://api.ydc-index.io/v1/search?${params}`,
      {
        headers: {
          'X-API-Key': apiKey,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`You.com API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Transform to our standard format
    const results: YoucomSearchResult[] = (data.results?.web || []).map((result: any) => ({
      url: result.url,
      title: result.title,
      description: result.description,
      snippets: result.snippets || [],
      thumbnail_url: result.thumbnail_url,
      page_age: result.page_age,
      content: result.content // Full page markdown if livecrawl enabled
    }))

    return {
      results,
      images: [], // You.com doesn't provide image URLs in response
      answer: undefined
    }
  } catch (error) {
    console.error("[You.com] Search error:", error)
    throw error
  }
}

/**
 * Format You.com search results for LLM context
 */
export function formatSearchResults(results: YoucomSearchResult[]): string {
  if (!results || results.length === 0) {
    return "Keine Suchergebnisse gefunden."
  }

  return results
    .map((result, index) => {
      let formatted = `[${index + 1}] ${result.title}\n`
      formatted += `URL: ${result.url}\n`

      // If we have full content (livecrawl), use that instead of snippets
      if (result.content) {
        formatted += `Content:\n${result.content.substring(0, 2000)}\n` // Limit to 2000 chars per result
      } else if (result.description) {
        formatted += `Beschreibung: ${result.description}\n`
      }

      if (result.snippets && result.snippets.length > 0) {
        formatted += `Snippets:\n${result.snippets.join('\n')}\n`
      }

      if (result.page_age) {
        formatted += `Alter: ${result.page_age}\n`
      }

      return formatted
    })
    .join("\n---\n\n")
}
