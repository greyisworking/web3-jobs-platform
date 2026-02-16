import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// HTML entity patterns to detect
const HTML_ENTITY_PATTERNS = [
  /&lt;/i,
  /&gt;/i,
  /&amp;(?!amp;|lt;|gt;|nbsp;|quot;|#\d+;)/i,
  /&nbsp;/i,
  /&#\d+;/i,
]

function hasHtmlEntities(text: string | null): boolean {
  if (!text) return false
  return HTML_ENTITY_PATTERNS.some(pattern => pattern.test(text))
}

export async function GET(request: NextRequest) {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const badge = searchParams.get('badge') || undefined
  const backer = searchParams.get('backer') || undefined
  const sector = searchParams.get('sector') || undefined
  const posted = searchParams.get('posted') === 'true'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
  const offset = (page - 1) * pageSize

  // New filter parameters for quality tracking
  const filter = searchParams.get('filter') // 'all', 'today', 'no-jd', 'unknown-company', 'html-errors'
  const source = searchParams.get('source')
  const search = searchParams.get('search')

  const supabase = await createSupabaseServerClient()

  // Get list of all sources
  const { data: sourcesData } = await supabase
    .from('Job')
    .select('source')
    .eq('isActive', true)

  const uniqueSources = [...new Set(sourcesData?.map(j => j.source) || [])]
    .filter(Boolean)
    .sort()

  // Determine if we need client-side filtering
  const needsClientFilter = filter === 'no-jd' || filter === 'html-errors'
  const fetchLimit = needsClientFilter ? Math.max(pageSize * 10, 500) : pageSize

  // Calculate date thresholds
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  let query = supabase
    .from('Job')
    .select('*', { count: 'exact' })
    .order('crawledAt', { ascending: false })

  // Apply source filter
  if (source) {
    query = query.eq('source', source)
  }

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`)
  }

  // Apply special filters
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filter) {
    case 'today':
      query = query.gte('crawledAt', todayStart.toISOString())
      break
    case 'unknown-company':
      query = query.or('company.is.null,company.eq.UNKNOWN,company.eq.unknown,company.eq.')
      break
    case 'old':
      // Jobs older than 60 days
      query = query.lt('crawledAt', sixtyDaysAgo.toISOString())
      break
    case 'no-jd':
    case 'html-errors':
      // Will filter client-side
      break
  }

  // Apply legacy filters
  if (posted) {
    query = query.or('source.eq.user-posted,postedBy.not.is.null')
  }

  if (status) {
    const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined
    if (isActive !== undefined) {
      query = query.eq('isActive', isActive)
    }
  } else if (!filter || filter === 'all') {
    // Default to active only for quality filters
    query = query.eq('isActive', true)
  }

  if (badge) {
    query = query.contains('badges', [badge])
  }
  if (backer) {
    query = query.contains('backers', [backer])
  }
  if (sector) {
    query = query.eq('sector', sector)
  }

  // Apply pagination
  if (needsClientFilter) {
    query = query.range(0, fetchLimit - 1)
  } else {
    query = query.range(offset, offset + pageSize - 1)
  }

  const { data: jobs, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let filteredJobs = jobs || []
  let totalCount = count || 0

  // Client-side filtering for complex conditions
  if (filter === 'no-jd') {
    filteredJobs = filteredJobs.filter(job => !job.description || job.description.trim().length <= 50)
    totalCount = filteredJobs.length
    filteredJobs = filteredJobs.slice(offset, offset + pageSize)
  } else if (filter === 'html-errors') {
    filteredJobs = filteredJobs.filter(job => hasHtmlEntities(job.description))
    totalCount = filteredJobs.length
    filteredJobs = filteredJobs.slice(offset, offset + pageSize)
  }

  return NextResponse.json({
    jobs: filteredJobs,
    total: totalCount,
    page,
    pageSize,
    sources: uniqueSources,
  })
}
