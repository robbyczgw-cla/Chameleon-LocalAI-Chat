export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  content: string
  dataUrl?: string
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const SUPPORTED_FILE_TYPES = {
  text: [".txt", ".md", ".json", ".csv", ".xml", ".html", ".css", ".js", ".ts", ".tsx", ".jsx", ".py", ".java"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  document: [".pdf"],
}

export function isFileTypeSupported(fileName: string): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."))
  return Object.values(SUPPORTED_FILE_TYPES)
    .flat()
    .some((ext) => ext === extension)
}

export function getFileCategory(fileName: string): "text" | "image" | "document" | "unknown" {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."))

  if (SUPPORTED_FILE_TYPES.text.includes(extension)) return "text"
  if (SUPPORTED_FILE_TYPES.image.includes(extension)) return "image"
  if (SUPPORTED_FILE_TYPES.document.includes(extension)) return "document"

  return "unknown"
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress and resize an image to reduce memory usage
 * Critical for PWA mode which has stricter memory limits
 */
export async function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      // Use webp for better compression, fallback to jpeg
      let dataUrl: string
      try {
        dataUrl = canvas.toDataURL("image/webp", quality)
        // If webp not supported, result will be png - check and use jpeg instead
        if (dataUrl.startsWith("data:image/png")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality)
        }
      } catch {
        dataUrl = canvas.toDataURL("image/jpeg", quality)
      }

      // Clean up
      URL.revokeObjectURL(img.src)

      console.log(`[Image] Compressed from ${(file.size / 1024).toFixed(0)}KB to ${(dataUrl.length * 0.75 / 1024).toFixed(0)}KB`)
      resolve(dataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Failed to load image for compression"))
    }

    // Use object URL instead of data URL for initial load (more memory efficient)
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Extract text from PDF file using PDF.js
 * Runs entirely in the browser - PDF never leaves the client
 * Uses dynamic import to avoid SSR issues
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    console.log(`[PDF] Extracting text from ${file.name} (${(file.size / 1024).toFixed(1)}KB)`)

    // Dynamic import to avoid SSR issues (PDF.js needs browser APIs)
    const pdfjsLib = await import("pdfjs-dist")

    // Configure worker for this session
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    console.log(`[PDF] Loaded PDF with ${pdf.numPages} pages`)

    let fullText = ""

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Extract text from all items on the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")

      fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`
    }

    console.log(`[PDF] Extracted ${fullText.length} characters from ${pdf.numPages} pages`)

    return fullText.trim()
  } catch (error) {
    console.error("[PDF] Failed to extract text:", error)
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function processFile(file: File): Promise<FileAttachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
  }

  if (!isFileTypeSupported(file.name)) {
    throw new Error(`File type not supported: ${file.name}`)
  }

  const category = getFileCategory(file.name)
  let content = ""
  let dataUrl: string | undefined

  if (category === "text") {
    content = await readFileAsText(file)
  } else if (category === "image") {
    // Compress images to reduce memory usage (critical for PWA stability)
    // Skip compression for small images (<100KB) and SVGs
    const isSvg = file.name.toLowerCase().endsWith(".svg")
    const isSmall = file.size < 100 * 1024

    if (isSvg || isSmall) {
      dataUrl = await readFileAsDataURL(file)
    } else {
      try {
        dataUrl = await compressImage(file)
      } catch (error) {
        console.warn("[processFile] Image compression failed, using original:", error)
        dataUrl = await readFileAsDataURL(file)
      }
    }
    content = `[Image: ${file.name}]`
  } else if (category === "document") {
    // Extract text from PDF client-side
    try {
      content = await extractPdfText(file)
      dataUrl = await readFileAsDataURL(file)
    } catch (error) {
      console.error("[processFile] PDF extraction failed:", error)
      // Fallback to placeholder if extraction fails
      content = `[Document: ${file.name}]\n(Text extraction failed)`
      dataUrl = await readFileAsDataURL(file)
    }
  }

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    type: file.type,
    size: file.size,
    content,
    dataUrl,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function extractTextFromAttachments(attachments: FileAttachment[]): string {
  return attachments
    .map((attachment) => {
      if (getFileCategory(attachment.name) === "text") {
        return `\n--- File: ${attachment.name} ---\n${attachment.content}\n--- End of ${attachment.name} ---\n`
      }
      return `\n[Attached: ${attachment.name}]\n`
    })
    .join("\n")
}
