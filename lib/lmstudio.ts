/**
 * LM Studio Local Model Support
 * Connects to LM Studio's OpenAI-compatible API endpoint
 */

import type { LMStudioModel, LMStudioSettings } from "@/types"

export const DEFAULT_LM_STUDIO_ENDPOINT = "http://localhost:1234/v1"

export interface LMStudioModelInfo {
  id: string
  object: string
  owned_by: string
  permission?: any[]
}

/**
 * Fetch available models from LM Studio
 */
export async function fetchLMStudioModels(endpoint: string = DEFAULT_LM_STUDIO_ENDPOINT): Promise<LMStudioModel[]> {
  try {
    const response = await fetch(`${endpoint}/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch LM Studio models: ${response.status}`)
    }

    const data = await response.json()
    const models: LMStudioModel[] = (data.data || []).map((model: LMStudioModelInfo) => ({
      id: `local/${model.id}`,
      name: formatModelName(model.id),
      type: model.object,
    }))

    return models
  } catch (error) {
    console.error("[LMStudio] Failed to fetch models:", error)
    throw error
  }
}

/**
 * Check if LM Studio is available and responding
 */
export async function checkLMStudioConnection(endpoint: string = DEFAULT_LM_STUDIO_ENDPOINT): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Short timeout for connection check
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch (error) {
    console.error("[LMStudio] Connection check failed:", error)
    return false
  }
}

/**
 * Format model ID into human-readable name
 * e.g., "llama-2-7b-chat.Q4_K_M.gguf" -> "Llama 2 7B Chat (Q4_K_M)"
 */
function formatModelName(modelId: string): string {
  // Remove file extension
  let name = modelId.replace(/\.gguf$/i, "")

  // Extract quantization if present
  const quantMatch = name.match(/\.(Q[0-9]_[A-Z0-9_]+)$/i)
  const quant = quantMatch ? quantMatch[1] : null
  if (quant) {
    name = name.replace(`.${quant}`, "")
  }

  // Replace separators with spaces
  name = name.replace(/[-_]/g, " ")

  // Capitalize words
  name = name.split(" ").map(word => {
    // Keep numbers and special tokens as-is
    if (/^\d+[bBmM]?$/.test(word)) return word.toUpperCase()
    if (word.length <= 2) return word.toUpperCase()
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(" ")

  // Add quantization back if present
  if (quant) {
    name += ` (${quant})`
  }

  return name
}

/**
 * Check if a model ID is a local LM Studio model
 */
export function isLMStudioModel(modelId: string): boolean {
  return modelId.startsWith("local/")
}

/**
 * Extract the actual model name for LM Studio API
 */
export function getLMStudioModelName(modelId: string): string {
  return modelId.replace(/^local\//, "")
}

/**
 * Get LM Studio models for the model selector
 * Returns models prefixed with "local/" for identification
 */
export function getLMStudioModelsForSelector(settings: LMStudioSettings | undefined): Array<{
  id: string
  name: string
  provider: string
  category: string
}> {
  if (!settings?.enabled || !settings.models || settings.models.length === 0) {
    return []
  }

  return settings.models.map(model => ({
    id: model.id,
    name: model.name,
    provider: "LM Studio",
    category: "local",
  }))
}

/**
 * Stream chat message from LM Studio
 * Uses the same interface as OpenRouter for easy integration
 */
export async function streamLMStudioMessage(
  messages: Array<{ role: string; content: string }>,
  model: string,
  onChunk: (content: string) => void,
  options: {
    endpoint?: string
    temperature?: number
    maxTokens?: number
    topP?: number
    signal?: AbortSignal
  } = {}
): Promise<void> {
  const {
    endpoint = DEFAULT_LM_STUDIO_ENDPOINT,
    temperature = 0.7,
    maxTokens = 4096,
    topP = 1.0,
    signal,
  } = options

  const actualModel = getLMStudioModelName(model)

  console.log("[LMStudio] Sending request to:", endpoint)
  console.log("[LMStudio] Model:", actualModel)

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: actualModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[LMStudio] Error response:", errorText)
    throw new Error(`LM Studio error: ${response.status} - ${errorText}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error("No response body from LM Studio")
  }

  let buffer = ""

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel()
        throw new DOMException("Aborted", "AbortError")
      }

      const { done, value } = await reader.read()

      if (done) {
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.slice(6)

          if (data === "[DONE]") {
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content

            if (content) {
              onChunk(content)
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
