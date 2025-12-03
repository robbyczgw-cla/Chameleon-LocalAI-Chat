import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { writeFile, unlink, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import os from "os"

export const runtime = "nodejs"

// Whisper model sizes and their tradeoffs
const WHISPER_MODELS = {
  tiny: { size: "75MB", speed: "~10x realtime", accuracy: "Basic" },
  base: { size: "142MB", speed: "~7x realtime", accuracy: "Good" },
  small: { size: "466MB", speed: "~4x realtime", accuracy: "Better" },
  medium: { size: "1.5GB", speed: "~2x realtime", accuracy: "Great" },
  large: { size: "2.9GB", speed: "~1x realtime", accuracy: "Best" },
}

interface WhisperConfig {
  model?: keyof typeof WHISPER_MODELS
  language?: string
  translate?: boolean
}

/**
 * Local Whisper STT API - Cross-platform support
 * Uses whisper.cpp or mlx-whisper for completely offline speech-to-text
 *
 * Supports multiple backends:
 * 1. LM Studio's whisper endpoint (if available) - All platforms
 * 2. mlx-whisper (Apple Silicon optimized) - macOS only
 * 3. whisper.cpp - All platforms (brew/choco/apt)
 * 4. openai-whisper Python package - All platforms
 *
 * Platform-specific notes:
 * - macOS: mlx-whisper is fastest on Apple Silicon
 * - Windows: Use whisper.cpp via scoop/choco or Python whisper
 * - Linux: whisper.cpp or Python whisper
 */
export async function POST(req: NextRequest) {
  const tempDir = path.join(os.tmpdir(), "chameleon-whisper")
  let tempAudioPath: string | null = null

  try {
    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null
    const configStr = formData.get("config") as string | null

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    const config: WhisperConfig = configStr ? JSON.parse(configStr) : {}
    const model = config.model || "base"
    const language = config.language || "auto"

    // Save audio to temp file
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    tempAudioPath = path.join(tempDir, `audio-${Date.now()}.wav`)
    await writeFile(tempAudioPath, audioBuffer)

    console.log(`[LocalWhisper] Processing audio file: ${tempAudioPath}`)
    console.log(`[LocalWhisper] Model: ${model}, Language: ${language}`)

    // Try different Whisper backends in order of preference
    let transcription: string | null = null
    let backend: string = "none"

    // 1. Try LM Studio's Whisper endpoint first (if running)
    try {
      transcription = await tryLMStudioWhisper(tempAudioPath)
      if (transcription) {
        backend = "lmstudio"
        console.log(`[LocalWhisper] Success via LM Studio`)
      }
    } catch (e) {
      console.log(`[LocalWhisper] LM Studio not available, trying alternatives...`)
    }

    // 2. Try mlx-whisper (Apple Silicon optimized) - macOS only
    if (!transcription && process.platform === "darwin") {
      try {
        transcription = await tryMLXWhisper(tempAudioPath, model, language)
        if (transcription) {
          backend = "mlx-whisper"
          console.log(`[LocalWhisper] Success via mlx-whisper`)
        }
      } catch (e) {
        console.log(`[LocalWhisper] mlx-whisper not available`)
      }
    }

    // 3. Try whisper.cpp
    if (!transcription) {
      try {
        transcription = await tryWhisperCpp(tempAudioPath, model, language)
        if (transcription) {
          backend = "whisper.cpp"
          console.log(`[LocalWhisper] Success via whisper.cpp`)
        }
      } catch (e) {
        console.log(`[LocalWhisper] whisper.cpp not available`)
      }
    }

    // 4. Try openai-whisper Python package
    if (!transcription) {
      try {
        transcription = await tryPythonWhisper(tempAudioPath, model, language)
        if (transcription) {
          backend = "openai-whisper"
          console.log(`[LocalWhisper] Success via openai-whisper`)
        }
      } catch (e) {
        console.log(`[LocalWhisper] openai-whisper not available`)
      }
    }

    if (!transcription) {
      const platform = process.platform
      let help: string

      if (platform === "darwin") {
        help = "Install one of: mlx-whisper (pip install mlx-whisper), whisper.cpp (brew install whisper-cpp), or openai-whisper (pip install openai-whisper)"
      } else if (platform === "win32") {
        help = "Install one of: whisper.cpp (via scoop or manual build), or openai-whisper (pip install openai-whisper)"
      } else {
        help = "Install one of: whisper.cpp (via apt or manual build), or openai-whisper (pip install openai-whisper)"
      }

      return NextResponse.json(
        {
          error: "No local Whisper backend available",
          help,
          platform,
          backends_tried: platform === "darwin"
            ? ["lmstudio", "mlx-whisper", "whisper.cpp", "openai-whisper"]
            : ["lmstudio", "whisper.cpp", "openai-whisper"],
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      transcription: transcription.trim(),
      backend,
      model,
      language,
    })

  } catch (error) {
    console.error("[LocalWhisper] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transcription failed" },
      { status: 500 }
    )
  } finally {
    // Clean up temp file
    if (tempAudioPath) {
      try {
        await unlink(tempAudioPath)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Check available backends - platform-aware
 */
export async function GET() {
  const platform = process.platform
  const isMacOS = platform === "darwin"
  const isWindows = platform === "win32"

  const backends: Record<string, boolean> = {
    lmstudio: false,
    "mlx-whisper": false,
    "whisper.cpp": false,
    "openai-whisper": false,
  }

  // Check LM Studio (all platforms)
  try {
    const response = await fetch("http://localhost:1234/v1/models", {
      signal: AbortSignal.timeout(2000),
    })
    if (response.ok) {
      backends.lmstudio = true
    }
  } catch {}

  // Check mlx-whisper (macOS only - Apple Silicon)
  if (isMacOS) {
    try {
      await runCommand("which", ["mlx_whisper"])
      backends["mlx-whisper"] = true
    } catch {}
  }

  // Check whisper.cpp (all platforms)
  if (isWindows) {
    // Windows: check for whisper.exe
    try {
      await runCommand("where", ["whisper"])
      backends["whisper.cpp"] = true
    } catch {}
  } else {
    // macOS/Linux: check with which
    try {
      await runCommand("which", ["whisper-cpp"])
      backends["whisper.cpp"] = true
    } catch {
      try {
        await runCommand("which", ["whisper"])
        backends["whisper.cpp"] = true
      } catch {}
    }
  }

  // Check openai-whisper Python package (all platforms)
  const pythonCmd = isWindows ? "python" : "python3"
  try {
    await runCommand(pythonCmd, ["-c", "import whisper"])
    backends["openai-whisper"] = true
  } catch {}

  const available = Object.entries(backends).filter(([_, v]) => v).map(([k]) => k)

  // Platform-specific installation instructions
  let installInstructions: Record<string, string>
  if (isMacOS) {
    installInstructions = {
      "mlx-whisper": "pip install mlx-whisper (fastest on Apple Silicon)",
      "whisper.cpp": "brew install whisper-cpp",
      "openai-whisper": "pip install openai-whisper",
    }
  } else if (isWindows) {
    installInstructions = {
      "whisper.cpp": "scoop install whisper-cpp OR manual build from GitHub",
      "openai-whisper": "pip install openai-whisper",
    }
  } else {
    installInstructions = {
      "whisper.cpp": "Build from source: git clone https://github.com/ggerganov/whisper.cpp",
      "openai-whisper": "pip install openai-whisper",
    }
  }

  return NextResponse.json({
    available,
    backends,
    models: WHISPER_MODELS,
    platform,
    recommended: isMacOS && available.includes("mlx-whisper")
      ? "mlx-whisper"
      : available.includes("whisper.cpp")
      ? "whisper.cpp"
      : available[0] || null,
    installInstructions,
  })
}

// Helper to run commands - cross-platform
function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32"

    // Build cross-platform PATH
    let envPath = process.env.PATH || ""
    if (!isWindows) {
      // Unix-style PATH additions
      envPath = `/opt/homebrew/bin:/usr/local/bin:${envPath}`
    }

    const proc = spawn(cmd, args, {
      env: { ...process.env, PATH: envPath },
      shell: isWindows, // Use shell on Windows for better command resolution
    })

    let stdout = ""
    let stderr = ""

    proc.stdout?.on("data", (data) => { stdout += data.toString() })
    proc.stderr?.on("data", (data) => { stderr += data.toString() })

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`))
      }
    })

    proc.on("error", reject)
  })
}

// Try LM Studio's Whisper endpoint
async function tryLMStudioWhisper(audioPath: string): Promise<string | null> {
  const audioBuffer = await import("fs/promises").then(fs => fs.readFile(audioPath))

  const formData = new FormData()
  formData.append("file", new Blob([audioBuffer]), "audio.wav")
  formData.append("model", "whisper-1")

  const response = await fetch("http://localhost:1234/v1/audio/transcriptions", {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(60000),
  })

  if (!response.ok) return null

  const data = await response.json()
  return data.text || null
}

// Try mlx-whisper (Apple Silicon optimized)
async function tryMLXWhisper(audioPath: string, model: string, language: string): Promise<string | null> {
  const args = [
    audioPath,
    "--model", model,
    "--output-format", "txt",
  ]

  if (language !== "auto") {
    args.push("--language", language)
  }

  const result = await runCommand("mlx_whisper", args)
  return result || null
}

// Try whisper.cpp
async function tryWhisperCpp(audioPath: string, model: string, language: string): Promise<string | null> {
  // whisper.cpp model path (common locations)
  const modelPaths = [
    `~/.cache/whisper/ggml-${model}.bin`,
    `/usr/local/share/whisper/ggml-${model}.bin`,
    `~/whisper.cpp/models/ggml-${model}.bin`,
  ].map(p => p.replace("~", os.homedir()))

  let modelPath = modelPaths.find(p => existsSync(p))

  const args = [
    "-f", audioPath,
    "-otxt",
    "--no-timestamps",
  ]

  if (modelPath) {
    args.push("-m", modelPath)
  }

  if (language !== "auto") {
    args.push("-l", language)
  }

  // Try different binary names
  try {
    return await runCommand("whisper-cpp", args)
  } catch {
    return await runCommand("whisper", args)
  }
}

// Try Python openai-whisper
async function tryPythonWhisper(audioPath: string, model: string, language: string): Promise<string | null> {
  const pythonScript = `
import whisper
import sys
import json

model = whisper.load_model("${model}")
result = model.transcribe("${audioPath}"${language !== "auto" ? `, language="${language}"` : ""})
print(result["text"])
`

  const result = await runCommand("python3", ["-c", pythonScript])
  return result || null
}
