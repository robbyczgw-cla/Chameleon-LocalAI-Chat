/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or Upstash for distributed rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number
  /**
   * Time window in milliseconds
   */
  windowMs: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Object with `limited` boolean and `remaining` count
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 60, windowMs: 60000 } // Default: 60 requests per minute
): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // If no entry exists or the window has expired, create a new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitMap.set(identifier, { count: 1, resetTime })
    return { limited: false, remaining: config.limit - 1, resetTime }
  }

  // Increment the count
  entry.count++

  // Check if limit is exceeded
  if (entry.count > config.limit) {
    return { limited: true, remaining: 0, resetTime: entry.resetTime }
  }

  return { limited: false, remaining: config.limit - entry.count, resetTime: entry.resetTime }
}

/**
 * Clean up expired entries (call this periodically)
 */
export function cleanupRateLimitMap(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitMap, 5 * 60 * 1000)
}
