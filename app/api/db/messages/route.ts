/**
 * Local SQLite API route for messages
 * POST - Create a new message
 * PUT - Update a message
 * DELETE - Delete a message
 */

import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db/sqlite'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const message = await req.json()

    if (!message.chatId || !message.id || !message.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    db.createMessage({
      id: message.id,
      chatId: message.chatId,
      role: message.role,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      model: message.model,
      tokensUsed: message.tokensUsed,
      cost: message.cost,
      searchResults: message.searchResults ? JSON.stringify(message.searchResults) : undefined,
      timestamp: message.timestamp || Date.now(),
    })

    return NextResponse.json({ success: true, id: message.id })
  } catch (error) {
    console.error('[API/db/messages] POST error:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, content } = await req.json()

    if (!id || content === undefined) {
      return NextResponse.json({ error: 'Message ID and content required' }, { status: 400 })
    }

    db.updateMessage(id, typeof content === 'string' ? content : JSON.stringify(content))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/db/messages] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    db.deleteMessage(messageId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/db/messages] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
