# Image Generation Fixes for LLM Chat Applications

This document describes fixes for common issues in LLM chat applications that support image generation and multimodal messages.

---

## Fix 1: Handle Image Messages in Search/Tokenization

### Problem
When messages contain images (multimodal content), the `message.content` is an array instead of a string. This causes crashes like:
```
TypeError: e.toLowerCase is not a function
```

### Root Cause
OpenAI/OpenRouter format for multimodal messages:
```javascript
// Text-only message
message.content = "Hello world"

// Multimodal message with images
message.content = [
  { type: "image_url", image_url: { url: "data:image/png;base64,..." } },
  { type: "text", text: "What's in this image?" }
]
```

### Solution
Update any tokenize/search function to handle both formats:

```typescript
/**
 * Tokenize text into searchable words
 * Handles both string and multimodal array content
 */
private tokenize(text: string | unknown): string[] {
  // Handle non-string content (e.g., array of content parts with images)
  if (typeof text !== 'string') {
    // If it's an array (multi-part content), extract text from text parts
    if (Array.isArray(text)) {
      const textParts = text
        .filter((part: any) => part?.type === 'text' && typeof part?.text === 'string')
        .map((part: any) => part.text)
        .join(' ')
      return this.tokenize(textParts)
    }
    return []
  }

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 1) // Filter very short words
}
```

---

## Fix 2: Use Gemini 3 Pro for Image Generation

### Problem
Image generation was using various models inconsistently, or falling back to DALL-E which requires a separate OpenAI API key.

### Solution
Always use `google/gemini-3-pro-image-preview` via OpenRouter for consistent, high-quality image generation.

### API Route Changes (`/api/generate-image/route.ts`)

```typescript
// Image generation models (multimodal models that can generate images)
const IMAGE_MODELS = {
  // Google Gemini Image models (primary)
  'google/gemini-3-pro-image-preview': { name: 'Gemini 3 Pro Image Preview', multimodal: true },
  'google/gemini-2.5-flash-image': { name: 'Gemini 2.5 Flash Image', multimodal: true },
  'google/gemini-2.5-flash-image-preview': { name: 'Gemini 2.5 Flash Image Preview', multimodal: true },

  // Classic DALL-E (requires OpenAI API key)
  'openai/dall-e-3': { name: 'DALL-E 3', size: '1024x1024', multimodal: false },
  'openai/dall-e-2': { name: 'DALL-E 2', size: '1024x1024', multimodal: false },

  // Other providers
  'black-forest-labs/flux-1.1-pro': { name: 'Flux 1.1 Pro', multimodal: true },
  'black-forest-labs/flux-pro': { name: 'Flux Pro', multimodal: true },
  'stability-ai/stable-diffusion-xl': { name: 'Stable Diffusion XL', multimodal: true },
}

// Default image model
const DEFAULT_IMAGE_MODEL = 'google/gemini-3-pro-image-preview'
```

### Frontend Changes (Chat Input Component)

Replace dynamic model selection with fixed Gemini 3 Pro:

```typescript
// BEFORE (complex, inconsistent)
const imageModel = settings.selectedModel || "openai/dall-e-3"
const isDallE = imageModel === 'openai/dall-e-2' || imageModel === 'openai/dall-e-3'
const apiKey = isDallE
  ? settings.apiKeys.openAI
  : settings.apiKeys.openRouter

// AFTER (simple, consistent)
const imageModel = "google/gemini-3-pro-image-preview"
const apiKey = settings.apiKeys.openRouter

if (!apiKey) {
  throw new Error('OpenRouter API key required. Add it in Settings → API')
}
```

---

## Fix 3: Image-to-Image Generation Support

### Feature
Allow users to upload an image and generate a new image based on it (image editing/transformation).

### How It Works
1. User uploads an image
2. User enables image generation mode toggle
3. User types a prompt like "make this cartoon style" or "remove the background"
4. System sends both the uploaded image AND the prompt to the model
5. Model generates a new image based on the input

### API Route Changes

Accept `inputImages` array and build multimodal content:

