"use client"

import type React from "react"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Trash2, Download, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import type { ComparisonSession } from "@/types"

interface ComparisonHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadSession: (session: ComparisonSession) => void
}

export function ComparisonHistoryDialog({ open, onOpenChange, onLoadSession }: ComparisonHistoryDialogProps) {
  const { comparisonSessions, deleteComparisonSession, deleteAllComparisonSessions } = useApp()
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Möchten Sie diese Vergleichssitzung wirklich löschen?")) {
      deleteComparisonSession(sessionId)
    }
  }

  const handleDeleteAll = () => {
    if (deleteAllConfirm) {
      deleteAllComparisonSessions()
      setDeleteAllConfirm(false)
    } else {
      setDeleteAllConfirm(true)
      setTimeout(() => setDeleteAllConfirm(false), 3000)
    }
  }

  const handleLoadSession = (session: ComparisonSession) => {
    onLoadSession(session)
    onOpenChange(false)
  }

  const exportSession = (session: ComparisonSession, e: React.MouseEvent) => {
    e.stopPropagation()
    const dataStr = JSON.stringify(session, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    const title = session.messages?.[0]?.content?.slice(0, 30)?.replace(/\s+/g, "-") || "comparison"
    link.download = `vergleich-${title}-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            Vergleichs-Historie
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Gespeicherte Modellvergleiche laden oder löschen
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 flex-shrink-0">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {comparisonSessions.length} {comparisonSessions.length === 1 ? "Sitzung" : "Sitzungen"}
          </p>
          {comparisonSessions.length > 0 && (
            <Button
              variant={deleteAllConfirm ? "destructive" : "outline"}
              size="sm"
              onClick={handleDeleteAll}
              className="min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {deleteAllConfirm ? "Wirklich alle löschen?" : "Alle löschen"}
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 pr-2 sm:pr-4">
          {comparisonSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-8">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">Keine gespeicherten Vergleiche</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Vergleichssitzungen werden automatisch gespeichert, wenn Sie Nachrichten senden
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {comparisonSessions.map((session) => {
                const firstUserMessage = session.messages?.find((m) => m.role === "user")
                const title =
                  firstUserMessage?.content?.slice(0, 50) + (firstUserMessage?.content?.length > 50 ? "..." : "") ||
                  "Vergleichssitzung"

                return (
                  <div
                    key={session.id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors gap-3"
                    onClick={() => handleLoadSession(session)}
                  >
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="font-medium truncate text-sm sm:text-base">{title}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                        <span>{session.models?.length || 0} Modelle</span>
                        <span>{session.messages?.length || 0} Nachrichten</span>
                        <span className="hidden sm:inline">
                          {formatDistanceToNow(session.timestamp, { addSuffix: true, locale: de })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {session.models?.map((model, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {model.split("/")[1] || model}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => exportSession(session, e)}
                        title="Exportieren"
                        className="min-h-[44px] min-w-[44px]"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(session.id, e)}
                        className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
