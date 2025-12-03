"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, FileImage, FileIcon, Eye, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFileCategory, formatFileSize, type FileAttachment } from "@/lib/file-handler"
import { FilePreviewModal } from "./file-preview-modal"

interface FilePreviewInlineProps {
  file: FileAttachment
  onRemove?: (fileId: string) => void
  showRemove?: boolean
  compact?: boolean
}

export function FilePreviewInline({
  file,
  onRemove,
  showRemove = false,
  compact = false,
}: FilePreviewInlineProps) {
  const [showModal, setShowModal] = useState(false)
  const category = getFileCategory(file.name)

  const getIcon = () => {
    switch (category) {
      case "text":
        return <FileText className="h-4 w-4" />
      case "image":
        return <FileImage className="h-4 w-4" />
      case "document":
        return <FileIcon className="h-4 w-4" />
      default:
        return <FileIcon className="h-4 w-4" />
    }
  }

  if (compact) {
    return (
      <>
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors",
            showRemove && "pr-1"
          )}
          onClick={() => setShowModal(true)}
        >
          {getIcon()}
          <span className="max-w-[150px] truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            ({formatFileSize(file.size)})
          </span>
          {showRemove && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-1 hover:bg-destructive/20"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(file.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <FilePreviewModal file={file} open={showModal} onOpenChange={setShowModal} />
      </>
    )
  }

  return (
    <>
      <div className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all">
        {/* Preview area */}
        <div
          className="relative cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          {category === "image" && file.dataUrl ? (
            <div className="relative aspect-video bg-muted">
              <img
                src={file.dataUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted/30 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  {getIcon()}
                </div>
                <p className="text-xs text-muted-foreground">Click to preview</p>
              </div>
            </div>
          )}
        </div>

        {/* File info */}
        <div className="p-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} • {category}
              </p>
            </div>
            {showRemove && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(file.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <FilePreviewModal file={file} open={showModal} onOpenChange={setShowModal} />
    </>
  )
}
