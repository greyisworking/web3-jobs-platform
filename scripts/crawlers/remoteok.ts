import { fetchJSON, detectExperienceLevel, detectRemoteType, getRandomUserAgent } from '../utils'
import { cleanDescriptionHtml } from '../../lib/clean-description'
import { runCrawler } from './runner'
import type { CrawlerReturn } from './platforms'

interface RemoteOKJob {
  slug?: string
  id?: string
  epoch?: number
  date?: string
  company?: string
  company_logo?: string
  position?: string
  tags?: string[]
  logo?: string
  description?: string
  location?: string
  salary_min?: number
  salary_max?: number
  url?: string
  original?: boolean
}

export async function crawlRemoteOK(): Promise<CrawlerReturn> {
  return runCrawler<RemoteOKJob>({
    source: 'remoteok.com',
    displayName: 'RemoteOK',
    emoji: '🚀',

    async fetchJobs() {
      const data = await fetchJSON<RemoteOKJob[]>(
        'https://remoteok.com/remote-web3-jobs.json',
        { 'User-Agent': getRandomUserAgent() },
        { useBrowserHeaders: true },
      )
      if (!data || !Array.isArray(data)) return []
      return data.slice(1) // first element is metadata
    },

    mapToJobInput(job) {
      if (!job.position || !job.company) return null

      const jobUrl = job.url || (job.slug ? `https://remoteok.com/remote-jobs/${job.slug}` : '')
      if (!jobUrl) return null

      let salary: string | undefined
      if (job.salary_min && job.salary_max) {
        salary = `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
      } else if (job.salary_min) {
        salary = `$${job.salary_min.toLocaleString()}+`
      }

      const description = job.description ? cleanDescriptionHtml(job.description) || null : null
      const experienceLevel = description ? detectExperienceLevel(description) : null
      const remoteType = detectRemoteType(job.location || 'Remote')

      return {
        title: job.position,
        company: job.company,
        url: jobUrl,
        location: job.location || 'Remote',
        type: 'Full-time',
        category: 'Engineering',
        salary,
        tags: job.tags || [],
        source: 'remoteok.com',
        region: 'Global',
        postedDate: job.date ? new Date(job.date) : new Date(),
        description,
        salaryMin: job.salary_min || null,
        salaryMax: job.salary_max || null,
        salaryCurrency: job.salary_min ? 'USD' : null,
        experienceLevel,
        remoteType: remoteType || 'Remote',
        companyLogo: job.company_logo || job.logo || null,
      }
    },
  })
}
