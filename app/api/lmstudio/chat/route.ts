/**
 * LM Studio Chat Proxy Route
 * Proxies chat completions to local LM Studio server
 * Bypasses browser CORS restrictions via server-side proxy
 * Supports streaming responses
 */

import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ENDPOINT = "http://localhost:1234/v1"

export const dynamic = 'force-dynamic'

interface ChatRequest {
  messages: Array<{ role: string; content: any }>
  model: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  endpoint?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const {
      messages,
      model,
      temperature = 0.7,
      max_tokens = 8192,
      top_p = 1.0,
      stream = true,
      endpoint = DEFAULT_ENDPOINT,
    } = body

    // Remove local/ prefix from model name
    const actualModel = model.replace(/^local\//, '')

    console.log(`[LMStudio/chat] Request to ${endpoint}`)
    console.log(`[LMStudio/chat] Model: ${actualModel}`)
    console.log(`[LMStudio/chat] Stream: ${stream}`)
    console.log(`[LMStudio/chat] Messages: ${messages.length}`)

    const requestBody = {
      model: actualModel,
      messages,
      temperature,
      max_tokens,
      top_p,
      stream,
    }

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[LMStudio/chat] Error:', response.status, errorText)
      return NextResponse.json(
        { error: `LM Studio error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    // Handle streaming response
    if (stream) {
      // Pass through the stream directly
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Handle non-streaming response
    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('[LMStudio/chat] Error:', error)

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'LM Studio not responding', details: 'Connection timed out' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to connect to LM Studio', details: String(error) },
      { status: 500 }
    )
  }
}
