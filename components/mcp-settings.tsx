"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Puzzle,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Globe,
  Database,
  Clock,
  Play,
  Search,
  FileText,
  MessageSquare,
  Download,
  Upload,
  Code2,
  Music,
  CheckSquare,
  Video,
  Settings2,
  Cloud,
  Terminal,
  FolderOpen,
  Square,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getPlatform, type Platform } from "@/lib/platform"

// MCP Server configuration type
export interface MCPServerConfig {
  id: string
  name: string
  command: string
  args?: string
  env?: Record<string, string>
  status?: "connected" | "disconnected" | "connecting" | "error"
  enabled?: boolean
  description?: string
  category?: string
  pid?: number // Process ID when running locally
  error?: string // Error message if failed
  platform?: "darwin" | "win32" | "linux" | "all" // Platform restriction
}

// Preset MCP servers optimized for local deployment
const PRESET_MCP_SERVERS: Omit<MCPServerConfig, "id" | "status">[] = [
  // ==================== CORE & ESSENTIAL ====================
  {
    name: "Filesystem",
    command: "npx",
    args: "-y @modelcontextprotocol/server-filesystem ~/Documents",
    description: "Secure file operations - edit path to your preferred directory",
    category: "Core",
    enabled: true,
  },
  {
    name: "Memory",
    command: "npx",
    args: "-y @modelcontextprotocol/server-memory",
    description: "Knowledge graph-based persistent memory system",
    category: "Core",
    enabled: true,
  },
  {
    name: "Sequential Thinking",
    command: "npx",
    args: "-y @modelcontextprotocol/server-sequential-thinking",
    description: "Dynamic problem-solving through thought sequences",
    category: "Core",
    enabled: true,
  },
  {
    name: "Everything (Demo)",
    command: "npx",
    args: "-y @modelcontextprotocol/server-everything",
    description: "Reference server with prompts, resources and tools for testing",
    category: "Core",
    enabled: true,
  },

  // ==================== APPLE/MACOS NATIVE ====================
  {
    name: "Apple Native Apps",
    command: "bunx",
    args: "--no-cache apple-mcp@latest",
    description: "Contacts, Notes, Messages, Mail, Reminders, Calendar, Maps",
    category: "Apple",
    enabled: true,
    platform: "darwin",
  },
  {
    name: "Apple Reminders",
    command: "npx",
    args: "-y @shadowfax92/apple-reminders-mcp",
    description: "Create, list, complete and delete Apple Reminders",
    category: "Apple",
    enabled: true,
    platform: "darwin",
  },
  {
    name: "Apple Shortcuts",
    command: "npx",
    args: "-y @artemnovichkov/shortcuts-mcp",
    description: "List, view and run Apple Shortcuts automations",
    category: "Apple",
    enabled: true,
    platform: "darwin",
  },

  // ==================== SEARCH & WEB ====================
  {
    name: "Brave Search",
    command: "npx",
    args: "-y @modelcontextprotocol/server-brave-search",
    env: { BRAVE_API_KEY: "" },
    description: "Web search with Brave Search API (free tier available)",
    category: "Search",
    enabled: true,
  },
  {
    name: "Fetch",
    command: "npx",
    args: "-y @modelcontextprotocol/server-fetch",
    description: "Fetch and convert web content for LLM usage",
    category: "Web",
    enabled: true,
  },
  {
    name: "Puppeteer",
    command: "npx",
    args: "-y @modelcontextprotocol/server-puppeteer",
    description: "Browser automation and web scraping (requires Chrome)",
    category: "Web",
    enabled: true,
  },
  {
    name: "Playwright",
    command: "npx",
    args: "-y @playwright/mcp@latest",
    description: "Microsoft's browser automation for testing & scraping",
    category: "Web",
    enabled: true,
  },

  // ==================== DEVELOPMENT & CODE ====================
  {
    name: "Git",
    command: "npx",
    args: "-y @modelcontextprotocol/server-git --repository ~/Projects",
    description: "Git repository operations - edit path to your repo",
    category: "Development",
    enabled: true,
  },
  {
    name: "GitHub",
    command: "npx",
    args: "-y @modelcontextprotocol/server-github",
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" },
    description: "GitHub repos, issues, PRs, code search (needs PAT)",
    category: "Development",
    enabled: true,
  },
  {
    name: "GitLab",
    command: "npx",
    args: "-y @modelcontextprotocol/server-gitlab",
    env: { GITLAB_PERSONAL_ACCESS_TOKEN: "", GITLAB_API_URL: "https://gitlab.com/api/v4" },
    description: "GitLab projects, issues, merge requests",
    category: "Development",
    enabled: true,
  },
  {
    name: "Semgrep",
    command: "npx",
    args: "-y @semgrep/mcp",
    description: "Static code analysis and security scanning",
    category: "Development",
    enabled: true,
  },

  // ==================== DATABASES ====================
  {
    name: "PostgreSQL",
    command: "npx",
    args: "-y @modelcontextprotocol/server-postgres postgresql://localhost/mydb",
    description: "PostgreSQL database access - edit connection string",
    category: "Database",
    enabled: true,
  },
  {
    name: "SQLite",
    command: "npx",
    args: "-y @modelcontextprotocol/server-sqlite ~/data/database.db",
    description: "SQLite database query - edit path to your .db file",
    category: "Database",
    enabled: true,
  },
  {
    name: "DuckDB",
    command: "npx",
    args: "-y duckdb-mcp",
    description: "Fast analytical SQL database, great for CSV/Parquet",
    category: "Database",
    enabled: true,
  },
  {
    name: "Redis",
    command: "npx",
    args: "-y @modelcontextprotocol/server-redis redis://localhost:6379",
    description: "Redis key-value store operations",
    category: "Database",
    enabled: true,
  },
  {
    name: "Neo4j",
    command: "npx",
    args: "-y @neo4j/mcp-neo4j",
    env: { NEO4J_URI: "bolt://localhost:7687", NEO4J_USER: "neo4j", NEO4J_PASSWORD: "" },
    description: "Graph database with Cypher queries",
    category: "Database",
    enabled: true,
  },
  {
    name: "MongoDB",
    command: "npx",
    args: "-y @mongodb/mcp mongodb://localhost:27017",
    description: "MongoDB document database operations",
    category: "Database",
    enabled: true,
  },
  {
    name: "Chroma Vector DB",
    command: "npx",
    args: "-y @chroma/mcp",
    description: "Vector embeddings, semantic search, RAG storage",
    category: "Database",
    enabled: true,
  },

  // ==================== PRODUCTIVITY & NOTES ====================
  {
    name: "Obsidian",
    command: "npx",
    args: "-y mcp-obsidian ~/Documents/ObsidianVault",
    description: "Read and search Obsidian vault - edit vault path",
    category: "Productivity",
    enabled: true,
  },
  {
    name: "Notion",
    command: "npx",
    args: "-y @notionhq/mcp",
    env: { NOTION_API_KEY: "" },
    description: "Notion databases, pages and workspace management",
    category: "Productivity",
    enabled: true,
  },
  {
    name: "Todoist",
    command: "npx",
    args: "-y @doist/mcp-todoist",
    env: { TODOIST_API_TOKEN: "" },
    description: "Task management with Todoist",
    category: "Productivity",
    enabled: true,
  },
  {
    name: "Linear",
    command: "npx",
    args: "-y @linear/mcp",
    env: { LINEAR_API_KEY: "" },
    description: "Linear issue tracking and project management",
    category: "Productivity",
    enabled: true,
  },

  // ==================== GOOGLE WORKSPACE ====================
  {
    name: "Google Workspace",
    command: "npx",
    args: "-y mcp-google",
    env: { GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "" },
    description: "Gmail, Calendar, Contacts - full Google integration",
    category: "Google",
    enabled: true,
  },
  {
    name: "Google Drive",
    command: "npx",
    args: "-y @isaacphi/mcp-gdrive",
    env: { CLIENT_ID: "", CLIENT_SECRET: "" },
    description: "Google Drive files and Google Sheets editing",
    category: "Google",
    enabled: true,
  },

  // ==================== COMMUNICATION ====================
  {
    name: "Slack",
    command: "npx",
    args: "-y @modelcontextprotocol/server-slack",
    env: { SLACK_BOT_TOKEN: "", SLACK_TEAM_ID: "" },
    description: "Slack channels, messages and workspace access",
    category: "Communication",
    enabled: true,
  },
  {
    name: "Discord",
    command: "npx",
    args: "-y @discord/mcp",
    env: { DISCORD_BOT_TOKEN: "" },
    description: "Discord server, channel and message management",
    category: "Communication",
    enabled: true,
  },

  // ==================== MEDIA & MUSIC ====================
  {
    name: "Spotify",
    command: "npx",
    args: "-y @tdp2003/spotify-mcp@latest",
    env: { SPOTIFY_CLIENT_ID: "", SPOTIFY_CLIENT_SECRET: "", SPOTIFY_REDIRECT_URI: "http://127.0.0.1:8000/callback" },
    description: "Control Spotify playback, playlists, search (Premium needed)",
    category: "Media",
    enabled: true,
  },
  {
    name: "YouTube Music",
    command: "npx",
    args: "-y @instructa/mcp-youtube-music",
    env: { YOUTUBE_API_KEY: "" },
    description: "Search and play YouTube Music tracks",
    category: "Media",
    enabled: true,
  },

  // ==================== MATH & COMPUTATION ====================
  {
    name: "Calculator",
    command: "npx",
    args: "-y @wrtnlabs/calculator-mcp@latest",
    description: "Precise mathematical calculations",
    category: "Utilities",
    enabled: true,
  },
  {
    name: "Wolfram Alpha",
    command: "npx",
    args: "-y @henryhawke/wolfram-llm-mcp",
    env: { WOLFRAM_APP_ID: "" },
    description: "Complex math, science queries via Wolfram Alpha",
    category: "Utilities",
    enabled: true,
  },

  // ==================== UTILITIES ====================
  {
    name: "Time",
    command: "npx",
    args: "-y @modelcontextprotocol/server-time",
    description: "Time and timezone conversion",
    category: "Utilities",
    enabled: true,
  },
  {
    name: "Mermaid Diagrams",
    command: "npx",
    args: "-y @narasimhaponnada/mermaid-mcp-server",
    description: "Generate 22+ diagram types (flowcharts, sequences, etc.)",
    category: "Utilities",
    enabled: true,
  },
  {
    name: "QR Code",
    command: "npx",
    args: "-y @jwalsh/mcp-qrcode",
    description: "Generate and read QR codes",
    category: "Utilities",
    enabled: true,
  },
  {
    name: "PDF Reader",
    command: "npx",
    args: "-y @nicholasrq/pdf-mcp",
    description: "Extract text and data from PDF files",
    category: "Utilities",
    enabled: true,
  },

  // ==================== CLOUD STORAGE ====================
  {
    name: "AWS S3",
    command: "npx",
    args: "-y @aws/mcp-s3",
    env: { AWS_ACCESS_KEY_ID: "", AWS_SECRET_ACCESS_KEY: "", AWS_REGION: "us-east-1" },
    description: "Amazon S3 bucket and object operations",
    category: "Storage",
    enabled: true,
  },
  {
    name: "Cloudflare R2",
    command: "npx",
    args: "-y @cloudflare/mcp-r2",
    env: { CLOUDFLARE_ACCOUNT_ID: "", CLOUDFLARE_API_TOKEN: "" },
    description: "Cloudflare R2 storage operations",
    category: "Storage",
    enabled: true,
  },

  // ==================== AI & EMBEDDING ====================
  {
    name: "OpenAI",
    command: "npx",
    args: "-y @openai/mcp",
    env: { OPENAI_API_KEY: "" },
    description: "Direct OpenAI API access for embeddings, completions",
    category: "AI",
    enabled: true,
  },
  {
    name: "Anthropic",
    command: "npx",
    args: "-y @anthropic/mcp",
    env: { ANTHROPIC_API_KEY: "" },
    description: "Direct Anthropic Claude API access",
    category: "AI",
    enabled: true,
  },

  // ==================== HOME & IOT ====================
  {
    name: "Home Assistant",
    command: "npx",
    args: "-y @kevinmatz/homeassistant-mcp",
    env: { HA_URL: "http://homeassistant.local:8123", HA_TOKEN: "" },
    description: "Control smart home devices via Home Assistant",
    category: "Home",
    enabled: true,
  },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Core: <Zap className="h-4 w-4" />,
  Apple: <span className="text-sm">🍎</span>,
  Search: <Search className="h-4 w-4" />,
  Development: <Code2 className="h-4 w-4" />,
  Web: <Globe className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  Utilities: <Settings2 className="h-4 w-4" />,
  Communication: <MessageSquare className="h-4 w-4" />,
  Storage: <Cloud className="h-4 w-4" />,
  Productivity: <CheckSquare className="h-4 w-4" />,
  Media: <Music className="h-4 w-4" />,
  Google: <span className="text-sm">📧</span>,
  AI: <span className="text-sm">🤖</span>,
  Home: <span className="text-sm">🏠</span>,
}

