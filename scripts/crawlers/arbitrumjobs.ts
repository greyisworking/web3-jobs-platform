import { crawlGetroBoard } from './platforms'

export async function crawlArbitrumJobs(): Promise<number> {
  return crawlGetroBoard({
    baseUrl: 'https://jobs.arbitrum.io',
    source: 'jobs.arbitrum.io',
    displayName: 'Arbitrum Jobs',
    tags: ['Arbitrum', 'Layer 2', 'Ethereum'],
    defaultCompany: 'Arbitrum Ecosystem',
    emoji: '🔵',
    networkId: '4184',
  })
}

// Allow standalone execution: npx tsx scripts/crawlers/arbitrumjobs.ts
if (require.main === module) {
  crawlArbitrumJobs()
    .then((count) => {
      console.log(`\nDone — ${count} jobs saved`)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
