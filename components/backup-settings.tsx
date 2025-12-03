"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Download,
  Upload,
  Trash2,
  HardDrive,
  Clock,
  FileJson,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  RefreshCw,
} from "lucide-react"
import { useApp } from "@/contexts/app-context"

interface BackupInfo {
  id: string
  filename: string
  createdAt: string
  size: number
  contents: string[]
  corrupted?: boolean
}

export function BackupSettings() {
  const { chats, settings, personas } = useApp()
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [backupDir, setBackupDir] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load backup list on mount
  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/backup?action=list")
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
        setBackupDir(data.backupDir || "")
      }
    } catch (error) {
      console.error("[Backup] Failed to load backups:", error)
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    setCreating(true)
    try {
      // Gather all data to backup
      const backupData = {
        chats: chats || [],
        settings: settings || {},
        personas: personas || [],
        // Add more data sources as needed
        localStorage: {
          mcpServers: localStorage.getItem("chameleon-mcp-servers"),
          theme: localStorage.getItem("theme"),
        },
      }

      const response = await fetch("/api/backup?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Backup Created",
          description: `Saved to ${data.backupId}.json`,
        })
        loadBackups() // Refresh list
      } else {
        const error = await response.json()
        toast({
          title: "Backup Failed",
          description: error.error || "Failed to create backup",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Backup] Create error:", error)
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup?action=download&id=${backupId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${backupId}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Download Started",
          description: `Downloading ${backupId}.json`,
        })
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download backup",
        variant: "destructive",
      })
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) return

    try {
      const response = await fetch(`/api/backup?id=${backupId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Backup Deleted",
          description: `Removed ${backupId}`,
        })
        loadBackups()
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete backup",
        variant: "destructive",
      })
    }
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setRestoring(true)
    try {
      const content = await file.text()
      const backup = JSON.parse(content)

      // Validate backup
      if (!backup.metadata?.version) {
        toast({
          title: "Invalid Backup",
          description: "This file is not a valid Chameleon backup",
          variant: "destructive",
        })
        return
      }

      // Show confirmation
      const contents = backup.metadata.contents?.join(", ") || "unknown"
      if (!confirm(`Restore backup from ${backup.metadata.createdAt}?\n\nContents: ${contents}\n\nThis will merge with your existing data.`)) {
        return
      }

      // Send to API for processing
      const response = await fetch("/api/backup?action=restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup }),
      })

      if (response.ok) {
        const data = await response.json()

        // Restore localStorage items
        if (backup.localStorage) {
          Object.entries(backup.localStorage).forEach(([key, value]) => {
            if (value) localStorage.setItem(key, value as string)
          })
        }

        toast({
          title: "Restore Complete",
          description: `Restored: ${data.metadata.contents.join(", ")}. Refresh the page to see changes.`,
        })

        // Offer to refresh
        if (confirm("Refresh page to apply restored data?")) {
          window.location.reload()
        }
      } else {
        const error = await response.json()
        toast({
          title: "Restore Failed",
          description: error.error || "Failed to restore backup",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Backup] Restore error:", error)
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Invalid backup file",
        variant: "destructive",
      })
    } finally {
      setRestoring(false)
      event.target.value = ""
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <HardDrive className="h-5 w-5 text-emerald-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold">Backup & Restore</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Export all your chats, settings, personas, and memories. Backups are stored locally in{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">~/.chameleon-backups</code>
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={createBackup}
          disabled={creating}
          className="h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Create Backup
        </Button>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={restoring}
          className="h-12"
        >
          {restoring ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Restore from File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileImport}
        />
      </div>

      {/* Backup List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Saved Backups ({backups.length})</h4>
          <Button variant="ghost" size="sm" onClick={loadBackups} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
            <p className="text-sm">Loading backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileJson className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No backups yet</p>
              <p className="text-xs mt-1">Create your first backup to protect your data</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <Card key={backup.id} className={backup.corrupted ? "border-red-500/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {backup.corrupted ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                        <span className="font-medium text-sm truncate">{backup.id}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {formatSize(backup.size)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(backup.createdAt)}
                      </div>
                      {backup.contents.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {backup.contents.map((item) => (
                            <Badge key={item} variant="outline" className="text-[10px]">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => downloadBackup(backup.id)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteBackup(backup.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Backup Location */}
      {backupDir && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <FolderOpen className="h-3 w-3" />
          <span className="truncate">{backupDir}</span>
        </div>
      )}
    </div>
  )
}
