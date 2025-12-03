"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Download, FileText, Share2, Globe } from "lucide-react"
import { useApp } from "@/contexts/app-context"

interface QuickActionsMenuProps {
  onDocCollectionsClick?: () => void
}

export function QuickActionsMenu({
  onDocCollectionsClick,
}: QuickActionsMenuProps) {
  const { chats, currentChatId } = useApp()
  const currentChat = chats.find((c) => c.id === currentChatId)

  const handleExportMarkdown = () => {
    if (!currentChat) return

    let markdown = `# ${currentChat.title}\n\n`
    markdown += `*Exported: ${new Date().toLocaleString()}*\n\n`
    markdown += `---\n\n`

    currentChat.messages.forEach((msg) => {
      const role = msg.role === "user" ? "👤 User" : "🤖 Assistant"
      markdown += `### ${role}\n\n`
      markdown += `${msg.content}\n\n`
      markdown += `---\n\n`
    })

    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, "_")}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJSON = () => {
    if (!currentChat) return

    const json = JSON.stringify(currentChat, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportHTML = () => {
    if (!currentChat) return

    const theme = localStorage.getItem("chameleon-theme") || "light"
    const isDark = theme === "dark"

    let html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentChat.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      padding: 2rem;
      background: ${isDark ? '#0f172a' : '#f8fafc'};
      color: ${isDark ? '#e2e8f0' : '#1e293b'};
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .meta {
      color: ${isDark ? '#94a3b8' : '#64748b'};
      font-size: 0.875rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid ${isDark ? '#334155' : '#e2e8f0'};
    }
    .message {
      margin: 1.5rem 0;
      padding: 1.5rem;
      border-radius: 12px;
      background: ${isDark ? '#1e293b' : '#ffffff'};
      border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .message-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .user { color: #3b82f6; }
    .assistant { color: #8b5cf6; }
    .message-content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    code {
      background: ${isDark ? '#0f172a' : '#f1f5f9'};
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }
    pre {
      background: ${isDark ? '#0f172a' : '#f1f5f9'};
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    pre code {
      background: none;
      padding: 0;
    }
  </style>
</head>
<body>
  <h1>${currentChat.title}</h1>
  <div class="meta">
    Exportiert: ${new Date().toLocaleString('de-DE')} • ${currentChat.messages.length} Nachrichten
  </div>
`

    currentChat.messages.forEach((msg) => {
      const roleClass = msg.role === "user" ? "user" : "assistant"
      const roleIcon = msg.role === "user" ? "👤" : "🤖"
      const roleName = msg.role === "user" ? "User" : "Assistant"

      html += `  <div class="message">
    <div class="message-header ${roleClass}">
      <span>${roleIcon}</span>
      <span>${roleName}</span>
    </div>
    <div class="message-content">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
`
    })

    html += `</body>
</html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, "_")}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyShareLink = () => {
    // For now, just copy chat ID - could be enhanced with actual sharing
    if (!currentChat) return

    const shareText = `Check out this chat: ${currentChat.title}`
    navigator.clipboard.writeText(shareText)

    // Show toast notification would be nice here
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 h-9 w-9 sm:h-10 sm:w-10 hover:scale-105 transition-all rounded-lg"
          title="Weitere Aktionen"
        >
          <MoreVertical className="h-4 w-4 md:h-4.5 md:w-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export & Teilen</DropdownMenuLabel>

        <DropdownMenuItem onClick={handleExportHTML} disabled={!currentChat}>
          <Globe className="h-4 w-4 mr-2" />
          Als HTML exportieren
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportMarkdown} disabled={!currentChat}>
          <FileText className="h-4 w-4 mr-2" />
          Als Markdown exportieren
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportJSON} disabled={!currentChat}>
          <Download className="h-4 w-4 mr-2" />
          Als JSON exportieren
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopyShareLink} disabled={!currentChat}>
          <Share2 className="h-4 w-4 mr-2" />
          Chat-Link kopieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
