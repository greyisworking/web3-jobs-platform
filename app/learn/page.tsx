import { createSupabaseServerClient } from '@/lib/supabase-server'
import { domains, type DomainWithJobCount } from './data'
import LearnClient from './LearnClient'

// Fetch job counts for each domain from database
async function getJobCounts(): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient()

  // Get all job filter tags
  const tags = domains.map(d => d.jobFilterTag)

  // 3 months ago for freshness filter (same as jobs API)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // Query job counts for each tag in parallel
  // Tags are stored as JSON string, so use ilike for searching
  const results = await Promise.all(
    tags.map(async (tag) => {
      // Search in tags (JSON string), title, or category
      const { count, error } = await supabase
        .from('Job')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true)
        .gte('crawledAt', threeMonthsAgo.toISOString())
        .or(`tags.ilike.%${tag}%,title.ilike.%${tag}%,category.ilike.%${tag}%`)

      return { tag, count: error ? 0 : (count ?? 0) }
    })
  )

  // Convert to record
  const counts: Record<string, number> = {}
  for (const { tag, count } of results) {
    counts[tag] = count
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
