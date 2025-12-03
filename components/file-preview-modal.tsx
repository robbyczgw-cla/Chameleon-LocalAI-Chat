"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getFileCategory, formatFileSize, type FileAttachment } from "@/lib/file-handler"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FilePreviewModalProps {
  file: FileAttachment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilePreviewModal({ file, open, onOpenChange }: FilePreviewModalProps) {
  const [zoom, setZoom] = useState(100)
  const [copied, setCopied] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  if (!file) return null

  const category = getFileCategory(file.name)
  const isDarkMode = document.documentElement.classList.contains('dark')

  const handleCopy = async () => {
    if (file.content) {
      await navigator.clipboard.writeText(file.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (file.dataUrl) {
      const link = document.createElement('a')
      link.href = file.dataUrl
      link.download = file.name
      link.click()
    }
  }

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf(".") + 1)
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      java: "java",
      css: "css",
      html: "html",
      json: "json",
      md: "markdown",
      xml: "xml",
      txt: "text",
    }
    return languageMap[ext] || "text"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">
                {file.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatFileSize(file.size)} • {category}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {category === "image" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              {category === "text" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[calc(90vh-8rem)]">
          <div className="p-6">
            {category === "image" && file.dataUrl && (
              <div className="flex items-center justify-center">
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                />
              </div>
            )}

            {category === "text" && (
              <div className="rounded-lg overflow-hidden border">
                <SyntaxHighlighter
                  language={getLanguageFromFileName(file.name)}
                  style={isDarkMode ? vscDarkPlus : vs}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                  wrapLines
                  wrapLongLines
                >
                  {file.content}
                </SyntaxHighlighter>
              </div>
            )}

            {category === "document" && file.dataUrl && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    PDF Preview (Browser native viewer)
                  </p>
                  <object
                    data={file.dataUrl}
                    type="application/pdf"
                    className="w-full h-[600px] rounded-lg"
                  >
                    <div className="flex flex-col items-center gap-4 p-8">
                      <p className="text-sm">
                        PDF preview not available in this browser.
                      </p>
                      <Button onClick={handleDownload} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </object>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
