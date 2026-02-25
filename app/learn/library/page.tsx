import { createSupabaseServerClient } from '@/lib/supabase-server'
import { domains, type DomainWithJobCount } from './data'
import LearnClient from './LearnClient'

// Tag-based search patterns for each domain
const domainSearchPatterns: Record<string, string[]> = {
  blockchain: ['blockchain', 'web3', 'crypto', 'ethereum', 'bitcoin', 'solidity'],
  defi: ['defi', 'finance', 'trading', 'lending', 'swap', 'yield', 'liquidity'],
  security: ['security', 'audit', 'smart contract', 'vulnerability', 'pen test'],
  layer2: ['layer 2', 'l2', 'rollup', 'zk', 'optimism', 'arbitrum', 'scaling'],
  nft: ['nft', 'digital asset', 'marketplace', 'token', 'erc-721', 'erc-1155'],
  dao: ['dao', 'governance', 'treasury', 'community', 'decentralized'],
}

// Fetch job counts for each domain from database
async function getJobCounts(): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient()

  // 3 months ago for freshness filter (same as jobs API)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // Get all active jobs with their tags, title, category
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('tags, title, category')
    .eq('isActive', true)
    .gte('crawledAt', threeMonthsAgo.toISOString())

  if (error || !jobs) {
    // Return zeros if query fails
    const counts: Record<string, number> = {}
    for (const domain of domains) {
      counts[domain.jobFilterTag] = 0
    }
    return counts
  }

  // Count jobs matching each domain's search patterns
  const counts: Record<string, number> = {}

  for (const domain of domains) {
    const patterns = domainSearchPatterns[domain.jobFilterTag] || [domain.jobFilterTag]

    const matchingJobs = jobs.filter(job => {
      const searchText = [
        job.tags || '',
        job.title || '',
        job.category || ''
      ].join(' ').toLowerCase()

      return patterns.some(pattern => searchText.includes(pattern.toLowerCase()))
    })

    counts[domain.jobFilterTag] = matchingJobs.length
  }

  return counts
}

export default async function LibraryPage() {
  // Fetch dynamic job counts from database
  const jobCounts = await getJobCounts()

  // Combine static domain data with dynamic job counts
  const domainsWithCounts: DomainWithJobCount[] = domains.map(domain => ({
    ...domain,
    jobCount: jobCounts[domain.jobFilterTag] || 0,
  }))

  return <LearnClient domains={domainsWithCounts} />
}
