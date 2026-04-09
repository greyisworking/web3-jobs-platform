import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay, detectExperienceLevel, detectRemoteType } from '../utils'
import { crawlAshbyJobs } from './platforms'
import type { CrawlerReturn } from './platforms'

export async function crawlEthereumJobs(): Promise<CrawlerReturn> {
  console.log('🚀 Starting Ethereum Foundation Jobs crawler...')

  const jobs = await crawlAshbyJobs('ethereum-foundation', 'Ethereum Foundation')

  if (jobs.length === 0) {
    console.log('⚠️  No jobs found from Ethereum Foundation')
    return { total: 0, new: 0 }
  }

  console.log(`📦 Found ${jobs.length} jobs from Ethereum Foundation`)

  let savedCount = 0
  let newCount = 0
  for (const job of jobs) {
    try {
      const experienceLevel = job.description ? detectExperienceLevel(job.description) : null
      const remoteType = job.location.includes('Remote') ? 'Remote' : detectRemoteType(job.location)

      const result = await validateAndSaveJob(
        {
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
        },
        'ethereum.foundation',
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
