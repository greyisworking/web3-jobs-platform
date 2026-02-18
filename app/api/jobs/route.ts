import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSafeLikePattern } from '@/lib/sanitize'
import { cache, cacheKeys } from '@/lib/cache'

export const dynamic = 'force-dynamic'

// List fields for job cards (exclude heavy fields)
const LIST_FIELDS = [
  'id', 'title', 'company', 'url', 'location', 'type', 'category', 'role',
  'salary', 'salaryMin', 'salaryMax', 'salaryCurrency', 'tags', 'source', 'region',
  'postedDate', 'crawledAt', 'updatedAt', 'isActive',
  'experienceLevel', 'remoteType', 'companyLogo',
  'backers', 'sector', 'badges', 'is_featured', 'is_urgent'
].join(',')

// Cache TTL: 1 minute fresh, 5 minutes stale
const CACHE_TTL = 60 * 1000
const CACHE_STALE = 5 * 60 * 1000

interface JobsData {
  jobs: any[]
  stats: {
    total: number
    global: number
    korea: number
    sources: { source: string; _count: number }[]
  }
}

async function fetchJobsFromDB(filters: {
  badge?: string
  backer?: string
  sector?: string
  company?: string
  limit: number
}): Promise<JobsData> {
  const supabase = await createSupabaseServerClient()

  // 3 months ago for freshness filter
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  let query = supabase
    .from('Job')
    .select(LIST_FIELDS)
    .eq('isActive', true)
    .gte('crawledAt', threeMonthsAgo.toISOString())
    .order('crawledAt', { ascending: false })
    .limit(Math.min(filters.limit, 500))

  if (filters.badge) {
    query = query.contains('badges', [filters.badge])
  }
  if (filters.backer) {
    query = query.contains('backers', [filters.backer])
  }
  if (filters.sector) {
    query = query.eq('sector', filters.sector)
  }
  if (filters.company) {
    query = query.ilike('company', createSafeLikePattern(filters.company))
  }

  // Parallel fetch: jobs + stats
  const [jobsResult, totalResult, globalResult, koreaResult] = await Promise.all([
    query,
    supabase.from('Job').select('id', { count: 'exact', head: true }).eq('isActive', true),
    supabase.from('Job').select('id', { count: 'exact', head: true }).eq('isActive', true).eq('region', 'Global'),
    supabase.from('Job').select('id', { count: 'exact', head: true }).eq('isActive', true).eq('region', 'Korea'),
  ])

  const jobs = jobsResult.data ?? []

  // Compute source distribution from fetched jobs
  const sourceCounts = new Map<string, number>()
  for (const job of jobs as Array<{ source?: string }>) {
    const src = job.source ?? 'unknown'
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1)
  }

  return {
    jobs,
    stats: {
      total: totalResult.count ?? 0,
      global: globalResult.count ?? 0,
      korea: koreaResult.count ?? 0,
      sources: Array.from(sourceCounts.entries())
        .map(([source, _count]) => ({ source, _count }))
        .sort((a, b) => b._count - a._count),
    },
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const badge = searchParams.get('badge') || undefined
    const backer = searchParams.get('backer') || undefined
    const sector = searchParams.get('sector') || undefined
    const company = searchParams.get('company') || undefined
    const limit = parseInt(searchParams.get('limit') || '300', 10)

    // Build cache key from filters
    const filters = { badge, backer, sector, company, limit }
    const hasFilters = badge || backer || sector || company
    const cacheKey = hasFilters
      ? cacheKeys.jobsFiltered({ badge: badge || '', backer: backer || '', sector: sector || '', company: company || '' })
      : cacheKeys.jobs()

    // Use cache for unfiltered requests (most common)
    const data = hasFilters
      ? await fetchJobsFromDB(filters)
      : await cache.getOrFetch(cacheKey, () => fetchJobsFromDB(filters), {
          ttlMs: CACHE_TTL,
          staleMs: CACHE_STALE,
        })

    // Return with aggressive cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, max-age=60',
        'Vercel-CDN-Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error) {
    console.error('Jobs API Error:', error)
    return NextResponse.json(
      { jobs: [], stats: { total: 0, global: 0, korea: 0, sources: [] } },
      { status: 500 }
    )
  }
}
