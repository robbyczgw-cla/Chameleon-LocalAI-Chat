/**
 * Platform detection utilities for cross-platform support
 * Designed for future Tauri desktop packaging
 */

export type Platform = "darwin" | "win32" | "linux" | "unknown"

/**
 * Get the current platform
 * Works in both Node.js (API routes) and browser (via API call)
 */
export function getPlatform(): Platform {
  // Server-side detection
  if (typeof process !== "undefined" && process.platform) {
    return process.platform as Platform
  }

  // Browser-side detection (fallback to user agent)
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes("mac")) return "darwin"
    if (ua.includes("win")) return "win32"
    if (ua.includes("linux")) return "linux"
  }

  return "unknown"
}

/**
 * Check if running on macOS
 */
export function isMacOS(): boolean {
  return getPlatform() === "darwin"
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return getPlatform() === "win32"
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return getPlatform() === "linux"
}

/**
 * Platform-specific path separator
 */
export function getPathSeparator(): string {
  return isWindows() ? "\\" : "/"
}

/**
 * Platform-specific home directory path
 */
export function getHomeDir(): string {
  if (typeof process !== "undefined") {
    return process.env.HOME || process.env.USERPROFILE || "~"
  }
  return "~"
}

/**
 * Platform-specific shell command
 */
export function getShellCommand(): string {
  if (isWindows()) return "cmd.exe"
  return "/bin/sh"
}

/**
 * Platform-specific shell args
 */
export function getShellArgs(command: string): string[] {
  if (isWindows()) return ["/c", command]
  return ["-c", command]
}

/**
 * Platform feature availability
 */
export interface PlatformFeatures {
  screencapture: {
    available: boolean
    command: string
    notes: string
  }
  whisper: {
    mlxWhisper: boolean // macOS only (Apple Silicon)
    whisperCpp: boolean // All platforms
    pythonWhisper: boolean // All platforms
  }
  appleMcp: boolean // macOS only
  notifications: {
    available: boolean
    command: string
  }
}

/**
 * Get platform-specific feature availability
 */
export function getPlatformFeatures(): PlatformFeatures {
  const platform = getPlatform()

  return {
    screencapture: {
      available: true, // All platforms support some form of screenshot
      command: platform === "darwin"
        ? "screencapture"
        : platform === "win32"
        ? "powershell" // Using PowerShell for Windows screenshot
        : "gnome-screenshot", // Linux fallback
      notes: platform === "darwin"
        ? "Native macOS screencapture"
        : platform === "win32"
        ? "PowerShell screen capture"
        : "GNOME/Scrot screenshot utility",
    },
    whisper: {
      mlxWhisper: platform === "darwin", // MLX only works on Apple Silicon Macs
      whisperCpp: true, // Works on all platforms
      pythonWhisper: true, // Works on all platforms
    },
    appleMcp: platform === "darwin", // Apple-specific MCP servers
    notifications: {
      available: true,
      command: platform === "darwin"
        ? "osascript"
        : platform === "win32"
        ? "powershell"
        : "notify-send",
    },
  }
}

/**
 * Platform display names
 */
export const PLATFORM_NAMES: Record<Platform, string> = {
  darwin: "macOS",
  win32: "Windows",
  linux: "Linux",
  unknown: "Unknown",
}

/**
 * Get display name for current platform
 */
export function getPlatformDisplayName(): string {
  return PLATFORM_NAMES[getPlatform()]
}
