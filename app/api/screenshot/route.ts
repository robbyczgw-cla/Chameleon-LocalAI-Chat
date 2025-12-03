import { NextResponse } from "next/server"
import { spawn, exec } from "child_process"
import { readFile, unlink, mkdir, writeFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import os from "os"
import { promisify } from "util"

const execAsync = promisify(exec)

export const runtime = "nodejs"

/**
 * Screenshot API - Cross-platform support
 * macOS: Native `screencapture` command
 * Windows: PowerShell screen capture
 * Linux: gnome-screenshot, scrot, or import (ImageMagick)
 *
 * Security considerations:
 * - Only triggered by explicit user action (button click)
 * - No automatic/background capture
 * - Temp files deleted immediately after use
 * - OS handles screen recording permissions
 * - Image data only returned to the requesting client
 */

interface ScreenshotOptions {
  type?: "fullscreen" | "selection" | "window"
  format?: "png" | "jpg"
  delay?: number // seconds
}

type Platform = "darwin" | "win32" | "linux"

export async function POST(req: Request) {
  const tempDir = path.join(os.tmpdir(), "chameleon-screenshots")
  let tempPath: string | null = null
  const platform = process.platform as Platform

  try {
    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    const body: ScreenshotOptions = await req.json().catch(() => ({}))
    const {
      type = "selection", // Default to selection for privacy
      format = "png",
      delay = 0,
    } = body

    // Generate temp file path
    tempPath = path.join(tempDir, `screenshot-${Date.now()}.${format}`)

    console.log(`[Screenshot] Capturing ${type} screenshot on ${platform}...`)

    let result: { success: boolean; error?: string; cancelled?: boolean }

    // Platform-specific screenshot capture
    switch (platform) {
      case "darwin":
        result = await captureMacOS(tempPath, type, format, delay)
        break
      case "win32":
        result = await captureWindows(tempPath, type, format)
        break
      case "linux":
        result = await captureLinux(tempPath, type, format, delay)
        break
      default:
        return NextResponse.json(
          { error: `Unsupported platform: ${platform}` },
          { status: 500 }
        )
    }

    if (!result.success) {
      if (result.cancelled) {
        return NextResponse.json(
          { error: "Screenshot cancelled", cancelled: true },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: result.error || "Screenshot failed" },
        { status: 500 }
      )
    }

    // Check if file was created
    if (!existsSync(tempPath)) {
      return NextResponse.json(
        { error: "Screenshot was cancelled or failed", cancelled: true },
        { status: 400 }
      )
    }

    // Read the screenshot
    const imageBuffer = await readFile(tempPath)
    const base64Image = imageBuffer.toString("base64")
    const mimeType = format === "jpg" ? "image/jpeg" : "image/png"
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    console.log(`[Screenshot] Captured successfully (${Math.round(imageBuffer.length / 1024)}KB)`)

    return NextResponse.json({
      success: true,
      image: dataUrl,
      format,
      size: imageBuffer.length,
      platform,
    })

  } catch (error) {
    console.error("[Screenshot] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Screenshot failed" },
      { status: 500 }
    )
  } finally {
    // Clean up temp file immediately
    if (tempPath && existsSync(tempPath)) {
      try {
        await unlink(tempPath)
        console.log(`[Screenshot] Temp file cleaned up`)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Check if screenshot capability is available
 */
export async function GET() {
  const platform = process.platform

  switch (platform) {
    case "darwin":
      return checkMacOSAvailability()
    case "win32":
      return checkWindowsAvailability()
    case "linux":
      return checkLinuxAvailability()
    default:
      return NextResponse.json({
        available: false,
        reason: `Unsupported platform: ${platform}`,
        platform,
      })
  }
}

// ==================== macOS ====================
async function checkMacOSAvailability() {
  try {
    await execAsync("which screencapture")
    return NextResponse.json({
      available: true,
      platform: "darwin",
      features: {
        fullscreen: true,
        selection: true,
        window: true,
        delay: true,
        formats: ["png", "jpg"],
      },
      securityNote: "Screenshots are user-initiated only. macOS will prompt for Screen Recording permission on first use.",
    })
  } catch {
    return NextResponse.json({
      available: false,
      reason: "screencapture command not found",
      platform: "darwin",
    })
  }
}

async function captureMacOS(
  tempPath: string,
  type: string,
  format: string,
  delay: number
): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  return new Promise((resolve) => {
    const args: string[] = []

    // Screenshot type
    switch (type) {
      case "selection":
        args.push("-i") // Interactive selection
        break
      case "window":
        args.push("-w") // Window selection
        break
      // fullscreen needs no flag
    }

    if (format === "jpg") {
      args.push("-t", "jpg")
    }

    if (delay > 0) {
      args.push("-T", String(delay))
    }

    args.push(tempPath)

    const proc = spawn("screencapture", args, {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stderr = ""
    proc.stderr?.on("data", (data) => { stderr += data.toString() })

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true })
      } else if (code === 1) {
        resolve({ success: false, cancelled: true })
      } else {
        resolve({ success: false, error: stderr || `Exit code ${code}` })
      }
    })

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message })
    })
  })
}

