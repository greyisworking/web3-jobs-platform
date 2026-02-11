import axios from 'axios'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay, detectExperienceLevel, detectRemoteType } from '../utils'

interface AshbyJob {
  id: string
  title: string
  location: string
  department?: string
  team?: string
  employmentType?: string
  jobUrl?: string
  publishedAt?: string
  isRemote?: boolean
  isListed?: boolean
  locationName?: string
  secondaryLocations?: { locationName: string }[]
  // Enhanced fields from Ashby API
  descriptionHtml?: string
  descriptionPlain?: string
  compensation?: {
    min?: number
    max?: number
    currency?: string
    interval?: string
  }
  requirements?: string
  responsibilities?: string
  benefits?: string
}

interface AshbyResponse {
  jobs: AshbyJob[]
}

interface CrawlerReturn {
  total: number
  new: number
}

export async function crawlEthereumJobs(): Promise<CrawlerReturn> {
  console.log('🚀 Starting Ethereum Foundation Jobs crawler...')

  let data: AshbyResponse | null = null
  try {
    const response = await axios.get<AshbyResponse>(
      'https://api.ashbyhq.com/posting-api/job-board/ethereum-foundation',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Web3JobsBot/1.0)',
        },
        timeout: 15000,
      }
    )
    data = response.data
  } catch (error) {
    console.error('❌ Failed to fetch Ethereum Foundation jobs from Ashby API:', error)
    return { total: 0, new: 0 }
  }

  if (!data?.jobs || !Array.isArray(data.jobs)) {
    console.error('❌ Unexpected Ashby API response format')
    return { total: 0, new: 0 }
  }

  console.log(`📦 Found ${data.jobs.length} jobs from Ethereum Foundation`)

  let savedCount = 0
  let newCount = 0
  for (const job of data.jobs) {
    try {
      if (!job.title) continue

      const jobUrl = job.jobUrl || `https://jobs.ashbyhq.com/ethereum-foundation/${job.id}`

      const locationParts: string[] = []
      if (job.location) locationParts.push(job.location)
      if (job.isRemote) locationParts.push('Remote')
      const location = locationParts.length > 0
        ? [...new Set(locationParts)].join(', ')
        : 'Remote'

      // Extract enhanced details
      const description = job.descriptionHtml || job.descriptionPlain || null
      const experienceLevel = description ? detectExperienceLevel(description) : null
      const remoteType = job.isRemote ? 'Remote' : detectRemoteType(location)

      const result = await validateAndSaveJob(
        {
          title: job.title,
          company: 'Ethereum Foundation',
          url: jobUrl,
          location,
          type: job.employmentType || 'Full-time',
          category: job.department || job.team || 'Engineering',
          tags: ['Ethereum', 'Blockchain', 'Layer 1'],
          source: 'ethereum.foundation',
          region: 'Global',
          postedDate: job.publishedAt ? new Date(job.publishedAt) : new Date(),
          // Enhanced job details
          description,
          requirements: job.requirements || null,
          responsibilities: job.responsibilities || null,
          benefits: job.benefits || null,
          salaryMin: job.compensation?.min || null,
          salaryMax: job.compensation?.max || null,
          salaryCurrency: job.compensation?.currency || null,
          experienceLevel,
          remoteType,
        },
        'ethereum.foundation'
      )
      if (result.saved) savedCount++
      if (result.isNew) newCount++
      await delay(100)
    } catch (error) {
      console.error('Error saving Ethereum Foundation job:', error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'ethereum.foundation',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from Ethereum Foundation (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
