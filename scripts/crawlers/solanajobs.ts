import { crawlGetroBoard } from './platforms'

export async function crawlSolanaJobs(): Promise<number> {
  return crawlGetroBoard({
    baseUrl: 'https://jobs.solana.com',
    source: 'jobs.solana.com',
    displayName: 'Solana Jobs',
    tags: ['Solana', 'Blockchain', 'Layer 1'],
    defaultCompany: 'Solana Foundation',
    emoji: '🚀',
  })
}
