import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

// Image generation models (multimodal models that can generate images)
const IMAGE_MODELS = {
  // Google Gemini Image models (primary)
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

/**
 * Generate images using OpenRouter's image models
 * Only works with actual image models (DALL-E, Flux, SD)
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting: Get client identifier (IP or forwarded IP)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = checkRateLimit(`image:${clientIp}`, { limit: 20, windowMs: 60000 }) // 20 image requests per minute

    if (rateLimitResult.limited) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many image generation requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const { prompt, model, apiKey } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Default to Gemini 2.5 Flash Image if model not specified or not an image model
    const imageModel = IMAGE_MODELS[model as keyof typeof IMAGE_MODELS]
      ? model
      : 'google/gemini-2.5-flash-image'

    const modelConfig = IMAGE_MODELS[imageModel as keyof typeof IMAGE_MODELS]
    console.log(`[Image Gen] Using model: ${imageModel}, config:`, modelConfig)

    // For classic DALL-E (non-multimodal), use dedicated images endpoint
    if (imageModel === 'openai/dall-e-3' || imageModel === 'openai/dall-e-2') {
      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: imageModel.replace('openai/', ''),
            prompt,
            n: 1,
            size: modelConfig.size || '1024x1024',
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data[0]?.url) {
            return NextResponse.json({
              url: data.data[0].url,
              model: imageModel,
              prompt,
            })
          }
        }

        const error = await response.json()
        throw new Error(error.error?.message || 'DALL-E generation failed')
      } catch (error: any) {
        console.warn('DALL-E API failed:', error.message)
        // Don't fallback for DALL-E, return error
        return NextResponse.json(
          { error: `DALL-E failed: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // For multimodal models (GPT-5 Image, Gemini Image, Flux, SD), use OpenRouter chat
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Chameleon Chat',
      },
      body: JSON.stringify({
        model: imageModel,
        modalities: ['image', 'text'], // CRITICAL: Tell OpenRouter to generate images!
        messages: [
          {
            role: 'user',
            content: prompt
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

    if (!response.ok) {
      let error
      try {
        error = await response.json()
      } catch (e) {
        const text = await response.text()
        console.error('OpenRouter image error (non-JSON):', text)
        return NextResponse.json(
          { error: `Image generation failed: ${text}` },
          { status: response.status }
        )
      }
      console.error('OpenRouter image error:', error)
      return NextResponse.json(
        {
          error: error.error?.message || `Image generation failed`,
          details: error
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Image Gen] Full Response:', JSON.stringify(data, null, 2))

    // Parse response - OpenRouter returns images in message.images[] array
    if (data.choices && data.choices[0]?.message) {
      const message = data.choices[0].message

      // CORRECT FORMAT: Check message.images[] array (OpenRouter standard)
      if (message.images && Array.isArray(message.images) && message.images.length > 0) {
        const firstImage = message.images[0]
        if (firstImage?.image_url?.url) {
          console.log('[Image Gen] ✅ Found image in message.images[] array')
          return NextResponse.json({
            url: firstImage.image_url.url, // Will be base64: data:image/png;base64,...
            model: imageModel,
            prompt,
          })
        }
      }

      // LEGACY FALLBACK: Check content array (older format)
      if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item.type === 'image_url' && item.image_url?.url) {
            console.log('[Image Gen] Found image in content array (legacy format)')
            return NextResponse.json({
              url: item.image_url.url,
              model: imageModel,
              prompt,
            })
          }
        }
      }

      // Check for image URL in text content (text-based models)
      if (typeof message.content === 'string') {
        const urlMatch = message.content.match(/(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|gif))/i)
        if (urlMatch) {
          console.log('[Image Gen] Found image URL in text content')
          return NextResponse.json({
            url: urlMatch[1],
            model: imageModel,
            prompt,
          })
        }
      }
    }

    // Log the full response for debugging
    console.error('[Image Gen] Could not extract image URL. Full response:', JSON.stringify(data, null, 2))

    return NextResponse.json(
      {
        error: `Image model "${imageModel}" may not support image generation yet through OpenRouter. Try using DALL-E 3 (requires OpenAI API key) or check OpenRouter docs for supported image models.`,
        debugInfo: {
          model: imageModel,
          responseStructure: data.choices?.[0]?.message?.content ? 'has content' : 'no content',
          contentType: typeof data.choices?.[0]?.message?.content
        }
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
