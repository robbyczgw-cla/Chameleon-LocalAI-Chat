import { type NextRequest, NextResponse } from "next/server"
import { type ChildProcess } from "child_process"

export const runtime = "nodejs"

// Access the global MCP servers map
declare global {
  var mcpServers: Map<string, { process: ChildProcess; pid: number }>
}

interface StopServerRequest {
  id: string
  pid?: number
}

/**
 * MCP Server Stop API
 * Stops a running MCP server process
 */
export async function POST(req: NextRequest) {
  try {
    const body: StopServerRequest = await req.json()
    const { id, pid } = body

    if (!id) {
      return NextResponse.json(
        { error: "Server ID is required" },
        { status: 400 }
      )
    }

    // Try to find the server in our map
    const serverEntry = global.mcpServers?.get(id)

    if (serverEntry) {
      const { process: serverProcess, pid: storedPid } = serverEntry

      try {
        // Kill the process
        if (!serverProcess.killed) {
          serverProcess.kill("SIGTERM")

          // Give it a moment to terminate gracefully
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Force kill if still running
          if (!serverProcess.killed) {
            serverProcess.kill("SIGKILL")
          }
        }

        // Remove from map
        global.mcpServers.delete(id)

        console.log(`[MCP] Server "${id}" stopped (PID: ${storedPid})`)

        return NextResponse.json({
          success: true,
          id,
          pid: storedPid,
          message: `Server stopped successfully`,
        })
      } catch (killError) {
        console.error(`[MCP] Error killing process:`, killError)
        // Still remove from map
        global.mcpServers.delete(id)
      }
    }

    // If we have a PID but no entry in map, try to kill by PID
    if (pid) {
      try {
        process.kill(pid, "SIGTERM")

        // Give it a moment
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Try force kill
        try {
          process.kill(pid, "SIGKILL")
        } catch {
          // Process may have already exited
        }

        console.log(`[MCP] Killed process by PID: ${pid}`)

        return NextResponse.json({
          success: true,
          id,
          pid,
          message: `Process killed by PID`,
        })
      } catch (error) {
        // Process doesn't exist or can't be killed
        console.log(`[MCP] Process ${pid} not found or already terminated`)
      }
    }

    // Server wasn't running or already stopped
    return NextResponse.json({
      success: true,
      id,
      message: "Server was not running",
    })
  } catch (error) {
    console.error("[MCP] Stop server error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to stop server" },
      { status: 500 }
    )
  }
}
