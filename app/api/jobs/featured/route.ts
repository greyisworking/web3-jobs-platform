/**
 * GET /api/jobs/featured
 * Returns 8 randomized featured jobs for homepage.
 * Cached for 5 minutes with stale-while-revalidate.
 */

import { NextResponse } from 'next/server'
import { getFeaturedJobs } from '@/lib/featured-jobs'
import { cache, cacheKeys } from '@/lib/cache'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
  try {
    const jobs = await cache.getOrFetch(
      cacheKeys.featuredJobs(),
      getFeaturedJobs,
      { ttlMs: CACHE_TTL, staleMs: CACHE_TTL * 2 }
    )

    return NextResponse.json(
      { jobs },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, max-age=300',
          'Vercel-CDN-Cache-Control': 'public, max-age=300',
        },
      }
    )
  } catch (err) {
    console.error('GET /api/jobs/featured error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
