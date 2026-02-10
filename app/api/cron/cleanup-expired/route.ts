import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron: runs daily at midnight UTC
// vercel.json: { "path": "/api/cron/cleanup-expired", "schedule": "0 0 * * *" }

export const maxDuration = 60 // 1 minute
export const dynamic = 'force-dynamic'

const MAX_JOB_AGE_DAYS = 90

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const now = new Date()
  const maxAgeDate = new Date(now.getTime() - MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000)

  console.log('🧹 Starting expired job cleanup at', now.toISOString())

  try {
    // 1. Expire jobs with past deadlines
    const { data: deadlineJobs, error: deadlineError } = await supabase
      .from('Job')
      .update({ isActive: false })
      .eq('isActive', true)
      .lt('deadline', now.toISOString())
      .select('id')

    if (deadlineError) {
      console.error('Error expiring deadline jobs:', deadlineError)
    }
    const deadlineExpired = deadlineJobs?.length || 0

    // 2. Expire jobs older than MAX_JOB_AGE_DAYS
    const { data: ageJobs, error: ageError } = await supabase
      .from('Job')
      .update({ isActive: false })
      .eq('isActive', true)
      .lt('postedDate', maxAgeDate.toISOString())
      .select('id')

    if (ageError) {
      console.error('Error expiring old jobs:', ageError)
    }
    const ageExpired = ageJobs?.length || 0

    // 3. Get current stats
    const [activeResult, inactiveResult] = await Promise.all([
      supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', false),
    ])

    const stats = {
      activeJobs: activeResult.count || 0,
      inactiveJobs: inactiveResult.count || 0,
      deadlineExpired,
      ageExpired,
      totalExpired: deadlineExpired + ageExpired,
    }

    console.log(`✅ Cleanup completed:`)
    console.log(`  - Deadline expired: ${deadlineExpired}`)
    console.log(`  - Age expired (>${MAX_JOB_AGE_DAYS} days): ${ageExpired}`)
    console.log(`  - Active jobs remaining: ${stats.activeJobs}`)

    return NextResponse.json({
      success: true,
      ...stats,
      maxAgeDays: MAX_JOB_AGE_DAYS,
      cleanedAt: now.toISOString(),
    })
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error)

    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
