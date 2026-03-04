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
const OVERALL_TIMEOUT_MS = 15 * 60 * 1000  // 15 minutes max (병렬 실행이므로 단축)
const PER_SOURCE_TIMEOUT_MS = 5 * 60 * 1000  // 5 minutes per source
const PRIORITY_COMPANIES_TIMEOUT_MS = 8 * 60 * 1000  // 8 minutes for priority-companies
const CONCURRENCY = 5  // 동시 실행 크롤러 수

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

// Promise pool: concurrency개만큼 동시 실행, 하나 완료 시 큐에서 다음 시작
interface TaskOutcome<T> {
  result?: T
  error?: Error
  duration: number  // seconds
}

async function runConcurrent<T>(
  tasks: { name: string; fn: () => Promise<T> }[],
  concurrency: number
): Promise<Map<string, TaskOutcome<T>>> {
  const outcomes = new Map<string, TaskOutcome<T>>()
  const queue = [...tasks]
  const running = new Set<Promise<void>>()

  async function runNext(): Promise<void> {
    if (queue.length === 0) return
    const task = queue.shift()!
    const start = Date.now()
    try {
      const result = await task.fn()
      outcomes.set(task.name, { result, duration: (Date.now() - start) / 1000 })
    } catch (err: any) {
      outcomes.set(task.name, { error: err, duration: (Date.now() - start) / 1000 })
    }
  }

  // Initial batch
  while (running.size < concurrency && queue.length > 0) {
    const p = runNext().then(() => { running.delete(p) })
    running.add(p)
  }

  // Process queue as tasks complete
  while (running.size > 0) {
    await Promise.race(running)
    while (running.size < concurrency && queue.length > 0) {
      const p = runNext().then(() => { running.delete(p) })
      running.add(p)
    }
  }

  return outcomes
}

async function main() {
  console.log('🌐 Starting Web3 Jobs Crawler...\n')
  console.log('='.repeat(50))
  console.log(`⏱️  Overall timeout: ${OVERALL_TIMEOUT_MS / 60000} minutes`)
  console.log(`⏱️  Per-source timeout: ${PER_SOURCE_TIMEOUT_MS / 60000} minutes`)
  console.log(`🔀 Concurrency: ${CONCURRENCY} crawlers in parallel`)
  console.log(`⏭️  Skipping: wellfound.com, superteam.fun, base.hirechain.io, web3kr.jobs (SSL)`)

  const startTime = Date.now()
  const results: CrawlResult[] = []

  // Overall timeout: 병렬 실행이므로 15분이면 충분
  const overallTimer = setTimeout(() => {
    console.error(`🛑 Overall timeout exceeded (${OVERALL_TIMEOUT_MS / 60000} minutes) — forcing exit`)
    process.exit(1)
  }, OVERALL_TIMEOUT_MS)

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

  // 각 크롤러를 task로 래핑 (개별 타임아웃 적용)
  const tasks = crawlers.map(c => ({
    name: c.name,
    fn: async () => {
      const timeout = c.timeout || PER_SOURCE_TIMEOUT_MS
      return withTimeout(c.fn(), timeout, c.name)
    }
  }))

  // 병렬 실행 (concurrency=5)
  console.log(`\n🔀 Running ${tasks.length} crawlers with concurrency=${CONCURRENCY}...\n`)
  const outcomes = await runConcurrent(tasks, CONCURRENCY)

  // 결과 수집 (정의 순서 유지)
  for (const crawler of crawlers) {
    const outcome = outcomes.get(crawler.name)
    if (!outcome) {
      results.push({ source: crawler.name, status: 'failed', jobCount: 0, newCount: 0, error: 'No result' })
      console.error(`❌ ${crawler.name}: No result`)
      continue
    }

    if (outcome.error) {
      console.error(`❌ ${crawler.name}: ${outcome.error.message} [${outcome.duration.toFixed(1)}s]`)
      results.push({ source: crawler.name, status: 'failed', jobCount: 0, newCount: 0, error: outcome.error.message })
    } else {
      const result = outcome.result!
      const total = typeof result === 'number' ? result : result.total
      const newCount = typeof result === 'number' ? 0 : result.new
      console.log(`✅ ${crawler.name}: ${total} jobs (${newCount} new) [${outcome.duration.toFixed(1)}s]`)
      results.push({ source: crawler.name, status: 'success', jobCount: total, newCount })
    }
  }

  clearTimeout(overallTimer)

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
