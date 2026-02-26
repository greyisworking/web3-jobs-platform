import 'dotenv/config'
import { supabase } from '../lib/supabase-script'
import axios from 'axios'

const DELAY_MS = parseInt(process.env.CRAWL_DELAY_MS || '2000')

// Patterns that indicate a job posting is expired/closed/deleted
const EXPIRED_KEYWORDS = [
  '공고가 마감되었습니다',
  '마감된 공고',
  '삭제된 공고',
  '존재하지 않는 공고',
  '채용이 마감',
  '해당 공고를 찾을 수 없',
  '페이지를 찾을 수 없',
  '더 이상 유효하지',
  'this position has been filled',
  'this job is no longer available',
  'no longer accepting applications',
  'job not found',
  'this posting has expired',
  'position has been closed',
]

async function checkJobUrl(url: string): Promise<'active' | 'expired' | 'error'> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      validateStatus: () => true,
    })

    if (response.status === 404 || response.status === 410 || response.status === 403) {
      return 'error'
    }

    if (response.status >= 500) {
      return 'error'
    }

    // Check page content for expiry patterns
    const html = typeof response.data === 'string' ? response.data : ''
    const lowerHtml = html.toLowerCase().slice(0, 10000)

    for (const keyword of EXPIRED_KEYWORDS) {
      if (lowerHtml.includes(keyword.toLowerCase())) {
        return 'expired'
      }
    }

    return 'active'
  } catch (error: any) {
    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return 'error'
    }
    if (error.response?.status === 404) {
      return 'error'
    }
    return 'error'
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('🔍 Job URL Validation\n')
  console.log('='.repeat(50))

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, url, source, title, company')
    .eq('isActive', true)
    .order('crawledAt', { ascending: true })

  if (error) {
    console.error('Failed to fetch jobs:', error.message)
    process.exit(1)
  }

  if (!jobs || jobs.length === 0) {
    console.log('No active jobs to validate.')
    return
  }

  console.log(`\nFound ${jobs.length} active jobs to validate\n`)

  let activeCount = 0
  let expiredCount = 0
  let errorCount = 0
  const now = new Date().toISOString()

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    const status = await checkJobUrl(job.url)

    if (status !== 'active') {
      const icon = status === 'expired' ? '⏰' : '❌'
      console.log(`  ${icon} [${job.source}] ${job.company} — ${job.title.slice(0, 50)}`)

      await supabase
        .from('Job')
        .update({
          isActive: false,
          last_validated: now,
        })
        .eq('id', job.id)

      if (status === 'expired') expiredCount++
      else errorCount++
    } else {
      await supabase
        .from('Job')
        .update({
          last_validated: now,
        })
        .eq('id', job.id)

      activeCount++
    }

    // Progress log every 50 jobs
    if ((i + 1) % 50 === 0) {
      console.log(`\n  📊 Progress: ${i + 1}/${jobs.length} (active: ${activeCount}, expired: ${expiredCount}, error: ${errorCount})\n`)
    }

    await delay(DELAY_MS)
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n✨ Validation Complete!`)
  console.log(`  ✅ Active:  ${activeCount}`)
  console.log(`  ⏰ Expired: ${expiredCount}`)
  console.log(`  ❌ Error:   ${errorCount}`)
  console.log(`  📊 Total:   ${jobs.length}\n`)
}

main().catch((error) => {
  console.error('🚨 Fatal error:', error)
  process.exit(1)
})
