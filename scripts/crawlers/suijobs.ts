import { crawlGetroBoard } from './platforms'

export async function crawlSuiJobs(): Promise<number> {
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
