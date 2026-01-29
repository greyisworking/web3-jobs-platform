import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Fetch reports with job info
    const { data: reports, error } = await supabase
      .from('JobReport')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(100)

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ reports: [] })
      }
      throw error
    }

    // Enrich with job data
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report) => {
        const { data: job } = await supabase
          .from('Job')
          .select('id, title, company, postedBy, reportCount, isHidden')
          .eq('id', report.jobId)
          .single()

        return { ...report, job }
      })
    )

    return NextResponse.json({ reports: enrichedReports })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ reports: [] })
  }
}
