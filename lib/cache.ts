/**
 * In-Memory Cache with TTL
 * Simple but effective caching for serverless environment
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

interface CacheOptions {
  ttlMs?: number        // Time to live in milliseconds
  staleMs?: number      // Stale-while-revalidate window
}

const DEFAULT_TTL = 60 * 1000       // 1 minute
const DEFAULT_STALE = 5 * 60 * 1000 // 5 minutes stale-while-revalidate

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private revalidating = new Set<string>()

  /**
   * Get cached value or fetch fresh data
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttlMs = DEFAULT_TTL, staleMs = DEFAULT_STALE } = options
    const now = Date.now()

    const cached = this.cache.get(key)

    if (cached) {
      // Fresh cache - return immediately
      if (now < cached.expiresAt) {
        return cached.data
      }

      // Stale cache - return stale data but revalidate in background
      if (now < cached.expiresAt + staleMs) {
        this.revalidateInBackground(key, fetcher, ttlMs)
        return cached.data
      }
    }

    // No cache or expired - fetch fresh
    return this.fetchAndCache(key, fetcher, ttlMs)
  }

  /**
   * Get cached value (no fetch)
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now < cached.expiresAt + DEFAULT_STALE) {
      return cached.data
    }

    // Fully expired
    this.cache.delete(key)
    return null
  }

  /**
   * Set cache value
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      expiresAt: now + ttlMs,
      createdAt: now,
    })
  }

  /**
   * Invalidate cache by key or pattern
   */
  invalidate(keyOrPattern: string | RegExp): number {
    let count = 0

    if (typeof keyOrPattern === 'string') {
      if (this.cache.delete(keyOrPattern)) count++
    } else {
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key)
          count++
        }
      }
    }

    return count
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    try {
      const data = await fetcher()
      this.set(key, data, ttlMs)
      return data
    } catch (error) {
      // On error, return stale data if available
      const stale = this.cache.get(key)
      if (stale) return stale.data
      throw error
    }
  }

  private revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): void {
    // Prevent multiple concurrent revalidations
    if (this.revalidating.has(key)) return

    this.revalidating.add(key)

    fetcher()
      .then((data) => {
        this.set(key, data, ttlMs)
      })
      .catch((error) => {
        console.error(`Cache revalidation failed for ${key}:`, error)
      })
      .finally(() => {
        this.revalidating.delete(key)
      })
  }
}

// Singleton instance
export const cache = new MemoryCache()

// Helper for common patterns
export const cacheKeys = {
  jobs: () => 'jobs:all',
  jobsFiltered: (filters: Record<string, string>) => `jobs:${JSON.stringify(filters)}`,
  jobById: (id: string) => `job:${id}`,
  featuredJobs: () => 'jobs:featured',
  stats: () => 'stats:global',
  companies: () => 'companies:all',
}
