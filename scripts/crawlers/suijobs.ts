import { crawlGetroBoard, type CrawlerReturn } from './platforms'

export async function crawlSuiJobs(): Promise<CrawlerReturn> {
  return crawlGetroBoard({
    baseUrl: 'https://jobs.sui.io',
    source: 'jobs.sui.io',
    displayName: 'Sui Jobs',
    tags: ['Sui', 'Blockchain', 'Layer 1'],
    defaultCompany: 'Sui Foundation',
    emoji: '🚀',
    networkId: '3425',
  })
}
