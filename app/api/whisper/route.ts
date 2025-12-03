import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | Blob
    const apiKey = formData.get('apiKey') as string
    const mimeType = formData.get('mimeType') as string || 'audio/webm'

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 })
    }

    // Determine correct filename based on mimeType
    const extension = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm'
    const filename = `audio.${extension}`

    console.log('[Whisper API] Received audio:', {
      size: audioFile.size,
      type: audioFile.type || mimeType,
      filename
    })

    // Convert to proper File with correct MIME type (edge runtime fix)
    const arrayBuffer = await audioFile.arrayBuffer()
    const properMimeType = mimeType.includes('mp4') || mimeType.includes('m4a')
      ? 'audio/mp4'
      : 'audio/webm'
    const file = new File([arrayBuffer], filename, { type: properMimeType })

    console.log('[Whisper API] Sending to OpenAI:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Prepare the form data for OpenAI Whisper API
    const whisperFormData = new FormData()
    whisperFormData.append('file', file)
    whisperFormData.append('model', 'whisper-1')
    // Let Whisper auto-detect language for better multilingual support

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Whisper API error:', error)
      return NextResponse.json(
        { error: 'Failed to transcribe audio', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error('Whisper API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
