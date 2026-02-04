/**
 * Restore incorrectly expired jobs
 * Re-check all inactive jobs and restore those that are still valid
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Only these keywords strongly indicate a job is closed
const STRONG_EXPIRED_KEYWORDS = [
  'this job is no longer available',
  'this position has been filled',
  'this job has been closed',
  'this role has been filled',
  'job not found',
  'sorry, this job',
  'no longer accepting applications',
]

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function checkIfTrulyExpired(url: string): Promise<{ isExpired: boolean; reason?: string }> {
  try {
    // HEAD request first
    const headResponse = await axios.head(url, {
      timeout: 10000,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
      validateStatus: () => true,
    })

    // 404, 410 = definitely expired
    if (headResponse.status === 404 || headResponse.status === 410) {
      return { isExpired: true, reason: `HTTP ${headResponse.status}` }
    }

    // 5xx = server issue, not expired
    if (headResponse.status >= 500) {
      return { isExpired: false }
    }

    // 200 OK - check content more carefully
    if (headResponse.status === 200) {
      try {
        const getResponse = await axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': USER_AGENT },
          maxRedirects: 5,
          validateStatus: () => true,
        })

        if (typeof getResponse.data === 'string') {
          const lowerHtml = getResponse.data.toLowerCase()

          // Only use strong keywords
          for (const keyword of STRONG_EXPIRED_KEYWORDS) {
            if (lowerHtml.includes(keyword)) {
              return { isExpired: true, reason: `Contains: "${keyword}"` }
            }
          }
        }
      } catch {
        // GET failed, but HEAD was OK - keep as active
      }
    }

    // Other success codes - not expired
    if (headResponse.status >= 200 && headResponse.status < 400) {
      return { isExpired: false }
    }

    // 403 - might be bot protection, not expired
    if (headResponse.status === 403) {
      return { isExpired: false }
    }

    return { isExpired: false }
  } catch (error: any) {
    // Connection errors that suggest the site is down
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return { isExpired: true, reason: 'Connection failed' }
    }
    // Other errors - assume not expired
    return { isExpired: false }
  }
}

async function restoreJobs() {
  console.log('🔄 Starting job restoration...\n')

  // Get all inactive jobs
  const { data: inactiveJobs, error } = await supabase
    .from('Job')
    .select('id, title, company, url')
    .eq('isActive', false)
    .order('postedDate', { ascending: false })
    .order('crawledAt', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return
  }

  console.log(`📦 Found ${inactiveJobs?.length || 0} inactive jobs to verify\n`)

  let restoredCount = 0
  let stillExpiredCount = 0
  let errorCount = 0

  for (let i = 0; i < (inactiveJobs?.length || 0); i++) {
    const job = inactiveJobs![i]
    console.log(`[${i + 1}/${inactiveJobs!.length}] ${job.company} | ${job.title?.substring(0, 35)}...`)

    const { isExpired, reason } = await checkIfTrulyExpired(job.url)

    if (!isExpired) {
      // Restore this job
      const { error: updateError } = await supabase
        .from('Job')
        .update({ isActive: true })
        .eq('id', job.id)

      if (updateError) {
        console.log(`  ⚠️ Update error: ${updateError.message}`)
        errorCount++
      } else {
        console.log(`  ✅ RESTORED`)
        restoredCount++
      }
    } else {
      console.log(`  ❌ Still expired: ${reason}`)
      stillExpiredCount++
    }

    await delay(500)
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Restored: ${restoredCount}`)
  console.log(`❌ Still expired: ${stillExpiredCount}`)
  console.log(`⚠️ Errors: ${errorCount}`)
  console.log(`${'═'.repeat(50)}`)

  // Final stats
  const [totalResult, activeResult, inactiveResult] = await Promise.all([
    supabase.from('Job').select('*', { count: 'exact', head: true }),
    supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true),
    supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', false),
  ])

  console.log(`\n📊 Final Statistics:`)
  console.log(`  Total: ${totalResult.count}`)
  console.log(`  Active: ${activeResult.count}`)
  console.log(`  Inactive: ${inactiveResult.count}`)
}

restoreJobs().catch(console.error)
