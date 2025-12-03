/**
 * Local SQLite API route for settings
 * GET - Fetch settings
 * POST/PUT - Save settings
 */

import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db/sqlite'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = db.getSettings()
    return NextResponse.json(settings || {})
  } catch (error) {
    console.error('[API/db/settings] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const settings = await req.json()
    db.saveSettings(settings)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/db/settings] POST error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  // Alias for POST
  return POST(req)
}
