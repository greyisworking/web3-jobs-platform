/**
 * Check for expired jobs by validating URLs and age
 * Marks jobs as "expired" if:
 * 1. Source URL returns 404 or contains closed text
 * 2. Job deadline has passed
 * 3. Job is older than 3 months (90 days)
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import 'dotenv/config'

// Max age in days before auto-expiring
const MAX_JOB_AGE_DAYS = 60

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// User agent to avoid being blocked
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Keywords that STRONGLY indicate a job is closed/expired
// Be conservative to avoid false positives
const EXPIRED_KEYWORDS = [
  'this job is no longer available',
  'this position has been filled',
  'this job has been closed',
  'this role has been filled',
  'no longer accepting applications',
  'job not found',  // Ashby, Lever specific
  'sorry, this job',
]

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if page content indicates the job is closed
 */
function hasExpiredText(html: string): boolean {
  const lowerHtml = html.toLowerCase()
  return EXPIRED_KEYWORDS.some(keyword => lowerHtml.includes(keyword.toLowerCase()))
}

/**
 * Check if a URL is still valid (not 404) and job is still open
 */
async function checkUrlStatus(url: string): Promise<{ isValid: boolean; statusCode: number | null; reason?: string }> {
  try {
    // First try HEAD request
    const headResponse = await axios.head(url, {
      timeout: 10000,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
      validateStatus: () => true,
    })

    // 404, 410 (Gone) = definitely expired
    if (headResponse.status === 404 || headResponse.status === 410) {
      return { isValid: false, statusCode: headResponse.status, reason: 'HTTP ' + headResponse.status }
    }

    // 5xx errors = server issue, keep as is
    if (headResponse.status >= 500) {
      return { isValid: true, statusCode: headResponse.status }
    }

    // For 200 responses, check page content for expired keywords
    if (headResponse.status === 200) {
      try {
        const getResponse = await axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': USER_AGENT },
          maxRedirects: 5,
          validateStatus: () => true,
        })

        if (typeof getResponse.data === 'string' && hasExpiredText(getResponse.data)) {
          return { isValid: false, statusCode: 200, reason: 'Closed text detected' }
        }
      } catch {
        // If GET fails, just use HEAD result
      }
    }

    // Other statuses
    const isValid = headResponse.status < 400 || headResponse.status === 403
    return { isValid, statusCode: headResponse.status }
  } catch (error: any) {
    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return { isValid: false, statusCode: null, reason: 'Connection failed' }
    }
    // Timeout or other errors - keep as is
    return { isValid: true, statusCode: null }
  }
}

/**
 * Expire jobs based on deadline or age (no URL check needed)
 */
async function expireByDeadlineOrAge(): Promise<{ deadlineExpired: number; ageExpired: number }> {
  const now = new Date()
  const maxAgeDate = new Date(now.getTime() - MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000)

  console.log('📅 Checking deadline-based and age-based expiration...\n')

  // 1. Expire jobs with past deadlines
  const { data: deadlineJobs, error: deadlineError } = await supabase
    .from('Job')
    .update({
      isActive: false,
      deactivatedAt: now.toISOString(),
      deactivationReason: 'deadline_passed',
    })
    .eq('isActive', true)
    .lt('deadline', now.toISOString())
    .select('id')

  if (deadlineError) {
    console.error('Error expiring deadline jobs:', deadlineError)
  }
  const deadlineExpired = deadlineJobs?.length || 0
  if (deadlineExpired > 0) {
    console.log(`  ⏰ ${deadlineExpired} jobs expired (deadline passed)`)
  }

  // 2. Expire jobs older than MAX_JOB_AGE_DAYS
  const { data: ageJobs, error: ageError } = await supabase
    .from('Job')
    .update({
      isActive: false,
      deactivatedAt: now.toISOString(),
      deactivationReason: `expired_${MAX_JOB_AGE_DAYS}_days`,
    })
    .eq('isActive', true)
    .lt('postedDate', maxAgeDate.toISOString())
    .select('id')

  if (ageError) {
    console.error('Error expiring old jobs:', ageError)
  }
  const ageExpired = ageJobs?.length || 0
  if (ageExpired > 0) {
    console.log(`  📆 ${ageExpired} jobs expired (older than ${MAX_JOB_AGE_DAYS} days)`)
  }

  if (deadlineExpired === 0 && ageExpired === 0) {
    console.log('  ✅ No deadline/age-based expirations')
  }
  console.log('')

  return { deadlineExpired, ageExpired }
}

