import { NextResponse } from "next/server"
import os from "os"

export const runtime = "nodejs"

/**
 * Platform detection API
 * Returns server-side platform information for cross-platform feature detection
 */
export async function GET() {
  const platform = process.platform
  const arch = process.arch
  const hostname = os.hostname()
  const homeDir = os.homedir()
  const tmpDir = os.tmpdir()

  // Platform display name
  const platformNames: Record<string, string> = {
    darwin: "macOS",
    win32: "Windows",
    linux: "Linux",
    freebsd: "FreeBSD",
    sunos: "SunOS",
    aix: "AIX",
  }

  // Architecture display name
  const archNames: Record<string, string> = {
    x64: "x86_64",
    arm64: "ARM64 (Apple Silicon / ARM)",
    arm: "ARM",
    ia32: "x86 (32-bit)",
  }

  // Platform-specific features
  const features = {
    // Screenshot capabilities
    screenshot: {
      available: true,
      method: platform === "darwin"
        ? "screencapture (native)"
        : platform === "win32"
        ? "PowerShell"
        : "gnome-screenshot/scrot/import",
      interactiveSelection: platform !== "win32",
    },

    // Local Whisper backends
    whisper: {
      mlxWhisper: platform === "darwin" && arch === "arm64", // Apple Silicon only
      whisperCpp: true, // All platforms
      pythonWhisper: true, // All platforms
    },

    // Apple-specific features
    appleMcp: platform === "darwin",
    appleShortcuts: platform === "darwin",
    applescript: platform === "darwin",

    // Desktop notifications
    notifications: {
      available: true,
      method: platform === "darwin"
        ? "osascript"
        : platform === "win32"
        ? "PowerShell toast"
        : "notify-send",
    },

    // File system
    filesystem: {
      caseSensitive: platform !== "darwin" && platform !== "win32",
      pathSeparator: platform === "win32" ? "\\" : "/",
      homeDir,
      tmpDir,
    },
  }

  // Installation commands for common tools
  const installCommands = {
    nodejs: platform === "darwin"
      ? "brew install node"
      : platform === "win32"
      ? "winget install OpenJS.NodeJS"
      : "sudo apt install nodejs",
    python: platform === "darwin"
      ? "brew install python"
      : platform === "win32"
      ? "winget install Python.Python.3"
      : "sudo apt install python3",
    whisperCpp: platform === "darwin"
      ? "brew install whisper-cpp"
      : platform === "win32"
      ? "scoop install whisper-cpp"
      : "Build from source: https://github.com/ggerganov/whisper.cpp",
  }

  return NextResponse.json({
    platform,
    platformName: platformNames[platform] || platform,
    arch,
    archName: archNames[arch] || arch,
    hostname,
    features,
    installCommands,
    isAppleSilicon: platform === "darwin" && arch === "arm64",
    isDesktop: true, // Always true for local deployment
    version: {
      node: process.version,
      v8: process.versions.v8,
    },
  })
}
