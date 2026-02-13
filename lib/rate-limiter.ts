/**
 * Database-backed Rate Limiter
 *
 * Uses Supabase to track rate limits persistently across deploys.
 * Falls back to in-memory when DB is unavailable.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface RateLimitEntry {
  key: string
  count: number
  reset_at: string
  created_at: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

// In-memory fallback (for when DB is unavailable)
const memoryStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check and update rate limit
 *
 * @param key - Unique identifier (e.g., wallet address, IP)
 * @param limit - Max requests allowed in window
 * @param windowMs - Time window in milliseconds
 * @param identifier - Optional prefix for the key (e.g., 'job_submit')
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  identifier: string = 'default'
): Promise<RateLimitResult> {
  const fullKey = `${identifier}:${key}`
  const now = Date.now()
  const resetAt = new Date(now + windowMs)

  // Try database first
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      return await checkRateLimitDB(supabase, fullKey, limit, windowMs)
    } catch (error) {
      console.warn('[RateLimiter] DB error, falling back to memory:', error)
    }
  }

  // Fallback to in-memory
  return checkRateLimitMemory(fullKey, limit, windowMs)
}

async function checkRateLimitDB(
  supabase: SupabaseClient,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  // Try to get existing entry
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('key', key)
    .single()

  if (existing) {
    const entryResetAt = new Date(existing.reset_at)

    // Window expired - reset counter
    if (entryResetAt < now) {
      await supabase
        .from('rate_limits')
        .update({
          count: 1,
          reset_at: resetAt.toISOString(),
        })
        .eq('key', key)

      return { allowed: true, remaining: limit - 1, resetAt }
    }

    // Within window - check limit
    if (existing.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: entryResetAt }
    }

    // Increment counter
    await supabase
      .from('rate_limits')
      .update({ count: existing.count + 1 })
      .eq('key', key)

    return {
      allowed: true,
      remaining: limit - existing.count - 1,
      resetAt: entryResetAt,
    }
  }

  // Create new entry
  await supabase.from('rate_limits').insert({
    key,
    count: 1,
    reset_at: resetAt.toISOString(),
  })

  return { allowed: true, remaining: limit - 1, resetAt }
}

function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const existing = memoryStore.get(key)

  if (existing) {
    // Window expired - reset
    if (existing.resetAt < now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: limit - 1, resetAt: new Date(now + windowMs) }
    }

    // Within window
    if (existing.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: new Date(existing.resetAt) }
    }

    existing.count++
    return {
      allowed: true,
      remaining: limit - existing.count,
      resetAt: new Date(existing.resetAt),
    }
  }

  // New entry
  memoryStore.set(key, { count: 1, resetAt: now + windowMs })
  return { allowed: true, remaining: limit - 1, resetAt: new Date(now + windowMs) }
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
  }
}

/**
 * Clean up expired rate limit entries (run periodically)
 */
export async function cleanupExpiredLimits(): Promise<number> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Clean memory store
    const now = Date.now()
    let cleaned = 0
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt < now) {
        memoryStore.delete(key)
        cleaned++
      }
    }
    return cleaned
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { count } = await supabase
    .from('rate_limits')
    .delete()
    .lt('reset_at', new Date().toISOString())

  return count || 0
}
