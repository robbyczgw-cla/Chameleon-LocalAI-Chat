# 🔌 API Reference

Complete documentation for all API routes in Chameleon Chat.

---

## Overview

All API routes use:
- **Edge Runtime** (Cloudflare Workers)
- **Streaming responses** for real-time data
- **Error handling** with try-catch
- **Rate limiting** (future feature)

**Base URL:** `https://your-domain.com/api`

---

## POST `/api/chat`

Main endpoint for LLM chat completions with streaming.

### Request

```typescript
POST /api/chat
Content-Type: application/json

{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant..." },
    { "role": "user", "content": "Hello!" }
  ],
  "model": "x-ai/grok-4-fast",          // OpenRouter model ID
  "temperature": 0.7,                    // Optional, 0.0-2.0
  "maxTokens": 2000,                     // Optional, 100-8000
  "topP": 1.0,                          // Optional, 0.0-1.0
  "frequencyPenalty": 0.0,              // Optional, 0.0-2.0
  "presencePenalty": 0.0,               // Optional, 0.0-2.0
  "apiKey": "sk-or-v1-..."              // OpenRouter API key
}
```

### Response (Streaming)

**Content-Type:** `text/event-stream`

```
data: {"chunk":"Hello"}
data: {"chunk":" there"}
data: {"chunk":"!"}
data: {"done":true,"usage":{"prompt_tokens":20,"completion_tokens":5}}
```

### Response Format

Each line is a JSON object with:

**Chunk event:**
```json
{
  "chunk": "text content"
}
```

**Done event:**
```json
{
  "done": true,
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 300,
    "total_tokens": 450
  },
  "model": "x-ai/grok-4-fast"
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Example Usage

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    model: 'x-ai/grok-4-fast',
    apiKey: 'sk-or-v1-...'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.chunk) {
        console.log(data.chunk);
      } else if (data.done) {
        console.log('Usage:', data.usage);
      }
    }
  }
}
```

---

## POST `/api/search`

Tavily web search integration.

### Request

```typescript
POST /api/search
Content-Type: application/json

{
  "query": "Latest AI news",
  "maxResults": 5,                      // Optional, 1-10, default 5
  "searchDepth": "basic",               // Optional, "basic" | "advanced"
  "includeImages": false,               // Optional, default false
  "apiKey": "tvly-..."                  // Tavily API key
}
```

### Response

```json
{
  "results": [
    {
      "title": "Article title",
      "url": "https://example.com/article",
      "content": "Article summary...",
      "score": 0.95,
      "publishedDate": "2025-01-15"
    }
  ],
  "query": "Latest AI news",
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "description": "Image description"
    }
  ]
}
```

### Error Response

```json
{
  "error": "Search failed",
  "details": "API key invalid"
}
```

---

## POST `/api/serper`

Serper (Google Search) integration.

### Request

```typescript
POST /api/serper
Content-Type: application/json

{
  "query": "Best React hooks 2025",
  "num": 10,                            // Optional, 1-100, default 10
  "gl": "at",                          // Optional, country code (at, de, us)
  "hl": "de",                          // Optional, language (de, en, es)
  "type": "search",                    // Optional, "search" | "images"
  "apiKey": "..."                      // Serper API key
}
```

### Response

```json
{
  "searchParameters": {
    "q": "Best React hooks 2025",
    "gl": "at",
    "hl": "de",
    "num": 10
  },
  "organic": [
    {
      "title": "Top React Hooks in 2025",
      "link": "https://example.com",
      "snippet": "Complete guide to React hooks...",
      "position": 1
    }
  ],
  "images": [
    {
      "imageUrl": "https://example.com/image.jpg",
      "imageWidth": 800,
      "imageHeight": 600,
      "title": "React Hooks Diagram"
    }
  ],
  "credits": 1                          // API credits used
}
```

---

## Rate Limiting

