import { detectExperienceLevel, detectRemoteType } from '../utils'
import { crawlAshbyJobs } from './platforms'
import type { PlatformJob } from './platforms'
import { runCrawler } from './runner'
import type { CrawlerReturn } from './platforms'

export async function crawlEthereumJobs(): Promise<CrawlerReturn> {
  return runCrawler<PlatformJob>({
    source: 'ethereum.foundation',
    displayName: 'Ethereum Foundation',
    emoji: '🚀',

    async fetchJobs() {
      return crawlAshbyJobs('ethereum-foundation', 'Ethereum Foundation')
    },

    mapToJobInput(job) {
      const experienceLevel = job.description ? detectExperienceLevel(job.description) : null
      const remoteType = job.location.includes('Remote') ? 'Remote' : detectRemoteType(job.location)

      return {
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        type: job.type,
        category: job.category,
        tags: ['Ethereum', 'Blockchain', 'Layer 1'],
        source: 'ethereum.foundation',
        region: 'Global',
        postedDate: job.postedDate,
        description: job.description || null,
        salary: job.salary || null,
        experienceLevel,
        remoteType,
      }
    },
  })
}
