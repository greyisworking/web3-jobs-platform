import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface JobForNewsletter {
  id: string
  title: string
  company: string
  location: string
  role: string | null
  salary: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  remoteType: string | null
  is_featured: boolean | null
  crawledAt: string | null
  postedDate: string | null
}

interface NewsletterStats {
  totalJobs: number
  roleBreakdown: Record<string, number>
  remoteRate: number
  locationBreakdown: Record<string, number>
  topCompanies: { name: string; count: number }[]
}

// GET: Fetch jobs for newsletter generation
export async function GET(request: Request) {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7')
  const limit = parseInt(searchParams.get('limit') || '100')

  const supabase = await createSupabaseServerClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Fetch recent jobs
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, location, url, role, salary, salaryMin, salaryMax, salaryCurrency, remoteType, is_featured, crawledAt, postedDate, backers')
    .eq('isActive', true)
    .gte('crawledAt', startDate.toISOString())
    .order('crawledAt', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate stats
  const stats = calculateStats(jobs || [])

  // Fetch previous newsletter to check for duplicates
  const { data: lastNewsletter } = await supabase
    .from('newsletter_history')
    .select('job_ids')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const previousJobIds = lastNewsletter?.job_ids || []

  // Mark jobs that were in previous newsletter
  const jobsWithMeta = (jobs || []).map(job => ({
    ...job,
    wasInPreviousNewsletter: previousJobIds.includes(job.id),
  }))

  return NextResponse.json({
    jobs: jobsWithMeta,
    stats,
    period: { days, startDate: startDate.toISOString() },
  })
}

// POST: Save newsletter to history
export async function POST(request: Request) {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, contentMd, contentHtml, jobIds } = body

  if (!title || !contentMd || !jobIds) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('newsletter_history')
    .insert({
      title,
      content_md: contentMd,
      content_html: contentHtml,
      job_ids: jobIds,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, newsletter: data })
}

function calculateStats(jobs: JobForNewsletter[]): NewsletterStats {
  const roleBreakdown: Record<string, number> = {}
  const locationBreakdown: Record<string, number> = {}
  const companyCount: Record<string, number> = {}
  let remoteCount = 0

  for (const job of jobs) {
    // Role breakdown
    const role = job.role || 'Other'
    roleBreakdown[role] = (roleBreakdown[role] || 0) + 1

    // Location breakdown
    const location = normalizeLocation(job.location)
    locationBreakdown[location] = (locationBreakdown[location] || 0) + 1

    // Remote count
    if (job.remoteType === 'Remote' || job.location?.toLowerCase().includes('remote')) {
      remoteCount++
    }

    // Company count
    companyCount[job.company] = (companyCount[job.company] || 0) + 1
  }

  // Top companies
  const topCompanies = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  return {
    totalJobs: jobs.length,
    roleBreakdown,
    remoteRate: jobs.length > 0 ? Math.round((remoteCount / jobs.length) * 100) : 0,
    locationBreakdown,
    topCompanies,
  }
}

function normalizeLocation(location: string): string {
  if (!location) return 'Unknown'
  const lower = location.toLowerCase()
  if (lower.includes('remote')) return 'Remote'
  if (lower.includes('korea') || lower.includes('seoul') || lower.includes('한국')) return 'Korea'
  if (lower.includes('usa') || lower.includes('united states') || lower.includes('new york') || lower.includes('san francisco')) return 'USA'
  if (lower.includes('europe') || lower.includes('london') || lower.includes('berlin')) return 'Europe'
  if (lower.includes('singapore')) return 'Singapore'
  return 'Other'
}
