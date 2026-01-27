import axios from 'axios'
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'

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
}

interface AshbyResponse {
  jobs: AshbyJob[]
}

export async function crawlEthereumJobs(): Promise<number> {
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
    return 0
  }

  if (!data?.jobs || !Array.isArray(data.jobs)) {
    console.error('❌ Unexpected Ashby API response format')
    return 0
  }

  console.log(`📦 Found ${data.jobs.length} jobs from Ethereum Foundation`)

  let savedCount = 0
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

      const saved = await validateAndSaveJob(
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
        },
        'ethereum.foundation'
      )
      if (saved) savedCount++
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

  console.log(`✅ Saved ${savedCount} jobs from Ethereum Foundation`)
  return savedCount
}
