import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()

  // Fetch bookmarks
  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    // Table might not exist yet
    if (error.code === '42P01') {
      return NextResponse.json({
        bookmarks: [],
        stats: { total: 0, uniqueUsers: 0, uniqueJobs: 0 },
      })
    }
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Enrich with job data
  const jobIds = [...new Set((bookmarks || []).map(b => b.job_id).filter(Boolean))]
  const { data: jobs } = await supabase
    .from('Job')
    .select('id, title, company, source')
    .in('id', jobIds)

  const jobMap = new Map(jobs?.map(j => [j.id, j]) || [])

  const enrichedBookmarks = (bookmarks || []).map(bookmark => ({
    ...bookmark,
    job: jobMap.get(bookmark.job_id) || null,
  }))

  // Calculate stats
  const uniqueUsers = new Set((bookmarks || []).map(b => b.user_id)).size
  const uniqueJobs = new Set((bookmarks || []).map(b => b.job_id)).size

  return NextResponse.json({
    bookmarks: enrichedBookmarks,
    stats: {
      total: bookmarks?.length || 0,
      uniqueUsers,
      uniqueJobs,
    },
  })
}
