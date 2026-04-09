import { fetchHTML } from '../utils'
import { runCrawler } from './runner'
import type { CrawlerReturn } from './platforms'

export async function crawlCryptoJobsList(): Promise<CrawlerReturn> {
  const baseUrl = 'https://cryptojobslist.com'

  return runCrawler<any>({
    source: 'cryptojobslist.com',
    displayName: 'CryptoJobsList',
    emoji: '🚀',

    async fetchJobs() {
      const $ = await fetchHTML(baseUrl)
      if (!$) return []

      const nextDataScript = $('script#__NEXT_DATA__').html()
      if (!nextDataScript) return []

      let pageProps: any
      try {
        const nextData = JSON.parse(nextDataScript)
        pageProps = nextData?.props?.pageProps
      } catch {
        return []
      }

      if (!pageProps) return []
      return pageProps.jobs || pageProps.initialJobs || pageProps.data?.jobs || []
    },

    mapToJobInput(job) {
      const title = job.jobTitle || job.title || job.name
      if (!title) return null

      const companyName = job.companyName || job.company?.name || job.company || 'Unknown'

      let jobUrl: string
      if (job.url && job.url.startsWith('http')) {
        jobUrl = job.url
      } else if (job.seoSlug) {
        jobUrl = `${baseUrl}/jobs/${job.seoSlug}`
      } else if (job.slug) {
        jobUrl = `${baseUrl}/jobs/${job.slug}`
      } else if (job.id) {
        jobUrl = `${baseUrl}/jobs/${job.id}`
      } else {
        return null
      }

      const location = job.jobLocation || job.location || job.locationName || 'Remote'
      const tags: string[] = Array.isArray(job.tags)
        ? job.tags.map((t: any) => typeof t === 'string' ? t : t.name || t.label || '').filter(Boolean)
        : []

      return {
        title,
        company: companyName,
        url: jobUrl,
        location: typeof location === 'string' ? location : 'Remote',
        type: job.type || job.employmentType || 'Full-time',
        category: job.category || 'Engineering',
        salary: job.salaryString || job.salary || undefined,
        companyLogo: job.companyLogo || undefined,
        tags,
        source: 'cryptojobslist.com',
        region: 'Global',
        postedDate: job.publishedAt ? new Date(job.publishedAt) : job.createdAt ? new Date(job.createdAt) : new Date(),
      }
    },
  })
}
