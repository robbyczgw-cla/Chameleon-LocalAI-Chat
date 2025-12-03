/**
 * Image Utilities
 * Compression and resizing for vision model uploads
 */

/**
 * Compress image to reduce file size
 * Resizes large images and reduces quality if needed
 */
export async function compressImage(
  dataUrl: string,
  maxSizeKB: number = 800 // Default 800KB (well under 1MB Vercel limit)
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Calculate new dimensions (max 2048x2048 for vision models)
      const maxDimension = 2048
      let width = img.width
      let height = img.height

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension
          width = maxDimension
        } else {
          width = (width / height) * maxDimension
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height)

      // Try different quality levels to get under maxSizeKB
      let quality = 0.9
      let compressed = canvas.toDataURL("image/jpeg", quality)

      // Keep reducing quality until size is acceptable
      while (compressed.length > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1
        compressed = canvas.toDataURL("image/jpeg", quality)
      }

      const originalSizeKB = (dataUrl.length / 1024).toFixed(2)
      const compressedSizeKB = (compressed.length / 1024).toFixed(2)

      console.log(`[Image] Compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (quality: ${(quality * 100).toFixed(0)}%)`)

      resolve(compressed)
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = dataUrl
  })
}

/**
 * Get image size in KB from data URL
 */
export function getImageSizeKB(dataUrl: string): number {
  return dataUrl.length / 1024
}

/**
 * Check if image needs compression
 */
export function needsCompression(dataUrl: string, maxSizeKB: number = 800): boolean {
  return getImageSizeKB(dataUrl) > maxSizeKB
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  dataUrls: string[],
  maxSizeKB: number = 800
): Promise<string[]> {
  const compressionPromises = dataUrls.map(url =>
    needsCompression(url, maxSizeKB) ? compressImage(url, maxSizeKB) : Promise.resolve(url)
  )

  return Promise.all(compressionPromises)
}
