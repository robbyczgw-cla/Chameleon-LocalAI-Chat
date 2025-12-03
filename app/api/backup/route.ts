import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readFile, mkdir, readdir, stat, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import os from "os"

export const runtime = "nodejs"

// Backup directory
const BACKUP_DIR = path.join(os.homedir(), ".chameleon-backups")

interface BackupMetadata {
  version: number
  createdAt: string
  appVersion: string
  platform: string
  contents: string[]
}

/**
 * Backup & Restore API
 * Full data export/import for local deployment
 *
 * Exports:
 * - All chats and messages
 * - Settings and preferences
 * - Personas
 * - Document collections
 * - AI memories
 * - Folders
 *
 * Security:
 * - Backups stored locally in ~/.chameleon-backups
 * - No cloud upload unless user explicitly shares the file
 * - Optional encryption (future feature)
 */

// GET - List backups or download specific backup
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const backupId = searchParams.get("id")
  const action = searchParams.get("action") || "list"

  try {
    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true })
    }

    if (action === "list") {
      // List all backups
      const files = await readdir(BACKUP_DIR)
      const backups = await Promise.all(
        files
          .filter((f) => f.endsWith(".json"))
          .map(async (f) => {
            const filePath = path.join(BACKUP_DIR, f)
            const stats = await stat(filePath)
            try {
              const content = await readFile(filePath, "utf-8")
              const data = JSON.parse(content)
              return {
                id: f.replace(".json", ""),
                filename: f,
                createdAt: data.metadata?.createdAt || stats.birthtime.toISOString(),
                size: stats.size,
                contents: data.metadata?.contents || [],
              }
            } catch {
              return {
                id: f.replace(".json", ""),
                filename: f,
                createdAt: stats.birthtime.toISOString(),
                size: stats.size,
                contents: [],
                corrupted: true,
              }
            }
          })
      )

      // Sort by date, newest first
      backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return NextResponse.json({
        backups,
        backupDir: BACKUP_DIR,
        count: backups.length,
      })
    }

    if (action === "download" && backupId) {
      // Download specific backup
      const filePath = path.join(BACKUP_DIR, `${backupId}.json`)

      if (!existsSync(filePath)) {
        return NextResponse.json(
          { error: "Backup not found" },
          { status: 404 }
        )
      }

      const content = await readFile(filePath, "utf-8")
      return new NextResponse(content, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${backupId}.json"`,
        },
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[Backup] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Backup operation failed" },
      { status: 500 }
    )
  }
}

// POST - Create backup or restore from backup
export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const action = searchParams.get("action") || "create"

  try {
    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true })
    }

    if (action === "create") {
      // Create new backup from provided data
      const data = await req.json()

      const backupId = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
      const metadata: BackupMetadata = {
        version: 1,
        createdAt: new Date().toISOString(),
        appVersion: "1.0.0",
        platform: process.platform,
        contents: Object.keys(data).filter((k) => data[k] && (Array.isArray(data[k]) ? data[k].length > 0 : true)),
      }

      const backup = {
        metadata,
        ...data,
      }

      const filePath = path.join(BACKUP_DIR, `${backupId}.json`)
      await writeFile(filePath, JSON.stringify(backup, null, 2))

      console.log(`[Backup] Created: ${backupId}`)

      return NextResponse.json({
        success: true,
        backupId,
        filePath,
        metadata,
      })
    }

    if (action === "restore") {
      // Restore from uploaded backup file
      const data = await req.json()

      if (!data.backup) {
        return NextResponse.json(
          { error: "No backup data provided" },
          { status: 400 }
        )
      }

      // Validate backup structure
      const backup = typeof data.backup === "string" ? JSON.parse(data.backup) : data.backup

      if (!backup.metadata?.version) {
        return NextResponse.json(
          { error: "Invalid backup format" },
          { status: 400 }
        )
      }

      // Return the parsed data for the client to restore
      return NextResponse.json({
        success: true,
        data: {
          chats: backup.chats || [],
          settings: backup.settings || null,
          personas: backup.personas || [],
          collections: backup.collections || [],
          memories: backup.memories || [],
          folders: backup.folders || [],
        },
        metadata: backup.metadata,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[Backup] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Backup operation failed" },
      { status: 500 }
    )
  }
}

// DELETE - Remove a backup
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const backupId = searchParams.get("id")

  if (!backupId) {
    return NextResponse.json(
      { error: "Backup ID required" },
      { status: 400 }
    )
  }

  try {
    const filePath = path.join(BACKUP_DIR, `${backupId}.json`)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      )
    }

    await unlink(filePath)
    console.log(`[Backup] Deleted: ${backupId}`)

    return NextResponse.json({
      success: true,
      deleted: backupId,
    })
  } catch (error) {
    console.error("[Backup] Delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    )
  }
}
