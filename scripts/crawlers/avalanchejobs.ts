import { crawlGetroBoard, type CrawlerReturn } from './platforms'

export async function crawlAvalancheJobs(): Promise<CrawlerReturn> {
  return crawlGetroBoard({
    baseUrl: 'https://jobs.avax.network',
    source: 'jobs.avax.network',
    displayName: 'Avalanche Jobs',
    tags: ['Avalanche', 'AVAX', 'Layer 1'],
    defaultCompany: 'Avalanche Ecosystem',
    emoji: '🏔️',
    networkId: '10223',
  })
}

// Allow standalone execution: npx tsx scripts/crawlers/avalanchejobs.ts
if (require.main === module) {
  crawlAvalancheJobs()
    .then((result) => {
      console.log(`\nDone — ${result.total} jobs saved (${result.new} new)`)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
