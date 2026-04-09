import { crawlGetroBoard, type CrawlerReturn } from './platforms'

export async function crawlSolanaJobs(): Promise<CrawlerReturn> {
  return crawlGetroBoard({
    baseUrl: 'https://jobs.solana.com',
    source: 'jobs.solana.com',
    displayName: 'Solana Jobs',
    tags: ['Solana', 'Blockchain', 'Layer 1'],
    defaultCompany: 'Solana Foundation',
    emoji: '🚀',
    networkId: '858',
    fetchDescriptions: true,
    maxDescriptionFetches: 500,
  })
}