// ==================== Windows ====================
async function checkWindowsAvailability() {
  // PowerShell is available on all modern Windows systems
  return NextResponse.json({
    available: true,
    platform: "win32",
    features: {
      fullscreen: true,
      selection: false, // Windows native doesn't have interactive selection
      window: false,
      delay: false,
      formats: ["png"],
    },
    securityNote: "Screenshots are user-initiated only. Uses PowerShell for screen capture.",
    note: "Interactive selection not supported on Windows. Use Snipping Tool (Win+Shift+S) for manual selection, or fullscreen capture here.",
  })
}

async function captureWindows(
  tempPath: string,
  type: string,
  format: string
): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  // Windows PowerShell screen capture script
  // Note: This captures the entire screen; Windows doesn't have built-in CLI selection tool
  const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$bitmap.Save('${tempPath.replace(/\\/g, "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
`

  try {
    await execAsync(`powershell -Command "${psScript.replace(/\n/g, " ")}"`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "PowerShell screenshot failed",
    }
  }
}

// ==================== Linux ====================
async function checkLinuxAvailability() {
  // Try to find available screenshot tools
  const tools = ["gnome-screenshot", "scrot", "import"] // import is ImageMagick
  let availableTool: string | null = null

  for (const tool of tools) {
    try {
      await execAsync(`which ${tool}`)
      availableTool = tool
      break
    } catch {
      // Tool not found, try next
    }
  }

  if (availableTool) {
    return NextResponse.json({
      available: true,
      platform: "linux",
      tool: availableTool,
      features: {
        fullscreen: true,
        selection: availableTool !== "import", // gnome-screenshot and scrot support selection
        window: true,
        delay: true,
        formats: ["png"],
      },
      securityNote: `Screenshots are user-initiated only. Using ${availableTool} for capture.`,
    })
  }

  return NextResponse.json({
    available: false,
    reason: "No screenshot tool found. Install gnome-screenshot, scrot, or ImageMagick.",
    platform: "linux",
    suggestion: "sudo apt install gnome-screenshot",
  })
}

async function captureLinux(
  tempPath: string,
  type: string,
  format: string,
  delay: number
): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  // Try tools in order of preference
  const tools = ["gnome-screenshot", "scrot", "import"]

  for (const tool of tools) {
    try {
      await execAsync(`which ${tool}`)

      let command: string

      switch (tool) {
        case "gnome-screenshot":
          // gnome-screenshot options
          if (type === "selection") {
            command = `gnome-screenshot -a -f "${tempPath}"`
          } else if (type === "window") {
            command = `gnome-screenshot -w -f "${tempPath}"`
          } else {
            command = `gnome-screenshot -f "${tempPath}"`
          }
          if (delay > 0) {
            command = command.replace("gnome-screenshot", `gnome-screenshot -d ${delay}`)
          }
          break

        case "scrot":
          // scrot options
          if (type === "selection") {
            command = `scrot -s "${tempPath}"`
          } else if (type === "window") {
            command = `scrot -u "${tempPath}"`
          } else {
            command = `scrot "${tempPath}"`
          }
          if (delay > 0) {
            command = command.replace("scrot", `scrot -d ${delay}`)
          }
          break

        case "import":
          // ImageMagick import - fullscreen only
          command = `import -window root "${tempPath}"`
          break

        default:
          continue
      }

      await execAsync(command)
      return { success: true }
    } catch (error) {
      // If it's a "which" error, try next tool
      if (error instanceof Error && error.message.includes("which")) {
        continue
      }
      // User might have cancelled selection in gnome-screenshot/scrot
      if (error instanceof Error && (error.message.includes("cancelled") || error.message.includes("signal"))) {
        return { success: false, cancelled: true }
      }
      // Otherwise this tool failed, try next
      continue
    }
  }

  return {
    success: false,
    error: "No screenshot tool available. Install gnome-screenshot, scrot, or ImageMagick.",
  }
}
