/**
 * Local SQLite API route for folders
 * GET - Fetch all folders
 * POST - Create a folder
 * DELETE - Delete a folder
 */

import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db/sqlite'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const folders = db.getAllFolders()
    return NextResponse.json(folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at,
    })))
  } catch (error) {
    console.error('[API/db/folders] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const folder = await req.json()

    if (!folder.id || !folder.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    db.createFolder({
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt || Date.now(),
      updatedAt: folder.updatedAt || Date.now(),
    })

    return NextResponse.json({ success: true, id: folder.id })
  } catch (error) {
    console.error('[API/db/folders] POST error:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('id')

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID required' }, { status: 400 })
    }

    db.deleteFolder(folderId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/db/folders] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}
