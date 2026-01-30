// ════════════════════════════════════════════════════════════════════════════
// Rate Limiting
// In-memory rate limiter with sliding window
// ════════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

// Default rate limit configs for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,          // 10 attempts per 15 min
  },

  // Trust system actions
  vouch: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,          // 20 vouches per hour
  },
  report: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,          // 10 reports per hour
  },
  vote: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,          // 50 votes per hour
  },

  // Content creation
  jobSubmit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,           // 5 job posts per hour
  },
  articleWrite: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,          // 10 articles per hour
  },
  comment: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 comments per minute
  },

  // API calls
  search: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 searches per minute
  },
  profileSync: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,           // 5 syncs per minute
  },

  // General API
  api: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requests per minute
  },

  // Strict limit for sensitive operations
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,           // 5 requests per hour
  },
}

export type RateLimitType = keyof typeof RATE_LIMITS

/**
 * Check rate limit for an identifier
 * Returns { limited: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): { limited: boolean; remaining: number; resetAt: number; retryAfter?: number } {
  const config = RATE_LIMITS[type]
  const key = `${type}:${identifier}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  // No existing entry or window expired
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Check if over limit
  if (entry.count >= config.maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    limited: false,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get client identifier from request
 * Uses IP address and optionally wallet address
 */
export function getClientIdentifier(
  ip: string | null,
  wallet?: string
): string {
  // Prefer wallet address if available (more accurate for Web3)
  if (wallet) {
    return wallet.toLowerCase()
  }

  // Fall back to IP
  return ip || 'anonymous'
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: {
  remaining: number
  resetAt: number
  retryAfter?: number
}): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  }

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }

  return headers
}

// ════════════════════════════════════════════════════════════════════════════
// Rate Limit Response Helper
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'

export function rateLimitedResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      code: 'RATE_LIMITED',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    }
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Middleware Helper
// ════════════════════════════════════════════════════════════════════════════

export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  type: RateLimitType = 'api'
) {
  return async (req: Request): Promise<Response> => {
    // Get IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0]?.trim() || req.headers.get('x-real-ip')

    const identifier = getClientIdentifier(ip)
    const result = checkRateLimit(identifier, type)

    if (result.limited) {
      return rateLimitedResponse(result.retryAfter!)
    }

    // Execute handler
    const response = await handler(req)

    // Add rate limit headers
    const headers = getRateLimitHeaders(result)
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value)
    }

    return response
  }
}
