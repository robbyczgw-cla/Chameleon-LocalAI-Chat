"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Server, CheckCircle2, XCircle } from "lucide-react"
import { mcpClient } from "@/lib/mcp-client"
import type { MCPServerConfig } from "@/types"
import { Badge } from "@/components/ui/badge"

export function MCPManager() {
  const { settings, updateSettings } = useApp()
  const [servers, setServers] = useState<MCPServerConfig[]>(settings.mcpServers || [])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newServer, setNewServer] = useState<Partial<MCPServerConfig>>({
    name: "",
    command: "",
    args: [],
    enabled: true,
  })

  useEffect(() => {
    // Initialize MCP servers
    servers.forEach((server) => {
      if (server.enabled) {
        mcpClient.addServer(server).catch(console.error)
      }
    })
  }, [])

  const handleAddServer = () => {
    if (!newServer.name || !newServer.command) return

    const server: MCPServerConfig = {
      id: `mcp-${Date.now()}`,
      name: newServer.name,
      command: newServer.command,
      args: newServer.args || [],
      env: newServer.env || {},
      enabled: newServer.enabled ?? true,
    }

    const updatedServers = [...servers, server]
    setServers(updatedServers)
    updateSettings({ mcpServers: updatedServers })

    if (server.enabled) {
      mcpClient.addServer(server).catch(console.error)
    }

    setNewServer({ name: "", command: "", args: [], enabled: true })
    setIsAddDialogOpen(false)
  }

  const handleToggleServer = async (serverId: string) => {
    const updatedServers = servers.map((s) => {
      if (s.id === serverId) {
        const enabled = !s.enabled
        if (enabled) {
          mcpClient.addServer({ ...s, enabled }).catch(console.error)
        } else {
          mcpClient.disconnectServer(serverId).catch(console.error)
        }
        return { ...s, enabled }
      }
      return s
    })
    setServers(updatedServers)
    updateSettings({ mcpServers: updatedServers })
  }

  const handleDeleteServer = (serverId: string) => {
    mcpClient.disconnectServer(serverId).catch(console.error)
    const updatedServers = servers.filter((s) => s.id !== serverId)
    setServers(updatedServers)
    updateSettings({ mcpServers: updatedServers })
  }

  const availableTools = mcpClient.getAvailableTools()
  const availableResources = mcpClient.getAvailableResources()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">MCP Servers</h3>
          <p className="text-sm text-muted-foreground">Manage Model Context Protocol servers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add MCP Server</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                  id="server-name"
                  placeholder="My MCP Server"
                  value={newServer.name}
                  onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-command">Command</Label>
                <Input
                  id="server-command"
                  placeholder="npx -y @modelcontextprotocol/server-filesystem"
                  value={newServer.command}
                  onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-args">Arguments (comma-separated)</Label>
                <Input
                  id="server-args"
                  placeholder="/path/to/directory"
                  onChange={(e) => setNewServer({ ...newServer, args: e.target.value.split(",").map((a) => a.trim()) })}
                />
              </div>
              <Button onClick={handleAddServer} className="w-full">
                Add Server
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {servers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                No MCP servers configured. Add one to get started.
              </div>
            </CardContent>
          </Card>
        ) : (
          servers.map((server) => (
            <Card key={server.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{server.name}</CardTitle>
                      <CardDescription className="text-xs">{server.command}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {server.enabled ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                    <Switch checked={server.enabled} onCheckedChange={() => handleToggleServer(server.id)} />
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteServer(server.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {availableTools.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Available Tools ({availableTools.length})</h4>
          <div className="grid gap-2">
            {availableTools.map(({ serverId, tool }) => (
              <Card key={`${serverId}-${tool.name}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {availableResources.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Available Resources ({availableResources.length})</h4>
          <div className="grid gap-2">
            {availableResources.map(({ serverId, resource }) => (
              <Card key={`${serverId}-${resource.uri}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm">{resource.name}</div>
                      <div className="text-xs text-muted-foreground">{resource.uri}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
