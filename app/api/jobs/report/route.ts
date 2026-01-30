import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { jobId, reason } = await req.json()

    if (!jobId || !reason) {
      return NextResponse.json({ error: 'Missing jobId or reason' }, { status: 400 })
    }

    // Insert report into database
    const { error } = await supabase
      .from('job_reports')
      .insert({
        job_id: jobId,
        reason,
        reported_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to save report:', error)
      // Still return success to user even if DB fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}
