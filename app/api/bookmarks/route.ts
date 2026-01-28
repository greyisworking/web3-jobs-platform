import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET: Fetch current user's bookmarks (with job details)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ bookmarks: [] }, { status: 401 })
    }

    // Get bookmark records
    const { data: bookmarks, error: bmError } = await supabase
      .from('bookmarks')
      .select('job_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (bmError) {
      console.error('Bookmarks fetch error:', bmError)
      return NextResponse.json({ bookmarks: [] })
    }

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({ bookmarks: [] })
    }

    // Fetch job details for bookmarked jobs
    const jobIds = bookmarks.map((b) => b.job_id)
    const { data: jobs } = await supabase
      .from('Job')
      .select('id, title, company, location')
      .in('id', jobIds)

    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]))

    const result = bookmarks
      .map((b) => {
        const job = jobMap.get(b.job_id)
        if (!job) return null
        return {
          id: b.job_id,
          title: job.title,
          company: job.company,
          location: job.location,
          savedAt: b.created_at,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ bookmarks: result })
  } catch (error) {
    console.error('Bookmarks GET error:', error)
    return NextResponse.json({ bookmarks: [] })
  }
}

// POST: Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, job_id: jobId })

    if (error) {
      // Duplicate key = already bookmarked, not a real error
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, already: true })
      }
      console.error('Bookmark insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bookmarks POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE: Remove a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId)

    if (error) {
      console.error('Bookmark delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bookmarks DELETE error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
