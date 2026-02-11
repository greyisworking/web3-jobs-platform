import { crawlGetroBoard, type CrawlerReturn } from './platforms'

export async function crawlArbitrumJobs(): Promise<CrawlerReturn> {
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
    .then((result) => {
      console.log(`\nDone — ${result.total} jobs saved (${result.new} new)`)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
