import { NextRequest, NextResponse } from 'next/server'
import { requireCSRF } from '@/lib/csrf'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

// Simple in-memory rate limit for report endpoint
const reportRateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 reports per minute per IP

function checkReportRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = reportRateLimit.get(ip)

  if (!entry || entry.resetAt < now) {
    reportRateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// Create client inside handler to avoid build-time initialization
function getSupabaseClient() {
  return createSupabaseServiceClient()
}

export async function POST(req: NextRequest) {
  // CSRF protection
  const csrfError = requireCSRF(req)
  if (csrfError) return csrfError

  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown'

    if (!checkReportRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many reports. Please try again later.' },
        { status: 429 }
      )
    }

    const { jobId, reason } = await req.json()

    if (!jobId || !reason) {
      return NextResponse.json({ error: 'Missing jobId or reason' }, { status: 400 })
    }

    // Validate reason length (prevent spam)
    if (typeof reason !== 'string' || reason.length > 1000) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    // Initialize client at runtime
    const supabase = getSupabaseClient()

    // Insert report into database (table name matches Prisma model: JobReport)
    const { error } = await supabase
      .from('JobReport')
      .insert({
        id: crypto.randomUUID(),
        jobId: jobId,
        reason,
        reporterIp: ip !== 'unknown' ? ip : null,
        createdAt: new Date().toISOString(),
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
