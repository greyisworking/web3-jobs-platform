import { fetchHTML, cleanText, parseSalary, detectRemoteType } from '../utils'
import { runCrawler } from './runner'
import type { CrawlerReturn } from './platforms'

interface HirechainCompany {
  id: string
  name: string
  slug: string
  logo_url?: string
  location?: string
  jobs_count: number
}

interface HirechainJob {
  id: string
  title: string
  slug: string
  company_id: string
  location?: string
  remote_policy?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  employment_type?: string
  experience_level?: string
  description?: string
  requirements?: string
  created_at?: string
  deadline?: string
}

// Normalized intermediate type produced by fetchJobs
interface NormalizedJob {
  title: string
  company: string
  url: string
  location: string
  type: string
  tags: string[]
  companyLogo?: string
  description?: string
  requirements?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  experienceLevel?: string
  remoteType?: string
  postedDate: Date
  deadline?: string
}

const BASE_URL = 'https://base.hirechain.io'

export async function crawlBaseHirechain(): Promise<CrawlerReturn> {
  return runCrawler<NormalizedJob>({
    source: 'base.hirechain.io',
    displayName: 'Base Hirechain',
    emoji: '🚀',

    async fetchJobs(): Promise<NormalizedJob[]> {
      const $ = await fetchHTML(BASE_URL)
      if (!$) return []

      // Try __NEXT_DATA__ first
      const nextDataScript = $('script#__NEXT_DATA__').html()
      if (nextDataScript) {
        try {
          const nextData = JSON.parse(nextDataScript)
          const pageProps = nextData?.props?.pageProps
          const companies: HirechainCompany[] = pageProps?.companies || pageProps?.initialCompanies || []
          const jobs: HirechainJob[] = pageProps?.jobs || pageProps?.initialJobs || pageProps?.allJobs || []

          if (jobs.length > 0) {
            const companyMap = new Map(companies.map(c => [c.id, c]))
            return jobs.map(job => {
              const company = companyMap.get(job.company_id)
              const salaryInfo = parseSalary(
                job.salary_min && job.salary_max
                  ? `${job.salary_currency || 'USD'} ${job.salary_min} - ${job.salary_max}`
                  : undefined,
              )
              return {
                title: job.title,
                company: company?.name || 'Unknown',
                url: `${BASE_URL}/jobs/${job.slug}`,
                location: job.location || job.remote_policy || 'Remote',
                type: job.employment_type || 'Full-time',
                tags: ['Base', 'Ethereum', 'L2'],
                companyLogo: company?.logo_url,
                description: job.description,
                requirements: job.requirements,
                salaryMin: job.salary_min || salaryInfo.min || undefined,
                salaryMax: job.salary_max || salaryInfo.max || undefined,
                salaryCurrency: job.salary_currency || salaryInfo.currency || undefined,
                experienceLevel: job.experience_level,
                remoteType: job.remote_policy || detectRemoteType(job.location || '') || undefined,
                postedDate: job.created_at ? new Date(job.created_at) : new Date(),
                deadline: job.deadline,
              }
            })
          }
        } catch {
          // fall through to HTML scrape
        }
      }

      // Fallback: scrape HTML
      const results: NormalizedJob[] = []
      $('a[href*="/jobs/"], a[href*="/job/"]').each((_, el) => {
        try {
          const $el = $(el)
          const href = $el.attr('href') || ''
          if (href === '/jobs' || href === '/jobs/') return

          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`
          const $card = $el.closest('div, article, li').first()
          const cardText = $card.text()

          const title = cleanText($el.find('h2, h3, h4').first().text() || $el.text())
          if (title.length < 5 || title.length > 200) return

          let company = 'Unknown'
          const companyEl = $card.find('[class*="company"], [class*="org"]')
          if (companyEl.length) company = cleanText(companyEl.text())

          let companyLogo: string | undefined
          const logoImg = $card.find('img').first()
          if (logoImg.length) {
            const src = logoImg.attr('src')
            if (src?.startsWith('http') && !src.includes('placeholder')) companyLogo = src
          }

          let location = 'Remote'
          if (!cardText.toLowerCase().includes('remote')) {
            const locationMatch = cardText.match(/([\w\s,]+(?:USA|Europe|Asia|Remote))/i)
            if (locationMatch) location = cleanText(locationMatch[1])
          }

          let type = 'Full-time'
          if (cardText.toLowerCase().includes('contract')) type = 'Contract'
          if (cardText.toLowerCase().includes('part-time')) type = 'Part-time'

          const tags = ['Base', 'Ethereum', 'L2']
          if (cardText.toLowerCase().includes('solidity')) tags.push('Solidity')
          if (cardText.toLowerCase().includes('react')) tags.push('React')
          if (cardText.toLowerCase().includes('defi')) tags.push('DeFi')

          results.push({
            title, company, url: fullUrl, location, type, tags,
            companyLogo, postedDate: new Date(),
          })
        } catch {
          // skip invalid entries
        }
      })
      return results
    },

    mapToJobInput(job) {
      return {
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        type: job.type,
        category: 'Engineering',
        tags: job.tags,
        source: 'base.hirechain.io',
        region: 'Global',
        postedDate: job.postedDate,
        description: job.description,
        requirements: job.requirements,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        experienceLevel: job.experienceLevel,
        remoteType: job.remoteType,
        companyLogo: job.companyLogo,
        deadline: job.deadline ? new Date(job.deadline) : undefined,
      }
    },
  })
}
