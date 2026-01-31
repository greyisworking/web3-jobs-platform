/**
 * Check for expired jobs by validating URLs
 * Marks jobs as "expired" if their source URL returns 404
 */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

// User agent to avoid being blocked
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if a URL is still valid (not 404)
 */
async function checkUrlStatus(url: string): Promise<{ isValid: boolean; statusCode: number | null }> {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
      validateStatus: () => true, // Don't throw on any status
    })

    // 404, 410 (Gone), or 5xx errors = likely expired
    const isValid = response.status < 400 || response.status === 403 // 403 might be rate limiting
    return { isValid, statusCode: response.status }
  } catch (error: any) {
    // Network errors, timeouts - might be temporary, mark as unknown
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return { isValid: false, statusCode: null }
    }
    // Timeout or other errors - keep as is
    return { isValid: true, statusCode: null }
  }
}

/**
 * Check all active jobs for expiration
 */
async function checkExpiredJobs(options: { limit?: number; daysOld?: number } = {}) {
  const { limit = 100, daysOld = 7 } = options

  console.log('🔍 Starting expired job check...\n')

  // Get jobs that haven't been validated recently
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const jobs = await prisma.job.findMany({
    where: {
      status: { not: 'expired' },
      isActive: true,
      OR: [
        { lastValidated: null },
        { lastValidated: { lt: cutoffDate } },
      ],
    },
    select: {
      id: true,
      url: true,
      title: true,
      company: true,
      source: true,
      postedDate: true,
    },
    orderBy: { postedDate: 'asc' }, // Check oldest first
    take: limit,
  })

  console.log(`📦 Found ${jobs.length} jobs to validate\n`)

  let validCount = 0
  let expiredCount = 0
  let errorCount = 0

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    console.log(`[${i + 1}/${jobs.length}] ${job.title.substring(0, 40)}...`)
    console.log(`  🔗 ${job.url.substring(0, 60)}...`)

    const { isValid, statusCode } = await checkUrlStatus(job.url)

    if (isValid) {
      // Update lastValidated timestamp
      await prisma.job.update({
        where: { id: job.id },
        data: { lastValidated: new Date() },
      })
      console.log(`  ✅ Valid (${statusCode || 'OK'})`)
      validCount++
    } else {
      // Mark as expired
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'expired',
          lastValidated: new Date(),
        },
      })
      console.log(`  ❌ Expired (${statusCode || 'ERROR'})`)
      expiredCount++
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
 * Get expired jobs count
 */
async function getExpiredStats() {
  const [total, active, expired] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: 'active', isActive: true } }),
    prisma.job.count({ where: { status: 'expired' } }),
  ])

  console.log('\n📊 Job Statistics:')
  console.log(`  Total: ${total}`)
  console.log(`  Active: ${active}`)
  console.log(`  Expired: ${expired}`)

  return { total, active, expired }
}

// CLI arguments
const args = process.argv.slice(2)
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 100
const statsOnly = args.includes('--stats')

async function main() {
  try {
    if (statsOnly) {
      await getExpiredStats()
    } else {
      await checkExpiredJobs({ limit })
      await getExpiredStats()
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
