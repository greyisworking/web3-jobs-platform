import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * POST: Verify bookmark status for a list of job IDs
 * Body: { jobIds: string[] }
 * Response: { verified: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobIds } = body

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ verified: [] })
    }

    // Filter valid UUID format to prevent invalid values in Supabase uuid column
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validIds = jobIds.filter((id: string) => uuidRegex.test(id))

    if (validIds.length === 0) {
      return NextResponse.json({ verified: [] })
    }

    const supabase = await createSupabaseServerClient()

    // Query jobs that are active or have 'Verified' badge
    const { data, error } = await supabase
      .from('Job')
      .select('id, isActive, badges')
      .in('id', validIds)

    if (error) {
      console.error('Bookmark verify error:', error)
      return NextResponse.json({ verified: [] })
    }

    const verified = (data ?? [])
      .filter((job) => {
        const isActive = job.isActive === true
        const hasVerifiedBadge = Array.isArray(job.badges) && job.badges.includes('Verified')
        return isActive || hasVerifiedBadge
      })
      .map((job) => job.id)

    return NextResponse.json({ verified })
  } catch (error) {
    console.error('Bookmark verify POST error:', error)
    return NextResponse.json({ verified: [] })
  }
}
