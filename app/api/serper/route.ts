import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface SerperRequest {
  query: string
  maxResults?: number
  includeImages?: boolean
  country?: string
  language?: string
  type?: "search" | "images" | "news" | "videos" | "places" | "shopping"
  timeRange?: "none" | "hour" | "day" | "week" | "month" | "year"
  autocorrect?: boolean
  page?: number
}

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      maxResults = 5,
      includeImages = false,
      country = "at",
      language = "de",
      type = "search",
      timeRange = "none",
      autocorrect = true,
      page = 1
    } = (await req.json()) as SerperRequest

    // Try user-provided API key first, then fall back to environment variable
    const apiKey = process.env.SERPER_API_KEY || req.headers.get("x-serper-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "Serper API key not configured" }, { status: 401 })
    }

    const requestBody: any = {
      q: query,
      gl: country, // Country code (at, de, etc.)
      hl: language, // Language code (de, en, etc.)
      num: maxResults,
      page: page,
      autocorrect: autocorrect,
    }

    // Add time-based search filter (tbs parameter)
    if (timeRange && timeRange !== "none") {
      const tbsMap = {
        hour: "qdr:h",
        day: "qdr:d",
        week: "qdr:w",
        month: "qdr:m",
        year: "qdr:y"
      }
      requestBody.tbs = tbsMap[timeRange as keyof typeof tbsMap]
    }

    // Determine endpoint based on type
    const endpoint = `https://google.serper.dev/${type}`

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Serper API error" }))
      return NextResponse.json({ error: error.message || "Serper API error" }, { status: response.status })
    }

    const data = await response.json()

    // If images are requested, make a separate image search
    if (includeImages) {
      try {
        console.log("[Serper API] Requesting images for:", query)
        const imageResponse = await fetch("https://google.serper.dev/images", {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            gl: country,
            hl: language,
            num: 5,
          }),
        })

        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          console.log("[Serper API] Received images:", imageData.images?.length || 0)
          data.images = imageData.images
        } else {
          console.error("[Serper API] Image request failed:", imageResponse.status)
        }
      } catch (imageError) {
        console.error("[Serper API] Image search failed:", imageError)
        // Continue without images
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Serper API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
