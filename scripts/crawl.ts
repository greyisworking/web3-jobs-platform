import 'dotenv/config'
import { crawlPriorityCompanies } from './crawlers/priority-companies'
import { crawlWeb3Career } from './crawlers/web3career'
// import { crawlWeb3KRJobs } from './crawlers/web3krjobs'  // Disabled: ERR_SSL_VERSION_OR_CIPHER_MISMATCH 5회 연속 (2026-03-03)
import { crawlCryptoJobsList } from './crawlers/cryptojobslist'
import { crawlRemote3 } from './crawlers/remote3'
import { crawlRemoteOK } from './crawlers/remoteok'
import { crawlRocketPunch } from './crawlers/rocketpunch'
import { crawlWanted } from './crawlers/wanted'
import { crawlSuiJobs } from './crawlers/suijobs'
import { crawlSolanaJobs } from './crawlers/solanajobs'
import { crawlEthereumJobs } from './crawlers/ethereum'
import { crawlAvalancheJobs } from './crawlers/avalanchejobs'
import { crawlArbitrumJobs } from './crawlers/arbitrumjobs'
import { crawlCryptocurrencyJobs } from './crawlers/cryptocurrencyjobs'
import { crawlCryptoJobs } from './crawlers/cryptojobs'
import { crawlJobStash } from './crawlers/jobstash'
import { cleanupExpiredJobs } from './cleanup/expire'
import { sendCrawlStart, sendCrawlReport, sendFatalError } from './notify'
import type { CrawlResult } from './notify'
// Skipped imports (403 errors, 0 results, or SSL errors):
// import { crawlWellfound } from './crawlers/wellfound'
// import { crawlSuperteamEarn } from './crawlers/superteam'
// import { crawlBaseHirechain } from './crawlers/basehirechain'

// Timeout settings
const OVERALL_TIMEOUT_MS = 30 * 60 * 1000  // 30 minutes max
const PER_SOURCE_TIMEOUT_MS = 5 * 60 * 1000  // 5 minutes per source
const PRIORITY_COMPANIES_TIMEOUT_MS = 8 * 60 * 1000  // 8 minutes for priority-companies

// Wrap crawler with timeout
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  _sourceName: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs / 1000}s`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

async function main() {
  console.log('🌐 Starting Web3 Jobs Crawler...\n')
  console.log('='.repeat(50))
  console.log(`⏱️  Overall timeout: ${OVERALL_TIMEOUT_MS / 60000} minutes`)
  console.log(`⏱️  Per-source timeout: ${PER_SOURCE_TIMEOUT_MS / 60000} minutes`)
  console.log(`⏭️  Skipping: wellfound.com, superteam.fun, base.hirechain.io, web3kr.jobs (SSL)`)

  const startTime = Date.now()
  const results: CrawlResult[] = []

  // Overall timeout check
  const checkOverallTimeout = () => {
    if (Date.now() - startTime > OVERALL_TIMEOUT_MS) {
      throw new Error(`Overall timeout exceeded (${OVERALL_TIMEOUT_MS / 60000} minutes)`)
    }
  }

  // Active crawlers (excluding skipped sources)
  console.log('\n📌 Active Crawlers\n')

  const crawlers = [
    { name: 'priority-companies', fn: crawlPriorityCompanies, timeout: PRIORITY_COMPANIES_TIMEOUT_MS },
    { name: 'web3.career', fn: crawlWeb3Career, timeout: 3 * 60 * 1000 },  // 3 min (has internal retry)
    // { name: 'web3kr.jobs', fn: crawlWeb3KRJobs },  // Disabled: SSL cert broken (2026-03-03)
    { name: 'cryptojobslist.com', fn: crawlCryptoJobsList },
    { name: 'remote3.co', fn: crawlRemote3 },
    { name: 'remoteok.com', fn: crawlRemoteOK },
    { name: 'rocketpunch.com', fn: crawlRocketPunch },
    { name: 'wanted.co.kr', fn: crawlWanted },
    { name: 'jobs.sui.io', fn: crawlSuiJobs },
    { name: 'jobs.solana.com', fn: crawlSolanaJobs },
    { name: 'ethereum.foundation', fn: crawlEthereumJobs },
    { name: 'jobs.avax.network', fn: crawlAvalancheJobs },
    { name: 'jobs.arbitrum.io', fn: crawlArbitrumJobs },
    { name: 'cryptocurrencyjobs.co', fn: crawlCryptocurrencyJobs },
    { name: 'crypto.jobs', fn: crawlCryptoJobs },  // Restored: RSS feed mode (was 403 on HTML)
    { name: 'jobstash.xyz', fn: crawlJobStash, timeout: 8 * 60 * 1000 },  // 8 min (192 pages)
    // Skipped sources (403, 0 results, or SSL):
    // - wellfound.com (403 error)
    // - talent.superteam.fun (0 results)
    // - base.hirechain.io (0 results)
    // - web3kr.jobs (SSL cert broken since 2026-03)
  ]

  // 시작 알림
  await sendCrawlStart(crawlers.length)

  for (const crawler of crawlers) {
    // Check overall timeout before each crawler
    checkOverallTimeout()

    const crawlerStartTime = Date.now()
    const timeout = crawler.timeout || PER_SOURCE_TIMEOUT_MS
    try {
      const result = await withTimeout(crawler.fn(), timeout, crawler.name)
      // Handle both old (number) and new ({ total, new }) return types
      const total = typeof result === 'number' ? result : result.total
      const newCount = typeof result === 'number' ? 0 : result.new
      const duration = ((Date.now() - crawlerStartTime) / 1000).toFixed(1)
      results.push({ source: crawler.name, status: 'success', jobCount: total, newCount })
      console.log(`✅ ${crawler.name}: ${total} jobs (${newCount} new) [${duration}s]`)
    } catch (error: any) {
      const duration = ((Date.now() - crawlerStartTime) / 1000).toFixed(1)
      console.error(`❌ ${crawler.name}: ${error.message} [${duration}s]`)
      results.push({ source: crawler.name, status: 'failed', jobCount: 0, newCount: 0, error: error.message })
    }
  }

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  const totalJobs = results.reduce((sum, r) => sum + r.jobCount, 0)
  const totalNewJobs = results.reduce((sum, r) => sum + r.newCount, 0)
  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length

  // Post-crawl cleanup: deactivate expired jobs
  console.log('\n🧹 Post-crawl cleanup...')
  let expiredCount = 0
  try {
    expiredCount = await cleanupExpiredJobs()
    if (expiredCount > 0) {
      console.log(`  🗑️ Deactivated ${expiredCount} expired jobs (>60 days)`)
    } else {
      console.log(`  ✅ No expired jobs to clean up`)
    }
  } catch (err: any) {
    console.error(`  ⚠️ Cleanup failed: ${err.message}`)
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n✨ Crawling Complete!`)
  console.log(`📊 Total processed: ${totalJobs} jobs`)
  console.log(`🆕 New jobs added: ${totalNewJobs} jobs`)
  console.log(`✅ Success: ${successCount}/${results.length}`)
  console.log(`❌ Failed: ${failedCount}/${results.length}`)
  console.log(`⏱️  Duration: ${duration.toFixed(1)}s\n`)

  // 완료 알림 (notify.ts)
  await sendCrawlReport({ results, duration, expiredCount })
}

main()
  .catch(async (error) => {
    console.error('🚨 Fatal error:', error)
    await sendFatalError(error)
    process.exit(1)
  })
