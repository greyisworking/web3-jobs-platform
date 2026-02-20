import { createSupabaseServerClient } from '@/lib/supabase-server'
import { domains, type DomainWithJobCount } from './data'
import LearnClient from './LearnClient'

// Fetch job counts for each domain from database
async function getJobCounts(): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient()

  // Get all job filter tags
  const tags = domains.map(d => d.jobFilterTag)

  // Query job counts for each tag
  // Jobs are filtered by tags array containing the tag (case-insensitive)
  const counts: Record<string, number> = {}

  for (const tag of tags) {
    const { count, error } = await supabase
      .from('Job')
      .select('*', { count: 'exact', head: true })
      .or(`tags.ilike.%${tag}%,title.ilike.%${tag}%,description.ilike.%${tag}%`)
      .eq('status', 'active')

    if (!error && count !== null) {
      counts[tag] = count
    } else {
      counts[tag] = 0
    }
  }

  return counts
}

export default async function LearnPage() {
  // Fetch dynamic job counts from database
  const jobCounts = await getJobCounts()

  // Combine static domain data with dynamic job counts
  const domainsWithCounts: DomainWithJobCount[] = domains.map(domain => ({
    ...domain,
    jobCount: jobCounts[domain.jobFilterTag] || 0,
  }))

  return <LearnClient domains={domainsWithCounts} />
}
