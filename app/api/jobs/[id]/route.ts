import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { cache, cacheKeys } from '@/lib/cache'

// Cache job details for 5 minutes
const CACHE_TTL = 5 * 60 * 1000

async function fetchJob(id: string) {
  const supabase = await createSupabaseServerClient()

  const { data: job, error } = await supabase
    .from('Job')
    .select('*')
    .eq('id', id)
    .eq('isActive', true)
    .single()

  if (error || !job) return null
  return job
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const job = await cache.getOrFetch(
      cacheKeys.jobById(id),
      () => fetchJob(id),
      { ttlMs: CACHE_TTL, staleMs: CACHE_TTL * 2 }
    )

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
