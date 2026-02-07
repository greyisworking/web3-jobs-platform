import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { summarizeJob, type JobMetadata } from '../lib/job-summarizer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function main() {
  // Get test jobs
  const { data: jobs } = await supabase
    .from('Job')
    .select('*')
    .or('company.ilike.%somnia%,company.ilike.%onepay%')
    .not('raw_description', 'is', null)
    .limit(3)

  if (!jobs || jobs.length === 0) {
    console.log('No jobs found')
    return
  }

  for (const job of jobs) {
    console.log('\n' + '='.repeat(80))
    console.log(`Job: ${job.title} @ ${job.company}`)
    console.log('='.repeat(80))

    const metadata: JobMetadata = {
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      experienceLevel: job.experienceLevel,
      remoteType: job.remoteType,
      type: job.type,
      backers: job.backers,
      sector: job.sector,
      tags: job.tags,
    }

    const result = summarizeJob(job.raw_description || '', metadata)

    console.log(`\nSections: ${Object.keys(result.sections).filter(k => result.sections[k as keyof typeof result.sections]).join(', ')}`)
    console.log(`Summary: ${result.summary.length} chars (from ${job.raw_description?.length} raw)`)

    console.log('\n--- Summary ---\n')
    console.log(result.summary)
  }
}

main().catch(console.error)
