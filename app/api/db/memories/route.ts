/**
 * Local SQLite API route for memories
 * GET - Fetch all memories
 * POST - Create a memory
 * DELETE - Delete a memory (or all with ?all=true)
 */

import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db/sqlite'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const memories = db.getAllMemories()
    return NextResponse.json(memories.map(mem => ({
      id: mem.id,
      type: mem.type,
      content: mem.content,
      importance: mem.importance,
      source: mem.source,
      createdAt: mem.created_at,
      lastAccessed: mem.last_accessed,
      accessCount: mem.access_count,
    })))
  } catch (error) {
    console.error('[API/db/memories] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const memory = await req.json()

    if (!memory.id || !memory.type || !memory.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    db.createMemory({
      id: memory.id,
      type: memory.type,
      content: memory.content,
      importance: memory.importance,
      source: memory.source,
      createdAt: memory.createdAt || Date.now(),
    })

    return NextResponse.json({ success: true, id: memory.id })
  } catch (error) {
    console.error('[API/db/memories] POST error:', error)
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 })
    }

    db.updateMemoryAccess(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/db/memories] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deleteAll = searchParams.get('all') === 'true'
    const memoryId = searchParams.get('id')

    if (deleteAll) {
      db.deleteAllMemories()
      return NextResponse.json({ success: true, deletedAll: true })
    }

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 })
    }

    db.deleteMemory(memoryId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/db/memories] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
  }
}
