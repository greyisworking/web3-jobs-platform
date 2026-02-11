import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchJSON, delay, detectExperienceLevel, detectRemoteType } from '../utils'
import { cleanDescriptionText } from '../../lib/clean-description'

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

interface CrawlerReturn {
  total: number
  new: number
}

export async function crawlRemoteOK(): Promise<CrawlerReturn> {
  console.log('🚀 Starting RemoteOK crawler...')

  const data = await fetchJSON<RemoteOKJob[]>(
    'https://remoteok.com/remote-web3-jobs.json',
    { 'User-Agent': 'Mozilla/5.0 (compatible; Web3JobsBot/1.0)' }
  )

  if (!data || !Array.isArray(data)) {
    console.error('❌ Failed to fetch RemoteOK JSON')
    return { total: 0, new: 0 }
  }

  // First element is metadata/legal notice — skip it
  const jobEntries = data.slice(1)

  console.log(`📦 Found ${jobEntries.length} jobs from RemoteOK`)

  let savedCount = 0
  let newCount = 0
  for (const job of jobEntries) {
    try {
      if (!job.position || !job.company) continue

      const jobUrl = job.url || (job.slug ? `https://remoteok.com/remote-jobs/${job.slug}` : '')
      if (!jobUrl) continue

      let salary: string | undefined
      if (job.salary_min && job.salary_max) {
        salary = `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
      } else if (job.salary_min) {
        salary = `$${job.salary_min.toLocaleString()}+`
      }

      // Extract enhanced details – clean HTML noise from JSON descriptions
      const description = job.description ? cleanDescriptionText(job.description) || null : null
      const experienceLevel = description ? detectExperienceLevel(description) : null
      const remoteType = detectRemoteType(job.location || 'Remote')
      const companyLogo = job.company_logo || job.logo || null

      const result = await validateAndSaveJob(
        {
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
          // Enhanced job details
          description,
          salaryMin: job.salary_min || null,
          salaryMax: job.salary_max || null,
          salaryCurrency: job.salary_min ? 'USD' : null,
          experienceLevel,
          remoteType: remoteType || 'Remote',
          companyLogo,
        },
        'remoteok.com'
      )
      if (result.saved) savedCount++
      if (result.isNew) newCount++
      await delay(100)
    } catch (error) {
      console.error('Error saving RemoteOK job:', error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'remoteok.com',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from RemoteOK (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
