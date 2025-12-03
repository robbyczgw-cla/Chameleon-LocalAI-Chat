/**
 * System Prompts API Route
 * Local SQLite storage for system prompts
 */

import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db/sqlite'

export const dynamic = 'force-dynamic'

// GET - Fetch all system prompts
export async function GET() {
  try {
    const rows = db.getAllSystemPrompts()
    const prompts = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      prompt: row.prompt,
      isDefault: row.is_default === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    return NextResponse.json(prompts)
  } catch (error) {
    console.error('[API/system-prompts] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch system prompts' }, { status: 500 })
  }
}

// POST - Create new system prompt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, description, prompt, isDefault } = body

    if (!id || !name || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const now = Date.now()
    db.createSystemPrompt({
      id,
      name,
      description,
      prompt,
      isDefault,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/system-prompts] POST error:', error)
    return NextResponse.json({ error: 'Failed to create system prompt' }, { status: 500 })
  }
}

// PUT - Update system prompt
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, description, prompt, isDefault } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing prompt id' }, { status: 400 })
    }

    // Handle setting default separately
    if (isDefault === true) {
      db.setDefaultSystemPrompt(id)
    }

    db.updateSystemPrompt(id, {
      name,
      description,
      prompt,
      isDefault,
      updatedAt: Date.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/system-prompts] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update system prompt' }, { status: 500 })
  }
}

// DELETE - Delete system prompt
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing prompt id' }, { status: 400 })
    }

    db.deleteSystemPrompt(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/system-prompts] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete system prompt' }, { status: 500 })
  }
}
