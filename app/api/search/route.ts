import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface SearchRequest {
  query: string
  maxResults?: number
  searchDepth?: "basic" | "advanced"
  includeImages?: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
  includeRawContent?: boolean
  topic?: "general" | "news"
}

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      maxResults = 5,
      searchDepth = "basic",
      includeImages = false,
      includeDomains,
      excludeDomains,
      includeRawContent = false,
      topic = "general"
    } = (await req.json()) as SearchRequest

    const apiKey = process.env.TAVILY_API_KEY || req.headers.get("x-tavily-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "Tavily API key not configured" }, { status: 401 })
    }

    const requestBody: any = {
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_images: includeImages,
      include_answer: true,
      include_raw_content: includeRawContent,
      topic: topic,
    }

    // Add domain filters if provided
    if (includeDomains && includeDomains.length > 0) {
      requestBody.include_domains = includeDomains
    }
    if (excludeDomains && excludeDomains.length > 0) {
      requestBody.exclude_domains = excludeDomains
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.error || "Tavily API error" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
