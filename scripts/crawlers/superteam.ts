import { fetchJSON, fetchHTML, cleanText, parseSalary } from '../utils'
import { runCrawler } from './runner'
import type { CrawlerReturn } from './platforms'

interface SuperteamListing {
  id: string
  title: string
  slug: string
  type: 'bounty' | 'project' | 'job'
  sponsor: { name: string; logo?: string; slug?: string }
  skills: string[]
  minRewardAsk?: number
  maxRewardAsk?: number
  rewardAmount?: number
  token?: string
  deadline?: string
  status: string
  isWinnersAnnounced?: boolean
  description?: string
  requirements?: string
  eligibility?: string
}

// Normalized intermediate — both structured and scraped paths produce this
interface NormalizedListing {
  title: string
  company: string
  url: string
  type: string
  category: string
  tags: string[]
  salary?: string
  description?: string
  requirements?: string
  companyLogo?: string
  deadline?: string
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
}

const BASE_URL = 'https://superteam.fun'

export async function crawlSuperteamEarn(): Promise<CrawlerReturn> {
  return runCrawler<NormalizedListing>({
    source: 'talent.superteam.fun',
    displayName: 'Superteam Earn',
    emoji: '🚀',

    async fetchJobs(): Promise<NormalizedListing[]> {
      const $ = await fetchHTML(`${BASE_URL}/earn/`)
      if (!$) return []

      // Try __NEXT_DATA__ first
      const nextDataScript = $('script#__NEXT_DATA__').html()
      if (nextDataScript) {
        try {
          const nextData = JSON.parse(nextDataScript)
          const pp = nextData?.props?.pageProps
          const listings: SuperteamListing[] = pp?.listings || pp?.bounties || pp?.projects || pp?.initialData?.listings || []

          if (listings.length > 0) {
            return listings
              .filter(l => !l.isWinnersAnnounced && l.status !== 'completed' && l.status !== 'closed')
              .map(l => {
                const type = l.type === 'job' ? 'Full-time' : l.type === 'bounty' ? 'Bounty' : 'Contract'
                let salary: string | undefined
                if (l.rewardAmount) salary = `${l.rewardAmount} ${l.token || 'USDC'}`
                else if (l.minRewardAsk && l.maxRewardAsk) salary = `$${l.minRewardAsk} - $${l.maxRewardAsk}`
                const si = parseSalary(salary)
                return {
                  title: l.title,
                  company: l.sponsor?.name || 'Superteam',
                  url: `${BASE_URL}/listings/${l.slug}`,
                  type,
                  category: l.skills?.includes('development') ? 'Engineering' : 'Community',
                  tags: ['Solana', 'Web3', ...(l.skills || [])],
                  salary,
                  description: l.description,
                  requirements: l.requirements || l.eligibility,
                  companyLogo: l.sponsor?.logo,
                  deadline: l.deadline,
                  salaryMin: si.min,
                  salaryMax: si.max,
                  salaryCurrency: si.currency || 'USD',
                }
              })
          }
        } catch { /* fall through */ }
      }

      // Fallback: scrape HTML
      const results: NormalizedListing[] = []
      $('a[href*="/listings/"], a[href*="/bounties/"], a[href*="/projects/"]').each((_, el) => {
        try {
          const $el = $(el)
          const href = $el.attr('href') || ''
          if (!href.match(/\/(listings|bounties|projects)\/[\w-]+/)) return

          const $card = $el.closest('div').first()
          const cardText = $card.text()
          const title = cleanText($el.find('h2, h3, h4').first().text() || $el.text())
          if (title.length < 5) return

          let company = 'Superteam'
          const sponsorEl = $card.find('[class*="sponsor"], [class*="company"]')
          if (sponsorEl.length) company = cleanText(sponsorEl.text())

          let type = 'Bounty'
          if (href.includes('/projects/')) type = 'Contract'
          if (href.includes('/listings/') && cardText.toLowerCase().includes('job')) type = 'Full-time'

          const tags = ['Solana', 'Web3']
          if (cardText.toLowerCase().includes('design')) tags.push('Design')
          if (cardText.toLowerCase().includes('dev')) tags.push('Development')
          if (cardText.toLowerCase().includes('content')) tags.push('Content')

          let salary: string | undefined
          const rewardMatch = cardText.match(/(\$[\d,]+|\d+\s*SOL|\d+\s*USDC)/i)
          if (rewardMatch) salary = rewardMatch[1]
          const si = parseSalary(salary)

          results.push({
            title, company,
            url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
            type,
            category: type === 'Full-time' ? 'Engineering' : 'Community',
            tags, salary,
            salaryMin: si.min, salaryMax: si.max, salaryCurrency: si.currency,
          })
        } catch { /* skip */ }
      })
      return results
    },

    mapToJobInput(job) {
      return {
        title: job.title,
        company: job.company,
        url: job.url,
        location: 'Remote',
        type: job.type,
        category: job.category,
        salary: job.salary,
        tags: job.tags,
        source: 'talent.superteam.fun',
        region: 'Global',
        postedDate: new Date(),
        description: job.description,
        requirements: job.requirements,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        companyLogo: job.companyLogo,
        deadline: job.deadline ? new Date(job.deadline) : undefined,
      }
    },
  })
}
