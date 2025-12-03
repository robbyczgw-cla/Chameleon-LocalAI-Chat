/**
 * AI-powered chat title generation - Local-First Edition
 * Uses local LM Studio model for privacy, falls back to OpenRouter
 */

// Use local model for title generation (fast, private)
const LOCAL_TITLE_MODEL = "qwen/qwen3-1.7b"
// Fallback to OpenRouter model if local not available
const CLOUD_TITLE_MODEL = "openai/gpt-oss-20b"

// LM Studio endpoint
const LM_STUDIO_ENDPOINT = "http://localhost:1234/v1"

interface TitleGenerationResult {
  title: string
  success: boolean
}

/**
 * Generate a concise chat title from the user's first message
 * Tries local LM Studio first, falls back to OpenRouter
 */
export async function generateChatTitle(
  userMessage: string,
  apiKey?: string
): Promise<TitleGenerationResult> {
  // Fallback title (truncated message)
  const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "")

  // Don't generate titles for very short messages
  if (userMessage.length < 10) {
    return { title: fallbackTitle, success: false }
  }

  const systemPrompt = "Generate a very short, concise title (2-6 words) for a chat conversation based on the user's first message. Reply with ONLY the title, no quotes, no punctuation at the end, no explanation. Examples: 'Python List Sorting', 'Recipe for Pasta', 'Travel Tips Tokyo', 'Debug React Error'"

  // Try local LM Studio first
  try {
    console.log("[TitleGenerator] Trying local LM Studio...")
    const localResult = await generateTitleLocal(userMessage, systemPrompt)
    if (localResult.success) {
      return localResult
    }
  } catch (error) {
    console.log("[TitleGenerator] Local model not available, trying OpenRouter...")
  }

  // Fall back to OpenRouter if local fails and API key exists
  if (apiKey) {
    try {
      console.log("[TitleGenerator] Using OpenRouter fallback...")
      return await generateTitleOpenRouter(userMessage, systemPrompt, apiKey)
    } catch (error) {
      console.error("[TitleGenerator] OpenRouter error:", error)
    }
  }

  return { title: fallbackTitle, success: false }
}

/**
 * Generate title using local LM Studio
 */
async function generateTitleLocal(
  userMessage: string,
  systemPrompt: string
): Promise<TitleGenerationResult> {
  const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "")

  try {
    const response = await fetch(`${LM_STUDIO_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LOCAL_TITLE_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage.slice(0, 500) },
        ],
        max_tokens: 20,
        temperature: 0.3,
        stream: false,
      }),
      // Short timeout for local model
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.warn("[TitleGenerator/Local] Error:", response.status)
      return { title: fallbackTitle, success: false }
    }

    const data = await response.json()
    const generatedTitle = data.choices?.[0]?.message?.content?.trim()

    return processGeneratedTitle(generatedTitle, fallbackTitle)
  } catch (error) {
    console.warn("[TitleGenerator/Local] Not available:", error)
    return { title: fallbackTitle, success: false }
  }
}

/**
 * Generate title using OpenRouter (fallback)
 */
async function generateTitleOpenRouter(
  userMessage: string,
  systemPrompt: string,
  apiKey: string
): Promise<TitleGenerationResult> {
  const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "")

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://chameleon-ai.app",
        "X-Title": "Chameleon AI Chat",
      },
      body: JSON.stringify({
        model: CLOUD_TITLE_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage.slice(0, 500) },
        ],
        max_tokens: 20,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      console.warn("[TitleGenerator/OpenRouter] Error:", response.status)
      return { title: fallbackTitle, success: false }
    }

    const data = await response.json()
    const generatedTitle = data.choices?.[0]?.message?.content?.trim()

    return processGeneratedTitle(generatedTitle, fallbackTitle)
  } catch (error) {
    console.error("[TitleGenerator/OpenRouter] Error:", error)
    return { title: fallbackTitle, success: false }
  }
}

/**
 * Process and clean up a generated title
 */
function processGeneratedTitle(
  generatedTitle: string | undefined,
  fallbackTitle: string
): TitleGenerationResult {
  if (!generatedTitle || generatedTitle.length < 2 || generatedTitle.length > 60) {
    console.warn("[TitleGenerator] Invalid title generated:", generatedTitle)
    return { title: fallbackTitle, success: false }
  }

  // Clean up the title (remove quotes, trailing punctuation)
  const cleanTitle = generatedTitle
    .replace(/^["']|["']$/g, "") // Remove surrounding quotes
    .replace(/[.!?]+$/, "") // Remove trailing punctuation
    .trim()

  console.log(`[TitleGenerator] Generated: "${cleanTitle}"`)
  return { title: cleanTitle, success: true }
}
