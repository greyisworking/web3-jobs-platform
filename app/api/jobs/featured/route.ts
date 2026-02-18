/**
 * GET /api/jobs/featured
 * Returns top 6 featured jobs for homepage display.
 * Cached for 5 minutes with stale-while-revalidate.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { cache, cacheKeys } from '@/lib/cache'

export const dynamic = 'force-dynamic'

// Fields for job cards (minimal payload)
const LIST_FIELDS = [
  'id', 'title', 'company', 'url', 'location', 'type', 'category',
  'salary', 'salaryMin', 'salaryMax', 'salaryCurrency', 'tags', 'source', 'region',
  'postedDate', 'crawledAt', 'updatedAt', 'isActive',
  'experienceLevel', 'remoteType', 'companyLogo',
  'backers', 'sector', 'badges', 'is_featured', 'is_urgent'
].join(',')

// Cache for 5 minutes
const CACHE_TTL = 5 * 60 * 1000

async function fetchFeaturedJobs() {
  const supabase = await createSupabaseServerClient()

  // Prioritize: is_featured > priority sources > recent jobs
  const { data: jobs, error } = await supabase
    .from('Job')
    .select(LIST_FIELDS)
    .eq('isActive', true)
    .or('is_featured.eq.true,source.in.(priority:greenhouse,priority:lever,priority:ashby)')
    .order('is_featured', { ascending: false, nullsFirst: false })
    .order('postedDate', { ascending: false })
    .limit(6)

  if (error) throw error
  return jobs ?? []
}

export async function GET() {
  try {
    const jobs = await cache.getOrFetch(
      cacheKeys.featuredJobs(),
      fetchFeaturedJobs,
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
