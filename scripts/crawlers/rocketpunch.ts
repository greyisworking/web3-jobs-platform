import puppeteer, { Page, HTTPResponse } from 'puppeteer'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay, getRandomUserAgent } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

/** Shape returned by RocketPunch internal API */
interface RPApiResponse {
  totalItems: number
  itemSize: number
  items: RPJob[]
}

interface RPJob {
  jobId: number
  companyLogoUrl: string
  companyName: string
  companyPermalink: string
  title: string
  description: string          // Short one-liner (full JD is login-gated)
  seniorities: string[]        // ["신입","주니어","미들","시니어","C레벨"]
  workType: string             // "상시 출근" | "상시 재택" | "출근-재택 혼합"
  advertised: boolean
}

/** Build a structured description from available metadata (full JD is login-gated) */
function buildMetaDescription(job: RPJob): string {
  const parts: string[] = []
  parts.push(`Position: ${job.title}`)
  parts.push(`Company: ${job.companyName}`)
  const level = mapSeniority(job.seniorities)
  if (level) parts.push(`Level: ${level}`)
  const remote = mapWorkType(job.workType)
  parts.push(`Type: Full-time`)
  parts.push(`Work Style: ${remote}`)
  parts.push(`Location: Seoul, South Korea`)
  if (job.description) parts.push(`\n${job.description}`)
  parts.push(`\nFull job description available on Rocketpunch (login required).`)
  return parts.join(' | ').replace(' | \n', '\n')
}

// Search keywords for web3/blockchain jobs
const SEARCH_KEYWORDS = ['블록체인', 'web3', '크립토', 'DeFi', 'NFT']

// Web3 relevance filter: at least one keyword must appear in title/company/description
const WEB3_RELEVANCE = /blockchain|web3|crypto|defi|nft|solidity|smart\s*contract|token|dapp|decentralized|on-?chain|layer\s*2|\bl2\b|wallet|dao|metaverse|블록체인|웹3|크립토|디파이|solana|ethereum|polygon/i

function isWeb3Related(job: RPJob): boolean {
  const text = [job.title, job.companyName, job.description].join(' ')
  return WEB3_RELEVANCE.test(text)
}

/** Map Korean seniority to English experience level */
function mapSeniority(seniorities: string[]): string | undefined {
  const mapping: Record<string, string> = {
    '신입': 'Entry',
    '주니어': 'Junior',
    '미들': 'Mid',
    '시니어': 'Senior',
    'C레벨': 'Executive',
  }
  const priority = ['Executive', 'Senior', 'Mid', 'Junior', 'Entry']
  const mapped = seniorities.map(s => mapping[s]).filter(Boolean)
  return priority.find(p => mapped.includes(p))
}

/** Map Korean workType to remote type */
function mapWorkType(workType: string): string {
  if (workType.includes('재택') && workType.includes('출근')) return 'Hybrid'
  if (workType.includes('재택')) return 'Remote'
  return 'On-site'
}

/**
 * Search for jobs by typing keyword into the SPA search box.
 * Returns the parsed API response intercepted from the network.
 */
async function searchKeyword(page: Page, keyword: string): Promise<RPJob[]> {
  // Set up response interception (collect /api/proxy/jobs responses with keyword)
  let resolveResponse: (jobs: RPJob[]) => void
  const responsePromise = new Promise<RPJob[]>(resolve => {
    resolveResponse = resolve
  })

  // Timeout fallback
  const timeout = setTimeout(() => resolveResponse([]), 15000)

  const handler = async (response: HTTPResponse) => {
    const url = response.url()
    if (url.includes('/api/proxy/jobs') && url.includes('keyword=')) {
      try {
        const body = await response.text()
        const data: RPApiResponse = JSON.parse(body)
        clearTimeout(timeout)
        resolveResponse(data.items || [])
      } catch {
        clearTimeout(timeout)
        resolveResponse([])
      }
    }
  }
  page.on('response', handler)

  // Type keyword in search box
  const input = await page.$('input#keyword-input')
  if (!input) {
    clearTimeout(timeout)
    page.off('response', handler)
    console.log(`    ⚠️ Search input not found`)
    return []
  }

  await input.click({ clickCount: 3 }) // Select all existing text
  await input.type(keyword, { delay: 50 })
  await delay(300)
  await page.keyboard.press('Enter')

  const jobs = await responsePromise
  page.off('response', handler)
  return jobs
}