const MCP_STORAGE_KEY = "chameleon-mcp-servers"

export function MCPSettings() {
  const [mcpServers, setMcpServers] = useState<MCPServerConfig[]>([])
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [showPresets, setShowPresets] = useState(true)
  const [newServerName, setNewServerName] = useState("")
  const [newServerCommand, setNewServerCommand] = useState("")
  const [newServerArgs, setNewServerArgs] = useState("")
  const [newServerEnv, setNewServerEnv] = useState("")
  const [mcpEnabled, setMcpEnabled] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [currentPlatform, setCurrentPlatform] = useState<Platform>("darwin")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Detect platform on mount
  useEffect(() => {
    setCurrentPlatform(getPlatform())
  }, [])

  // Load MCP servers from localStorage
  useEffect(() => {
    const savedServers = localStorage.getItem(MCP_STORAGE_KEY)
    if (savedServers) {
      try {
        const parsed = JSON.parse(savedServers)
        setMcpServers(parsed.servers || [])
        setMcpEnabled(parsed.enabled ?? false)
      } catch (e) {
        console.error("[MCP] Failed to load servers:", e)
      }
    }
  }, [])

  // Save MCP servers to localStorage
  const saveMcpServers = (servers: MCPServerConfig[], enabled?: boolean) => {
    setMcpServers(servers)
    const enabledValue = enabled !== undefined ? enabled : mcpEnabled
    localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify({ servers, enabled: enabledValue }))
  }

  const handleAddCustomServer = () => {
    if (!newServerName.trim() || !newServerCommand.trim()) return

    // Parse env vars from string (KEY=value format, one per line)
    let envVars: Record<string, string> | undefined
    if (newServerEnv.trim()) {
      envVars = {}
      newServerEnv.split("\n").forEach(line => {
        const [key, ...valueParts] = line.split("=")
        if (key && valueParts.length > 0) {
          envVars![key.trim()] = valueParts.join("=").trim()
        }
      })
    }

    const newServer: MCPServerConfig = {
      id: `mcp-custom-${Date.now()}`,
      name: newServerName.trim(),
      command: newServerCommand.trim(),
      args: newServerArgs.trim() || undefined,
      env: envVars,
      status: "disconnected",
      enabled: true,
      category: "Custom",
    }

    saveMcpServers([...mcpServers, newServer])
    setNewServerName("")
    setNewServerCommand("")
    setNewServerArgs("")
    setNewServerEnv("")
    setShowAddCustom(false)

    toast({
      title: "Server Added",
      description: `${newServer.name} has been added to your MCP servers.`,
    })
  }

  const handleAddPreset = (preset: Omit<MCPServerConfig, "id" | "status">) => {
    // Check if already added
    const existing = mcpServers.find(s => s.name === preset.name)
    if (existing) {
      toast({
        title: "Already Added",
        description: `${preset.name} is already in your server list.`,
        variant: "destructive",
      })
      return
    }

    const newServer: MCPServerConfig = {
      ...preset,
      id: `mcp-preset-${Date.now()}`,
      status: "disconnected",
    }

    saveMcpServers([...mcpServers, newServer])

    toast({
      title: "Server Added",
      description: preset.env
        ? `${preset.name} added. Configure the required API keys/tokens.`
        : `${preset.name} has been added.`,
    })
  }

  const handleRemoveServer = async (serverId: string) => {
    const server = mcpServers.find(s => s.id === serverId)

    // If server is running, stop it first
    if (server?.status === "connected" && server.pid) {
      await handleStopServer(serverId)
    }

    saveMcpServers(mcpServers.filter(s => s.id !== serverId))
    toast({
      title: "Server Removed",
      description: server?.name || "Server removed",
    })
  }

  const handleToggleServer = (serverId: string) => {
    saveMcpServers(mcpServers.map(s =>
      s.id === serverId ? { ...s, enabled: !s.enabled } : s
    ))
  }

  // Start MCP server process
  const handleStartServer = async (serverId: string) => {
    const server = mcpServers.find(s => s.id === serverId)
    if (!server) return

    // Update status to connecting
    saveMcpServers(mcpServers.map(s =>
      s.id === serverId ? { ...s, status: "connecting" as const, error: undefined } : s
    ))

    try {
      const response = await fetch("/api/mcp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: server.id,
          name: server.name,
          command: server.command,
          args: server.args,
          env: server.env,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        saveMcpServers(mcpServers.map(s =>
          s.id === serverId ? { ...s, status: "connected" as const, pid: result.pid } : s
        ))
        toast({
          title: "Server Started",
          description: `${server.name} is now running (PID: ${result.pid})`,
        })
      } else {
        saveMcpServers(mcpServers.map(s =>
          s.id === serverId ? { ...s, status: "error" as const, error: result.error } : s
        ))
        toast({
          title: "Failed to Start",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[MCP] Start error:", error)
      saveMcpServers(mcpServers.map(s =>
        s.id === serverId ? { ...s, status: "error" as const, error: String(error) } : s
      ))
      toast({
        title: "Connection Error",
        description: "Failed to communicate with MCP API",
        variant: "destructive",
      })
    }
  }

  // Stop MCP server process
  const handleStopServer = async (serverId: string) => {
    const server = mcpServers.find(s => s.id === serverId)
    if (!server?.pid) return

    try {
      const response = await fetch("/api/mcp/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: server.id, pid: server.pid }),
      })

      const result = await response.json()

      saveMcpServers(mcpServers.map(s =>
        s.id === serverId ? { ...s, status: "disconnected" as const, pid: undefined } : s
      ))

      if (response.ok) {
        toast({
          title: "Server Stopped",
          description: `${server.name} has been stopped`,
        })
      }
    } catch (error) {
      console.error("[MCP] Stop error:", error)
      // Still mark as disconnected even if API fails
      saveMcpServers(mcpServers.map(s =>
        s.id === serverId ? { ...s, status: "disconnected" as const, pid: undefined } : s
      ))
    }
  }

  const handleMcpToggle = async (enabled: boolean) => {
    setMcpEnabled(enabled)
    localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify({ servers: mcpServers, enabled }))

    if (!enabled) {
      // Stop all running servers when MCP is disabled
      for (const server of mcpServers) {
        if (server.status === "connected" && server.pid) {
          await handleStopServer(server.id)
        }
      }
    }

    toast({
      title: enabled ? "MCP Enabled" : "MCP Disabled",
      description: enabled
        ? "Model Context Protocol is now active. Start servers to use them."
        : "All MCP servers have been stopped.",
    })
  }

  // Update server env vars
  const handleUpdateEnv = (serverId: string, key: string, value: string) => {
    saveMcpServers(mcpServers.map(s => {
      if (s.id !== serverId) return s
      const newEnv = { ...s.env, [key]: value }
      return { ...s, env: newEnv }
    }))
  }

  // Export config as JSON
  const handleExport = () => {
    const config = {
      version: 1,
      enabled: mcpEnabled,
      servers: mcpServers.map(({ id, status, pid, error, ...rest }) => rest),
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chameleon-mcp-config-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Config Exported",
      description: "MCP configuration has been downloaded.",
    })
  }

  // Import config from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)

        if (!config.servers || !Array.isArray(config.servers)) {
          throw new Error("Invalid config format")
        }

        const existingNames = new Set(mcpServers.map(s => s.name))
        const newServers = config.servers
          .filter((s: MCPServerConfig) => !existingNames.has(s.name))
          .map((s: Omit<MCPServerConfig, "id" | "status">) => ({
            ...s,
            id: `mcp-imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            status: "disconnected" as const,
          }))

        if (newServers.length === 0) {
          toast({
            title: "No New Servers",
            description: "All servers in the config already exist.",
          })
          return
        }

        saveMcpServers([...mcpServers, ...newServers], config.enabled ?? mcpEnabled)
        setMcpEnabled(config.enabled ?? mcpEnabled)

        toast({
          title: "Config Imported",
          description: `Added ${newServers.length} new MCP server(s).`,
        })
      } catch (error) {
        console.error("[MCP] Import error:", error)
        toast({
          title: "Import Failed",
          description: "Invalid config file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const addedServerNames = new Set(mcpServers.map(s => s.name))

  // Filter presets by platform compatibility
  const platformCompatiblePresets = PRESET_MCP_SERVERS.filter(s => {
    // If no platform specified, it's available on all platforms
    if (!s.platform) return true
    // Check if matches current platform
    return s.platform === currentPlatform || s.platform === "all"
  })

  const categories = Array.from(new Set(platformCompatiblePresets.map(s => s.category || "Other")))
  const filteredPresets = categoryFilter
    ? platformCompatiblePresets.filter(s => s.category === categoryFilter)
    : platformCompatiblePresets

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* MCP Info & Enable Toggle */}
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Puzzle className="h-5 w-5 text-violet-500 flex-shrink-0" />
              <h3 className="font-semibold text-sm sm:text-base">Model Context Protocol</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Connect AI to local tools, files, databases and services.
            </p>
          </div>
          <Switch
            checked={mcpEnabled}
            onCheckedChange={handleMcpToggle}
            className="flex-shrink-0"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
          >
            Learn more <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
          <a
            href="https://github.com/modelcontextprotocol/servers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
          >
            Official Servers <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
          <Terminal className="h-3 w-3 inline mr-1" />
          Local deployment: Servers run as local processes via npx. Make sure Node.js is installed.
        </p>
      </div>

      {/* Import/Export Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10"
          onClick={handleExport}
          disabled={mcpServers.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Config
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Config
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {/* Active Servers */}
      {mcpServers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Configured Servers ({mcpServers.length})</h4>
          </div>
          <div className="space-y-2">
            {mcpServers.map((server) => (
              <div
                key={server.id}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border transition-all",
                  server.enabled ? "bg-card" : "bg-muted/50 opacity-60",
                  server.status === "error" && "border-red-500/30"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      server.status === "connected"
                        ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                        : server.status === "error"
                        ? "bg-gradient-to-br from-red-500/20 to-rose-500/20"
                        : server.enabled
                        ? "bg-gradient-to-br from-violet-500/20 to-purple-500/20"
                        : "bg-muted"
                    )}>
                      {CATEGORY_ICONS[server.category || "Core"] || <Puzzle className="h-5 w-5 text-violet-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{server.name}</p>
                        {server.category && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {server.category}
                          </Badge>
                        )}
                        {server.pid && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600">
                            PID: {server.pid}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate font-mono">
                        {server.command} {server.args}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pl-13 sm:pl-0">
                    {/* Status indicator */}
                    <div className="flex items-center gap-1.5">
                      {server.status === "connecting" ? (
                        <Loader2 className="h-3.5 w-3.5 text-yellow-500 animate-spin" />
                      ) : server.status === "connected" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : server.status === "error" ? (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    {/* Toggle */}
                    <Switch
                      checked={server.enabled}
                      onCheckedChange={() => handleToggleServer(server.id)}
                      className="scale-75"
                    />
                    {/* Start/Stop button */}
                    {server.status === "connected" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 sm:h-8 sm:w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleStopServer(server.id)}
                        disabled={!mcpEnabled}
                        title="Stop server"
                      >
                        <Square className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 sm:h-8 sm:w-8"
                        onClick={() => handleStartServer(server.id)}
                        disabled={server.status === "connecting" || !server.enabled || !mcpEnabled}
                        title="Start server"
                      >
                        <Play className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    )}
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveServer(server.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Error message */}
                {server.error && (
                  <p className="text-xs text-red-500 bg-red-500/10 rounded px-2 py-1">
                    {server.error}
                  </p>
                )}

                {/* Environment variables (if any) */}
                {server.env && Object.keys(server.env).length > 0 && (
                  <div className="pl-13 space-y-1.5">
                    {Object.entries(server.env).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground w-32 truncate flex-shrink-0">
                          {key}:
                        </Label>
                        <Input
                          type="password"
                          value={value}
                          onChange={(e) => handleUpdateEnv(server.id, key, e.target.value)}
                          placeholder={`Enter ${key}`}
                          className="h-7 text-xs font-mono flex-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Server */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-11"
          onClick={() => setShowAddCustom(!showAddCustom)}
        >
          {showAddCustom ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Add Custom Server
        </Button>

        {showAddCustom && (
          <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <Label htmlFor="server-name" className="text-sm">Server Name</Label>
              <Input
                id="server-name"
                placeholder="My Custom Server"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="server-command" className="text-sm">Command</Label>
              <Input
                id="server-command"
                placeholder="npx"
                value={newServerCommand}
                onChange={(e) => setNewServerCommand(e.target.value)}
                className="h-11 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="server-args" className="text-sm">Arguments</Label>
              <Input
                id="server-args"
                placeholder="-y @modelcontextprotocol/server-xxx /path"
                value={newServerArgs}
                onChange={(e) => setNewServerArgs(e.target.value)}
                className="h-11 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="server-env" className="text-sm">Environment Variables (optional)</Label>
              <textarea
                id="server-env"
                placeholder="API_KEY=your-key&#10;ANOTHER_VAR=value"
                value={newServerEnv}
                onChange={(e) => setNewServerEnv(e.target.value)}
                className="w-full h-20 px-3 py-2 text-sm font-mono rounded-md border bg-background resize-none"
              />
              <p className="text-[10px] text-muted-foreground">One per line: KEY=value</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="default"
                className="flex-1 h-11"
                onClick={() => {
                  setShowAddCustom(false)
                  setNewServerName("")
                  setNewServerCommand("")
                  setNewServerArgs("")
                  setNewServerEnv("")
                }}
              >
                Cancel
              </Button>
              <Button
                size="default"
                className="flex-1 h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                onClick={handleAddCustomServer}
                disabled={!newServerName.trim() || !newServerCommand.trim()}
              >
                Add Server
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Servers */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-11"
          onClick={() => setShowPresets(!showPresets)}
        >
          {showPresets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Browse Popular Servers ({platformCompatiblePresets.length})
        </Button>

        {showPresets && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            {/* Category Filter */}
            <div className="flex gap-1.5 flex-wrap">
              <Button
                variant={categoryFilter === null ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setCategoryFilter(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs gap-1"
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                >
                  {CATEGORY_ICONS[cat]}
                  <span className="hidden sm:inline">{cat}</span>
                </Button>
              ))}
            </div>

            {/* Preset Grid */}
            <div className="grid gap-2">
              {filteredPresets.map((preset, index) => {
                const isAdded = addedServerNames.has(preset.name)
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all",
                      isAdded ? "bg-green-500/5 border-green-500/30" : "bg-card hover:border-violet-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center flex-shrink-0">
                        {CATEGORY_ICONS[preset.category || "Core"] || <Puzzle className="h-5 w-5 text-violet-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{preset.name}</p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {preset.category}
                          </Badge>
                          {preset.env && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-yellow-600">
                              Needs Config
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={isAdded ? "ghost" : "secondary"}
                      size="sm"
                      className={cn(
                        "flex-shrink-0 h-10 sm:h-8 w-full sm:w-auto",
                        isAdded && "text-green-600"
                      )}
                      onClick={() => !isAdded && handleAddPreset(preset)}
                      disabled={isAdded}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {mcpServers.length === 0 && !showPresets && (
        <div className="text-center py-8 text-muted-foreground">
          <Puzzle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No MCP servers configured</p>
          <p className="text-xs mt-1">Add a server from the presets or create a custom one</p>
        </div>
      )}
    </div>
  )
}
