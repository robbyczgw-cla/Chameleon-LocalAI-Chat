export interface MCPServer {
  id: string
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  enabled: boolean
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface MCPPrompt {
  name: string
  description?: string
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
}

export class MCPClient {
  private servers: Map<string, MCPServer> = new Map()
  private tools: Map<string, MCPTool[]> = new Map()
  private resources: Map<string, MCPResource[]> = new Map()
  private prompts: Map<string, MCPPrompt[]> = new Map()

  async addServer(server: MCPServer): Promise<void> {
    this.servers.set(server.id, server)
    if (server.enabled) {
      await this.connectServer(server.id)
    }
  }

  async connectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }

    try {
      console.log(`Connecting to MCP server: ${server.name}`)

      // Call backend API to connect to MCP server
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          serverId: server.id,
          serverConfig: {
            command: server.command,
            args: server.args,
            env: server.env,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`MCP server ${server.name} connected:`, result)

      // Fetch server capabilities after connecting
      await this.fetchServerCapabilities(serverId)
    } catch (error) {
      console.error(`Failed to connect to server ${serverId}:`, error)
      throw error
    }
  }

  private async fetchServerCapabilities(serverId: string): Promise<void> {
    try {
      // Fetch tools from MCP server
      const toolsResponse = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "listTools",
          serverId,
        }),
      })

      if (toolsResponse.ok) {
        const { tools } = await toolsResponse.json()
        this.tools.set(serverId, tools || [])
      }

      // Fetch resources from MCP server
      const resourcesResponse = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "listResources",
          serverId,
        }),
      })

      if (resourcesResponse.ok) {
        const { resources } = await resourcesResponse.json()
        this.resources.set(serverId, resources || [])
      }

      // Set empty prompts for now (can be extended later)
      this.prompts.set(serverId, [])
    } catch (error) {
      console.error(`Failed to fetch capabilities for ${serverId}:`, error)
      // Set empty arrays on error
      this.tools.set(serverId, [])
      this.resources.set(serverId, [])
      this.prompts.set(serverId, [])
    }
  }

  async disconnectServer(serverId: string): Promise<void> {
    this.tools.delete(serverId)
    this.resources.delete(serverId)
    this.prompts.delete(serverId)
  }

  async callTool(serverId: string, toolName: string, args: Record<string, any>): Promise<any> {
    const server = this.servers.get(serverId)
    if (!server || !server.enabled) {
      throw new Error(`Server ${serverId} not available`)
    }

    try {
      console.log(`Calling tool ${toolName} on server ${serverId} with args:`, args)

      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "callTool",
          serverId,
          toolName,
          toolArgs: args,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to call tool: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Failed to call tool ${toolName}:`, error)
      throw error
    }
  }

  async readResource(serverId: string, uri: string): Promise<any> {
    const server = this.servers.get(serverId)
    if (!server || !server.enabled) {
      throw new Error(`Server ${serverId} not available`)
    }

    try {
      console.log(`Reading resource ${uri} from server ${serverId}`)

      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "readResource",
          serverId,
          resourceUri: uri,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to read resource: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Failed to read resource ${uri}:`, error)
      throw error
    }
  }

  getAvailableTools(): Array<{ serverId: string; tool: MCPTool }> {
    const allTools: Array<{ serverId: string; tool: MCPTool }> = []
    for (const [serverId, tools] of this.tools.entries()) {
      const server = this.servers.get(serverId)
      if (server?.enabled) {
        tools.forEach((tool) => allTools.push({ serverId, tool }))
      }
    }
    return allTools
  }

  getAvailableResources(): Array<{ serverId: string; resource: MCPResource }> {
    const allResources: Array<{ serverId: string; resource: MCPResource }> = []
    for (const [serverId, resources] of this.resources.entries()) {
      const server = this.servers.get(serverId)
      if (server?.enabled) {
        resources.forEach((resource) => allResources.push({ serverId, resource }))
      }
    }
    return allResources
  }

  getAvailablePrompts(): Array<{ serverId: string; prompt: MCPPrompt }> {
    const allPrompts: Array<{ serverId: string; prompt: MCPPrompt }> = []
    for (const [serverId, prompts] of this.prompts.entries()) {
      const server = this.servers.get(serverId)
      if (server?.enabled) {
        prompts.forEach((prompt) => allPrompts.push({ serverId, prompt }))
      }
    }
    return allPrompts
  }

  getServers(): MCPServer[] {
    return Array.from(this.servers.values())
  }
}

// Global MCP client instance
export const mcpClient = new MCPClient()
