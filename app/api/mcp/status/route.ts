import { NextResponse } from "next/server"
import { type ChildProcess } from "child_process"

export const runtime = "nodejs"

// Access the global MCP servers map
declare global {
  var mcpServers: Map<string, { process: ChildProcess; pid: number }>
}

interface ServerStatus {
  id: string
  pid: number
  running: boolean
}

/**
 * MCP Server Status API
 * Returns status of all running MCP servers
 */
export async function GET() {
  try {
    const servers: ServerStatus[] = []

    if (global.mcpServers) {
      for (const [id, entry] of global.mcpServers.entries()) {
        const { process: serverProcess, pid } = entry

        // Check if process is still alive
        const running = !serverProcess.killed && serverProcess.exitCode === null

        if (!running) {
          // Clean up dead entries
          global.mcpServers.delete(id)
        } else {
          servers.push({
            id,
            pid,
            running: true,
          })
        }
      }
    }

    return NextResponse.json({
      servers,
      count: servers.length,
    })
  } catch (error) {
    console.error("[MCP] Status check error:", error)
    return NextResponse.json(
      { error: "Failed to check server status" },
      { status: 500 }
    )
  }
}