/**
 * Check all active jobs for expiration
 * Uses isActive field to mark expired jobs (sets isActive=false)
 */
async function checkExpiredJobs(options: { limit?: number; all?: boolean } = {}) {
  const { limit = 100 } = options

  console.log('🔍 Starting expired job check...\n')

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, url, title, company, source, postedDate')
    .eq('isActive', true)
    .order('postedDate', { ascending: true })
    .order('crawledAt', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching jobs:', error)
    return { validCount: 0, expiredCount: 0, errorCount: 0, totalChecked: 0 }
  }

  console.log(`📦 Found ${jobs.length} jobs to validate\n`)

  let validCount = 0
  let expiredCount = 0
  let errorCount = 0

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    console.log(`[${i + 1}/${jobs.length}] ${job.title.substring(0, 40)}...`)
    console.log(`  🔗 ${job.url.substring(0, 60)}...`)

    const { isValid, statusCode, reason } = await checkUrlStatus(job.url)

    if (isValid) {
      // Job is still valid
      console.log(`  ✅ Valid (${statusCode || 'OK'})`)
      validCount++
    } else {
      // Mark as expired by setting isActive=false
      const { error: updateError } = await supabase
        .from('Job')
        .update({
          isActive: false,
          deactivatedAt: new Date().toISOString(),
          deactivationReason: reason === 'Closed text detected' ? 'closed_text' : 'broken_url',
        })
        .eq('id', job.id)

      if (updateError) {
        console.log(`  ⚠️ Update error: ${updateError.message}`)
        errorCount++
      } else {
        console.log(`  ❌ Expired (${reason || statusCode || 'ERROR'}) → Deactivated`)
        expiredCount++
      }
    }

    // Rate limiting - wait between requests
    await delay(500)
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Valid: ${validCount}`)
  console.log(`❌ Expired: ${expiredCount}`)
  console.log(`⚠️ Errors: ${errorCount}`)
  console.log(`${'═'.repeat(50)}`)

  // Return summary
  return { validCount, expiredCount, errorCount, totalChecked: jobs.length }
}

/**
 * Get job statistics
 */
async function getExpiredStats() {
  const [totalResult, activeResult, inactiveResult] = await Promise.all([
    supabase.from('Job').select('*', { count: 'exact', head: true }),
    supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true),
    supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', false),
  ])

  const total = totalResult.count || 0
  const active = activeResult.count || 0
  const inactive = inactiveResult.count || 0

  console.log('\n📊 Job Statistics:')
  console.log(`  Total: ${total}`)
  console.log(`  Active: ${active}`)
  console.log(`  Inactive/Expired: ${inactive}`)

  return { total, active, inactive }
}

// CLI arguments
const args = process.argv.slice(2)
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 100
const statsOnly = args.includes('--stats')

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log(`📡 Connected to Supabase: ${supabaseUrl}\n`)

  if (statsOnly) {
    await getExpiredStats()
  } else {
    // First: Quick deadline/age-based expiration (no HTTP requests)
    const { deadlineExpired, ageExpired } = await expireByDeadlineOrAge()

    // Then: URL-based validation for remaining jobs
    await checkExpiredJobs({ limit })

    // Show final stats
    await getExpiredStats()

    if (deadlineExpired > 0 || ageExpired > 0) {
      console.log(`\n📋 Summary: ${deadlineExpired} deadline + ${ageExpired} age-based expirations`)
    }
  }
}

main().catch(console.error)
