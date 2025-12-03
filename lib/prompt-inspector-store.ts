import { useState, useEffect } from "react"
import type { InspectorData } from "@/components/prompt-inspector"

// Simple global store without external dependencies
let globalInspectorData: InspectorData | null = null
const listeners: Array<(data: InspectorData | null) => void> = []

export const setInspectorData = (data: InspectorData) => {
  console.log("[PromptInspector] Storing inspector data:", {
    timestamp: data.timestamp,
    messagesCount: data.messages.length,
    model: data.modelParams.model,
  })
  globalInspectorData = data
  listeners.forEach((listener) => listener(data))
}

export const clearInspectorData = () => {
  globalInspectorData = null
  listeners.forEach((listener) => listener(null))
}

export const getInspectorData = () => globalInspectorData

// Hook to use the inspector data
export const usePromptInspectorStore = () => {
  const [inspectorData, setLocalData] = useState<InspectorData | null>(globalInspectorData)

  useEffect(() => {
    const listener = (data: InspectorData | null) => {
      setLocalData(data)
    }
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    inspectorData,
    setInspectorData,
    clearInspectorData,
  }
}