```typescript
export async function POST(req: NextRequest) {
  // Accept inputImages for image-to-image generation
  const { prompt, model, apiKey, inputImages } = await req.json()

  // Build message content - include input images for image-to-image if provided
  let messageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }> = prompt

  if (inputImages && Array.isArray(inputImages) && inputImages.length > 0) {
    // Image-to-image: include input images + text prompt
    messageContent = [
      // Add input images first
      ...inputImages.map((base64Url: string) => ({
        type: 'image_url' as const,
        image_url: { url: base64Url }
      })),
      // Then the text prompt
      {
        type: 'text' as const,
        text: prompt
      }
    ]
    console.log(`[Image Gen] Image-to-image mode with ${inputImages.length} input image(s)`)
  }

  // Send to OpenRouter with multimodal content
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Your App Name',
    },
    body: JSON.stringify({
      model: imageModel,
      modalities: ['image', 'text'], // CRITICAL: Tell OpenRouter to generate images!
      messages: [
        {
          role: 'user',
          content: messageContent  // String OR array with images + text
        }
      ],
      // Add Gemini-specific image config
      ...(imageModel.includes('gemini') && {
        image_config: {
          aspect_ratio: '1:1' // Can be 1:1, 16:9, 9:16, 3:4, 4:3, etc.
        }
      })
    }),
  })

  // ... handle response
}
```

### Frontend Changes (Critical Bug Fix)

**IMPORTANT:** Capture attached images BEFORE clearing the file state!

```typescript
// In your submit handler:

// Create user message with attachments
const userMessage = {
  id: generateId(),
  role: "user",
  content: messageContent,
  attachments: attachedFiles.map(f => ({
    type: f.type.startsWith('image/') ? 'image' : 'file',
    data: f.base64,
    name: f.name
  })),
}

// CRITICAL: Capture attached images BEFORE clearing!
// This was a bug - we were clearing files before using them
const inputImagesForGen = attachedFiles
  .filter(f => f.type.startsWith('image/'))
  .map(f => f.base64)

// Now we can safely clear
addMessage(chatId, userMessage)
setInput("")
setAttachedFiles([])  // Clearing here is now safe

// Use the captured images in the API call
if (imageMode) {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    body: JSON.stringify({
      prompt: messageContent,
      model: imageModel,
      apiKey,
      inputImages: inputImagesForGen,  // Send captured images
    }),
  })
}
```

### User Feedback (Toast Messages)

```typescript
toast({
  title: "🎨 Generating image...",
  description: inputImagesForGen.length > 0
    ? "Editing uploaded image..."
    : "Using Gemini 3 Pro",
})
```

---

## Complete OpenRouter Image Response Handling

The API returns images in various formats. Handle all of them:

```typescript
const data = await response.json()

// Parse response - OpenRouter returns images in message.images[] array
if (data.choices && data.choices[0]?.message) {
  const message = data.choices[0].message

  // CORRECT FORMAT: Check message.images[] array (OpenRouter standard)
  if (message.images && Array.isArray(message.images) && message.images.length > 0) {
    const firstImage = message.images[0]
    if (firstImage?.image_url?.url) {
      console.log('Found image in message.images[] array')
      return { url: firstImage.image_url.url } // Will be base64: data:image/png;base64,...
    }
  }

  // LEGACY FALLBACK: Check content array (older format)
  if (Array.isArray(message.content)) {
    for (const item of message.content) {
      if (item.type === 'image_url' && item.image_url?.url) {
        console.log('Found image in content array (legacy format)')
        return { url: item.image_url.url }
      }
    }
  }

  // Check for image URL in text content (text-based models)
  if (typeof message.content === 'string') {
    const urlMatch = message.content.match(/(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|gif))/i)
    if (urlMatch) {
      console.log('Found image URL in text content')
      return { url: urlMatch[1] }
    }
  }
}
```

---

## Summary of Key Changes

| Issue | Fix |
|-------|-----|
| `TypeError: e.toLowerCase` when searching with image messages | Check `typeof text !== 'string'` and extract text from array parts |
| Inconsistent image models | Always use `google/gemini-3-pro-image-preview` |
| Need image-to-image support | Accept `inputImages` array, build multimodal content |
| attachedFiles empty when generating | Capture images BEFORE calling `setAttachedFiles([])` |
