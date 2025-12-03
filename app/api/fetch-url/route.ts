import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * URL Fetch API - Fetches web content and converts to clean text/markdown
 * Similar to Claude Code's WebFetch tool
 *
 * Features:
 * - Fetches any URL content
 * - Converts HTML to clean markdown
 * - Extracts main content (removes nav, footer, ads)
 * - Handles redirects
 * - Caches results briefly
 * - Returns structured data for AI consumption
 */

interface FetchUrlRequest {
  url: string
  maxLength?: number // Max characters to return (default 50000)
  includeLinks?: boolean // Include hyperlinks in output
  includeImages?: boolean // Include image descriptions
  selector?: string // CSS selector to extract specific content
}

interface FetchUrlResponse {
  success: boolean
  url: string
  finalUrl?: string // If redirected
  title?: string
  content: string
  contentLength: number
  truncated: boolean
  error?: string
  metadata?: {
    description?: string
    author?: string
    publishedDate?: string
    siteName?: string
  }
}

// Simple in-memory cache (15 minutes)
const cache = new Map<string, { data: FetchUrlResponse; timestamp: number }>()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

export async function POST(req: NextRequest) {
  try {
    const {
      url,
      maxLength = 50000,
      includeLinks = true,
      includeImages = false,
      selector,
    } = (await req.json()) as FetchUrlRequest

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`)
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = `${parsedUrl.href}:${maxLength}:${includeLinks}:${selector || ""}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[FetchUrl] Cache hit: ${parsedUrl.href}`)
      return NextResponse.json(cached.data)
    }

    console.log(`[FetchUrl] Fetching: ${parsedUrl.href}`)

    // Fetch the URL
    const response = await fetch(parsedUrl.href, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChameleonBot/1.0; +https://github.com/chameleon)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          url: parsedUrl.href,
          error: `HTTP ${response.status}: ${response.statusText}`,
          content: "",
          contentLength: 0,
          truncated: false,
        },
        { status: response.status }
      )
    }

    const finalUrl = response.url
    const contentType = response.headers.get("content-type") || ""

    // Handle different content types
    let content: string
    let title: string | undefined
    let metadata: FetchUrlResponse["metadata"] = {}

    if (contentType.includes("application/json")) {
      // JSON content - return formatted
      const json = await response.json()
      content = JSON.stringify(json, null, 2)
      title = "JSON Response"
    } else if (contentType.includes("text/plain")) {
      // Plain text
      content = await response.text()
      title = parsedUrl.hostname
    } else {
      // HTML - parse and extract content
      const html = await response.text()
      const parsed = parseHtml(html, { includeLinks, includeImages, selector })
      content = parsed.content
      title = parsed.title
      metadata = parsed.metadata
    }

    // Truncate if needed
    const truncated = content.length > maxLength
    if (truncated) {
      content = content.slice(0, maxLength) + "\n\n[Content truncated...]"
    }

    const result: FetchUrlResponse = {
      success: true,
      url: parsedUrl.href,
      finalUrl: finalUrl !== parsedUrl.href ? finalUrl : undefined,
      title,
      content,
      contentLength: content.length,
      truncated,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    }

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    // Clean old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        cache.delete(key)
      }
    }

    console.log(`[FetchUrl] Success: ${title || parsedUrl.hostname} (${content.length} chars)`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[FetchUrl] Error:", error)

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        {
          success: false,
          error: "Request timed out after 30 seconds",
          content: "",
          contentLength: 0,
          truncated: false,
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch URL",
        content: "",
        contentLength: 0,
        truncated: false,
      },
      { status: 500 }
    )
  }
}

/**
 * Parse HTML and extract clean content
 */
function parseHtml(
  html: string,
  options: { includeLinks: boolean; includeImages: boolean; selector?: string }
): { content: string; title?: string; metadata: FetchUrlResponse["metadata"] } {
  const metadata: FetchUrlResponse["metadata"] = {}

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : undefined

  // Extract meta tags
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
  if (descMatch) metadata.description = decodeHtmlEntities(descMatch[1])

  const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)
  if (authorMatch) metadata.author = decodeHtmlEntities(authorMatch[1])

  const dateMatch = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)
  if (dateMatch) metadata.publishedDate = dateMatch[1]

  const siteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
  if (siteMatch) metadata.siteName = decodeHtmlEntities(siteMatch[1])

  // Remove unwanted elements
  let content = html
    // Remove scripts, styles, and other non-content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Remove nav, footer, header, aside (often contain navigation/ads)
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")

  // Try to find main content area
  const mainMatch = content.match(/<main[\s\S]*?<\/main>/i)
    || content.match(/<article[\s\S]*?<\/article>/i)
    || content.match(/<div[^>]+class=["'][^"']*content[^"']*["'][\s\S]*?<\/div>/i)
    || content.match(/<div[^>]+id=["']content["'][\s\S]*?<\/div>/i)

  if (mainMatch) {
    content = mainMatch[0]
  }

  // Convert to markdown-ish text
  content = content
    // Handle headings
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n#### $1\n\n")
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n\n##### $1\n\n")
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n\n###### $1\n\n")
    // Handle links
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      options.includeLinks ? "[$2]($1)" : "$2")
    // Handle images
    .replace(/<img[^>]+alt=["']([^"']+)["'][^>]*>/gi,
      options.includeImages ? "[Image: $1]" : "")
    .replace(/<img[^>]*>/gi, "")
    // Handle lists
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "• $1\n")
    .replace(/<[ou]l[^>]*>/gi, "\n")
    .replace(/<\/[ou]l>/gi, "\n")
    // Handle paragraphs and divs
    .replace(/<p[^>]*>/gi, "\n\n")
    .replace(/<\/p>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div[^>]*>/gi, "\n")
    .replace(/<\/div>/gi, "")
    // Handle formatting
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n> $1\n")
    // Remove remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    // Clean up whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim()

  return { content, title, metadata }
}

/**
 * Decode HTML entities in a string
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
}

/**
 * GET - Simple health check / info
 */
export async function GET() {
  return NextResponse.json({
    name: "URL Fetch API",
    description: "Fetches web content and converts HTML to clean markdown",
    usage: {
      method: "POST",
      body: {
        url: "string (required) - URL to fetch",
        maxLength: "number (optional, default 50000) - Max characters",
        includeLinks: "boolean (optional, default true) - Include hyperlinks",
        includeImages: "boolean (optional, default false) - Include image descriptions",
        selector: "string (optional) - CSS selector for specific content",
      },
    },
    cacheTime: "15 minutes",
  })
}
