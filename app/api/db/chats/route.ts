/**
 * Local SQLite API route for chats
 * GET - Fetch all chats with messages
 * POST - Create a new chat
 * PUT - Update a chat
 * DELETE - Delete a chat (or all chats with ?all=true)
 */

import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db/sqlite'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const chats = db.getAllChats()

    // Fetch messages for each chat
    const chatsWithMessages = chats.map(chat => {
      const messages = db.getMessages(chat.id)
      return {
        id: chat.id,
        title: chat.title,
        model: chat.model,
        persona: chat.persona,
        folderId: chat.folder_id,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
        titleGeneratedAt: chat.title_generated_at,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: tryParseJSON(msg.content),
          model: msg.model,
          tokensUsed: msg.tokens_used,
          cost: msg.cost,
          searchResults: msg.search_results ? tryParseJSON(msg.search_results) : undefined,
          timestamp: msg.timestamp,
        })),
      }
    })

    return NextResponse.json(chatsWithMessages)
  } catch (error) {
    console.error('[API/db/chats] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const chat = await req.json()

    db.createChat({
      id: chat.id,
      title: chat.title || 'New Chat',
      model: chat.model,
      persona: chat.persona,
      folderId: chat.folderId,
      createdAt: chat.createdAt || Date.now(),
      updatedAt: chat.updatedAt || Date.now(),
    })

    // Also create messages if provided
    if (chat.messages && Array.isArray(chat.messages)) {
      for (const msg of chat.messages) {
        db.createMessage({
          id: msg.id,
          chatId: chat.id,
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          model: msg.model,
          tokensUsed: msg.tokensUsed,
          cost: msg.cost,
          searchResults: msg.searchResults ? JSON.stringify(msg.searchResults) : undefined,
          timestamp: msg.timestamp || Date.now(),
        })
      }
    }

    return NextResponse.json({ success: true, id: chat.id })
  } catch (error) {
    console.error('[API/db/chats] POST error:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    db.updateChat(id, {
      title: updates.title,
      model: updates.model,
      persona: updates.persona,
      folderId: updates.folderId,
      updatedAt: updates.updatedAt || Date.now(),
      titleGeneratedAt: updates.titleGeneratedAt,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/db/chats] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deleteAll = searchParams.get('all') === 'true'
    const chatId = searchParams.get('id')

    if (deleteAll) {
      // Atomic delete all chats
      db.deleteAllChats()
      console.log('[API/db/chats] Deleted all chats')
      return NextResponse.json({ success: true, deletedAll: true })
    }

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    db.deleteChat(chatId)
    return NextResponse.json({ success: true, id: chatId })
  } catch (error) {
    console.error('[API/db/chats] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}

// Helper to parse JSON or return original string
function tryParseJSON(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}
