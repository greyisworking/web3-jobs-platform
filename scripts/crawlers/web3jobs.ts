import { supabase } from '../../lib/supabase-script'

export async function crawlWeb3Jobs(): Promise<number> {
  console.log('🚀 Starting Web3Jobs crawler...')
  console.warn('⚠️  web3jobs.cc is currently unreachable (DNS resolution fails). Skipping.')

  await supabase.from('CrawlLog').insert({
    source: 'web3jobs.cc',
    status: 'skipped',
    jobCount: 0,
    createdAt: new Date().toISOString(),
  })

  return 0
}
