/**
 * LM Studio Models Proxy Route
 * Fetches available models from local LM Studio server
 * Bypasses browser CORS restrictions via server-side proxy
 */

import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ENDPOINT = "http://localhost:1234/v1"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint') || DEFAULT_ENDPOINT

    console.log(`[LMStudio/models] Fetching models from: ${endpoint}`)

    const response = await fetch(`${endpoint}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Short timeout for local connections
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[LMStudio/models] Error:', response.status, errorText)
      return NextResponse.json(
        { error: `LM Studio error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Transform models to include local/ prefix
    const models = (data.data || []).map((model: any) => ({
      id: `local/${model.id}`,
      name: formatModelName(model.id),
      object: model.object,
      owned_by: model.owned_by || 'local',
    }))

    console.log(`[LMStudio/models] Found ${models.length} models`)

    return NextResponse.json({ data: models })
  } catch (error) {
    console.error('[LMStudio/models] Error:', error)

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'LM Studio not responding', details: 'Connection timed out - is LM Studio running?' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to connect to LM Studio', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Format model ID into human-readable name
 */
function formatModelName(modelId: string): string {
  // Remove file extension
  let name = modelId.replace(/\.gguf$/i, "")

  // Extract quantization if present
  const quantMatch = name.match(/\.(Q[0-9]_[A-Z0-9_]+)$/i)
  const quant = quantMatch ? quantMatch[1] : null
  if (quant) {
    name = name.replace(`.${quant}`, "")
  }

  // Replace separators with spaces
  name = name.replace(/[-_]/g, " ")

  // Capitalize words
  name = name.split(" ").map(word => {
    if (/^\d+[bBmM]?$/.test(word)) return word.toUpperCase()
    if (word.length <= 2) return word.toUpperCase()
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(" ")

  // Add quantization back if present
  if (quant) {
    name += ` (${quant})`
  }

  return name
}