export async function crawlRocketPunch(): Promise<CrawlerReturn> {
  console.log('🚀 Starting 로켓펀치 crawler (API intercept mode)...')

  const allJobs = new Map<number, RPJob>() // Deduplicate by jobId
  let browser

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    })

    const page = await browser.newPage()

    // Anti-detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })
    await page.setUserAgent(getRandomUserAgent())
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    })
    await page.setViewport({ width: 1440, height: 900 })

    // Step 1: Navigate to pass AWS WAF challenge
    console.log('  🔐 Passing AWS WAF challenge...')
    await page.goto('https://www.rocketpunch.com/jobs', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })

    // Wait for WAF auto-reload
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
    } catch {}
    await delay(3000)

    // Verify search input exists (SPA loaded successfully)
    const searchInput = await page.$('input#keyword-input')
    if (!searchInput) {
      throw new Error('SPA did not load - search input not found after WAF')
    }
    console.log('  ✅ WAF passed, SPA loaded')

    // Step 2: Search each keyword and collect jobs
    for (const keyword of SEARCH_KEYWORDS) {
      console.log(`  🔍 Searching: ${keyword}`)
      try {
        const jobs = await searchKeyword(page, keyword)
        let added = 0
        for (const job of jobs) {
          if (!allJobs.has(job.jobId)) {
            allJobs.set(job.jobId, job)
            added++
          }
        }
        console.log(`    📦 ${jobs.length} results (${added} new unique)`)
        await delay(1500) // Rate limit between searches
      } catch (error: any) {
        console.log(`    ⚠️ Failed: ${error.message}`)
      }
    }

    console.log(`📦 Found ${allJobs.size} unique jobs from 로켓펀치`)

    // Step 3: Save jobs
    let savedCount = 0
    let newCount = 0

    let skippedNonWeb3 = 0
    for (const [, job] of allJobs) {
      // Skip non-Web3 jobs
      if (!isWeb3Related(job)) {
        skippedNonWeb3++
        continue
      }

      try {
        const jobUrl = `https://www.rocketpunch.com/jobs/${job.jobId}/${job.companyPermalink}`
        const remoteType = mapWorkType(job.workType)
        const experienceLevel = mapSeniority(job.seniorities)

        const metaDescription = buildMetaDescription(job)

        const result = await validateAndSaveJob(
          {
            title: job.title,
            company: job.companyName,
            url: jobUrl,
            location: 'Seoul, South Korea',
            type: 'Full-time',
            category: 'Engineering',
            tags: ['Blockchain', 'Web3', 'Korea'],
            source: 'rocketpunch.com',
            region: 'Korea',
            postedDate: new Date(),
            description: metaDescription,
            companyLogo: job.companyLogoUrl || undefined,
            remoteType,
            experienceLevel,
          },
          'rocketpunch.com'
        )
        if (result.saved) savedCount++
        if (result.isNew) newCount++
      } catch (error) {
        console.error('Error saving 로켓펀치 job:', error)
      }
    }

    await supabase.from('CrawlLog').insert({
      source: 'rocketpunch.com',
      status: 'success',
      jobCount: savedCount,
      createdAt: new Date().toISOString(),
    })

    if (skippedNonWeb3 > 0) console.log(`  🗑️ Skipped ${skippedNonWeb3} non-Web3 jobs`)
    console.log(`✅ Saved ${savedCount} jobs from 로켓펀치 (${newCount} new)`)
    return { total: savedCount, new: newCount }
  } catch (error) {
    console.error('❌ RocketPunch crawler error:', error)

    await supabase.from('CrawlLog').insert({
      source: 'rocketpunch.com',
      status: 'failed',
      jobCount: 0,
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
