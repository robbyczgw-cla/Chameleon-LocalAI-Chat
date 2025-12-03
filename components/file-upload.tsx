"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, Upload, Loader2 } from "lucide-react"
import { processFile, type FileAttachment } from "@/lib/file-handler"
import { useToast } from "@/hooks/use-toast"
import { FilePreviewInline } from "@/components/file-preview-inline"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFilesChange: (files: FileAttachment[]) => void
  files: FileAttachment[]
}

export function FileUpload({ onFilesChange, files }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = async (fileList: FileList) => {
    const selectedFiles = Array.from(fileList)
    if (selectedFiles.length === 0) return

    setIsProcessing(true)

    try {
      const processedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          try {
            return await processFile(file)
          } catch (error) {
            toast({
              title: "File processing failed",
              description: error instanceof Error ? error.message : "Unknown error",
              variant: "destructive",
            })
            return null
          }
        }),
      )

      const validFiles = processedFiles.filter((f): f is FileAttachment => f !== null)
      onFilesChange([...files, ...validFiles])

      if (validFiles.length > 0) {
        toast({
          title: "Files attached",
          description: `${validFiles.length} file(s) attached successfully`,
        })
      }
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId))
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf"
      />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 md:h-8 md:w-8 rounded-lg hover:scale-105 transition-all"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        title="Attach files"
      >
        {isProcessing ? (
          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
        ) : (
          <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
        )}
      </Button>

      {files.length > 0 && (
        <div
          className={cn(
            "absolute bottom-full left-0 right-0 mb-3 p-3 bg-background/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-lg transition-all",
            isDragging && "border-primary/50 bg-primary/5"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-xl border-2 border-dashed border-primary z-10">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-primary">Drop files here</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              {files.length} file{files.length > 1 ? 's' : ''} attached
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
            {files.map((file) => (
              <FilePreviewInline
                key={file.id}
                file={file}
                onRemove={handleRemoveFile}
                showRemove={true}
                compact={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
