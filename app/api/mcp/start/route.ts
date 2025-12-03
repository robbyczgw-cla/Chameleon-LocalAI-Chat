import { type NextRequest, NextResponse } from "next/server"
import { spawn, type ChildProcess } from "child_process"

export const runtime = "nodejs"

// Store running MCP server processes (in-memory for this server instance)
// In production, you might want to use a more persistent solution
const runningServers: Map<string, { process: ChildProcess; pid: number }> = new Map()

// Make it available globally for the stop endpoint
declare global {
  var mcpServers: Map<string, { process: ChildProcess; pid: number }>
}

if (!global.mcpServers) {
  global.mcpServers = new Map()
}

interface StartServerRequest {
  id: string
  name: string
  command: string
  args?: string
  env?: Record<string, string>
}

/**
 * MCP Server Start API
 * Spawns a local MCP server process
 */
export async function POST(req: NextRequest) {
  try {
    const body: StartServerRequest = await req.json()
    const { id, name, command, args, env } = body

    if (!id || !command) {
      return NextResponse.json(
        { error: "Server ID and command are required" },
        { status: 400 }
      )
    }

    // Check if server is already running
    if (global.mcpServers.has(id)) {
      const existing = global.mcpServers.get(id)
      if (existing?.process && !existing.process.killed) {
        return NextResponse.json({
          success: true,
          pid: existing.pid,
          message: "Server already running",
        })
      }
      // Clean up stale entry
      global.mcpServers.delete(id)
    }

    // Parse command and arguments
    const cmdParts = command.split(" ")
    const mainCmd = cmdParts[0]
    const cmdArgs = [...cmdParts.slice(1)]

    // Add user-provided args
    if (args) {
      const userArgs = args.split(" ").filter((a) => a.trim())
      cmdArgs.push(...userArgs)
    }

    // Prepare environment variables
    const processEnv: Record<string, string> = {
      ...process.env as Record<string, string>,
      PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
    }

    // Add user-provided environment variables
    if (env) {
      Object.entries(env).forEach(([key, value]) => {
        if (value) {
          processEnv[key] = value
        }
      })
    }

    console.log(`[MCP] Starting server "${name}" (${id}): ${mainCmd} ${cmdArgs.join(" ")}`)

    // Spawn the process
    const serverProcess = spawn(mainCmd, cmdArgs, {
      env: processEnv,
      stdio: ["pipe", "pipe", "pipe"],
      detached: false,
      shell: true,
    })

    const pid = serverProcess.pid

    if (!pid) {
      return NextResponse.json(
        { error: "Failed to start server process" },
        { status: 500 }
      )
    }

    // Store the running process
    global.mcpServers.set(id, { process: serverProcess, pid })

    // Set up logging
    serverProcess.stdout?.on("data", (data) => {
      console.log(`[MCP:${name}] ${data.toString().trim()}`)
    })

    serverProcess.stderr?.on("data", (data) => {
      console.error(`[MCP:${name}] ${data.toString().trim()}`)
    })

    serverProcess.on("error", (err) => {
      console.error(`[MCP:${name}] Process error:`, err)
      global.mcpServers.delete(id)
    })

    serverProcess.on("exit", (code, signal) => {
      console.log(`[MCP:${name}] Process exited with code ${code}, signal ${signal}`)
      global.mcpServers.delete(id)
    })

    // Wait a moment to check if the process started successfully
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check if process is still running
    if (serverProcess.killed || serverProcess.exitCode !== null) {
      global.mcpServers.delete(id)
      return NextResponse.json(
        { error: "Server process terminated unexpectedly" },
        { status: 500 }
      )
    }

    console.log(`[MCP] Server "${name}" started successfully with PID ${pid}`)

    return NextResponse.json({
      success: true,
      pid,
      id,
      name,
      message: `Server "${name}" started successfully`,
    })
  } catch (error) {
    console.error("[MCP] Start server error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start server" },
      { status: 500 }
    )
  }
}