**Current:** No rate limiting
**Planned:**
- 100 requests/minute per user
- 1000 requests/hour per user
- Based on Supabase user ID

---

## Authentication

**All endpoints require:**
- Valid Supabase session (JWT token in cookie)
- User-provided API keys (OpenRouter, Tavily, Serper)

**Middleware checks:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/api/chat')) {
    return new Response('Unauthorized', { status: 401 })
  }

  return NextResponse.next()
}
```

---

## Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 400 | Bad Request | Invalid request body |
| 401 | Unauthorized | No Supabase session |
| 403 | Forbidden | Invalid API key |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | OpenRouter/Tavily/Serper down |

---

## OpenRouter Integration

### Model Selection

**100+ models available:**
- `openai/gpt-4o`
- `anthropic/claude-3.5-sonnet`
- `google/gemini-pro-1.5`
- `x-ai/grok-4-fast`
- `deepseek/deepseek-chat`
- ...and more

**Full list:** https://openrouter.ai/docs#models

### Streaming

Uses **Server-Sent Events (SSE):**
```
GET https://openrouter.ai/api/v1/chat/completions
Content-Type: application/json

{
  "model": "x-ai/grok-4-fast",
  "messages": [...],
  "stream": true
}
```

**Response:**
```
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"}}]}
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" there"}}]}
data: [DONE]
```

---

## Future API Routes

**Planned:**

- `POST /api/tts` - Text-to-speech (ElevenLabs)
- `POST /api/stt` - Speech-to-text (Whisper)
- `POST /api/image` - Image generation (DALL-E 3)
- `GET /api/models` - List available models
- `GET /api/usage` - Get API usage stats
- `POST /api/feedback` - Submit feedback
- `POST /api/share` - Share conversation

---

## SDK / Client Libraries

**JavaScript/TypeScript:**
```typescript
import { ChameleonClient } from '@chameleon/client'

const client = new ChameleonClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  openRouterKey: process.env.OPENROUTER_API_KEY
})

// Stream chat
await client.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'grok-4-fast',
  onChunk: (chunk) => console.log(chunk),
  onDone: (usage) => console.log('Tokens:', usage.total_tokens)
})
```

**Python:**
```python
from chameleon import ChameleonClient

client = ChameleonClient(
    supabase_url=os.getenv('SUPABASE_URL'),
    supabase_key=os.getenv('SUPABASE_KEY'),
    openrouter_key=os.getenv('OPENROUTER_KEY')
)

# Stream chat
for chunk in client.chat(
    messages=[{"role": "user", "content": "Hello!"}],
    model="grok-4-fast"
):
    print(chunk, end='', flush=True)
```

*(SDKs coming soon!)*

---

## Testing

**Postman Collection:**
- Download: [chameleon-api.postman_collection.json](./postman/)
- Import to Postman
- Set environment variables
- Test all endpoints

**cURL Examples:**

```bash
# Chat completion
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"Hello!"}],
    "model": "x-ai/grok-4-fast",
    "apiKey": "sk-or-v1-..."
  }'

# Tavily search
curl -X POST https://your-domain.com/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Latest AI news",
    "maxResults": 5,
    "apiKey": "tvly-..."
  }'

# Serper search
curl -X POST https://your-domain.com/api/serper \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Best React hooks",
    "num": 10,
    "gl": "at",
    "apiKey": "..."
  }'
```

---

## Security Best Practices

1. **Never expose API keys in client-side code**
   - Store in environment variables
   - Pass through secure backend routes

2. **Validate all input**
   - Check message formats
   - Sanitize user content
   - Limit message length

3. **Rate limit requests**
   - Prevent abuse
   - Protect against DoS

4. **Use HTTPS**
   - Always encrypt in transit
   - Vercel provides free SSL

5. **Log errors, not secrets**
   - Don't log API keys
   - Sanitize error messages

---

**Need help?** Open an issue on GitHub or check the [User Guide](./user-guide.md).
