/**
 * Multimodal Message Building Utilities
 * Handles construction of messages with text and image content for vision models
 */

import type { MessageContent, MessageContentPart } from "@/types"
import type { FileAttachment } from "@/lib/file-handler"
import { getFileCategory } from "@/lib/file-handler"

/**
 * Build multimodal content from text and file attachments
 * Returns either a string (text-only) or array of content parts (text + images)
 */
export function buildMultimodalContent(
  text: string,
  attachedFiles: FileAttachment[]
): MessageContent {
  // If no files, just return text
  if (attachedFiles.length === 0) {
    return text
  }

  // Separate images from other files
  const images = attachedFiles.filter(f => getFileCategory(f.name) === "image")
  const otherFiles = attachedFiles.filter(f => getFileCategory(f.name) !== "image")

  // If no images, append file info as text
  if (images.length === 0) {
    let fullText = text

    // Add text/code file contents
    for (const file of otherFiles) {
      if (file.content) {
        fullText += `\n\n--- File: ${file.name} ---\n${file.content}\n`
      } else {
        fullText += `\n[Attached: ${file.name}]\n`
      }
    }

    return fullText
  }

  // Build multimodal content array with text and images
  const contentParts: MessageContentPart[] = []

  // Add text content first (include non-image file contents)
  let textContent = text
  for (const file of otherFiles) {
    if (file.content) {
      textContent += `\n\n--- File: ${file.name} ---\n${file.content}\n`
    } else {
      textContent += `\n[Attached: ${file.name}]\n`
    }
  }

  if (textContent.trim()) {
    contentParts.push({
      type: "text",
      text: textContent.trim(),
    })
  }

  // Add image content
  for (const image of images) {
    if (image.dataUrl) {
      contentParts.push({
        type: "image_url",
        image_url: {
          url: image.dataUrl,
          detail: "auto", // Let model decide detail level
        },
      })
    }
  }

  return contentParts
}

/**
 * Convert MessageContent to plain text representation
 * Useful for display purposes or when vision is not supported
 */
export function contentToText(content: MessageContent | undefined | null): string {
  // Handle undefined/null
  if (!content) {
    return ""
  }

  // If it's a string, return it directly
  if (typeof content === "string") {
    return content
  }

  // If it's not an array, return empty string (safety check)
  if (!Array.isArray(content)) {
    console.warn("[contentToText] Invalid content type:", typeof content)
    return ""
  }

  // Extract text parts and add image placeholders
  return content
    .map(part => {
      if (!part || !part.type) {
        return ""
      }
      if (part.type === "text") {
        return part.text || ""
      }
      if (part.type === "image_url") {
        return "[Image]"
      }
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

/**
 * Check if MessageContent contains images
 */
export function hasImages(content: MessageContent | undefined | null): boolean {
  if (!content || typeof content === "string" || !Array.isArray(content)) {
    return false
  }
  return content.some(part => part && part.type === "image_url")
}

/**
 * Get count of images in MessageContent
 */
export function getImageCount(content: MessageContent | undefined | null): number {
  if (!content || typeof content === "string" || !Array.isArray(content)) {
    return 0
  }
  return content.filter(part => part && part.type === "image_url").length
}

/**
 * Validate that content matches the capabilities of the selected model
 */
export function validateContentForModel(
  content: MessageContent,
  supportsVision: boolean
): { valid: boolean; warning?: string } {
  const imageCount = getImageCount(content)

  if (imageCount === 0) {
    return { valid: true }
  }

  if (!supportsVision) {
    return {
      valid: false,
      warning: "This model does not support image inputs. Please select a vision-capable model or remove images.",
    }
  }

  return { valid: true }
}

/**
 * Strip image data from message content for memory efficiency
 * Replaces actual image data URLs with a placeholder text
 * CRITICAL for PWA stability - prevents accumulating large image data in memory
 *
 * When building API requests, historical images should be stripped because:
 * 1. Vision models typically only look at images in the current message anyway
 * 2. Keeping all historical images in memory causes PWA crashes
 * 3. The context from previous image discussions is preserved as text
 */
export function stripImageDataFromContent(content: MessageContent): MessageContent {
  // If it's a string, nothing to strip
  if (typeof content === "string") {
    return content
  }

  // If not an array, return as-is
  if (!Array.isArray(content)) {
    return content
  }

  // Map over content parts and replace image data with placeholder text
  const strippedParts = content.map(part => {
    if (part.type === "image_url" && part.image_url?.url) {
      // Check if it's a data URL (base64 image)
      if (part.image_url.url.startsWith("data:")) {
        // Replace with text part instead of keeping image structure
        return {
          type: "text" as const,
          text: "[Previous image was shared here]",
        }
      }
    }
    return part
  })

  // If only text parts remain after stripping, merge them
  const allText = strippedParts.every(p => p.type === "text")
  if (allText) {
    return strippedParts.map(p => p.type === "text" ? p.text : "").join("\n")
  }

  return strippedParts
}
