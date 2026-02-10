import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron: runs every 3 hours
// vercel.json: { "path": "/api/cron/crawl", "schedule": "0 */3 * * *" }

export const maxDuration = 300 // 5 minutes (Vercel Pro)
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('🚀 Cron crawl started at', new Date().toISOString())

    // Import crawlers dynamically to avoid cold start issues
    const { crawlPriorityCompanies } = await import('@/scripts/crawlers/priority-companies')
    const { crawlWeb3Career } = await import('@/scripts/crawlers/web3career')
    const { crawlCryptoJobsList } = await import('@/scripts/crawlers/cryptojobslist')
    const { crawlRemote3 } = await import('@/scripts/crawlers/remote3')
    const { crawlRemoteOK } = await import('@/scripts/crawlers/remoteok')
    const { crawlSuiJobs } = await import('@/scripts/crawlers/suijobs')
    const { crawlSolanaJobs } = await import('@/scripts/crawlers/solanajobs')
    const { crawlEthereumJobs } = await import('@/scripts/crawlers/ethereum')

    const results: { source: string; count: number; error?: string }[] = []

    // Run crawlers sequentially to avoid rate limits
    const crawlers = [
      { name: 'priority-companies', fn: crawlPriorityCompanies },
      { name: 'web3.career', fn: crawlWeb3Career },
      { name: 'cryptojobslist', fn: crawlCryptoJobsList },
      { name: 'remote3', fn: crawlRemote3 },
      { name: 'remoteok', fn: crawlRemoteOK },
      { name: 'sui-jobs', fn: crawlSuiJobs },
      { name: 'solana-jobs', fn: crawlSolanaJobs },
      { name: 'ethereum-jobs', fn: crawlEthereumJobs },
    ]

    for (const crawler of crawlers) {
      // Check if we're running out of time (leave 30s buffer)
      if (Date.now() - startTime > (maxDuration - 30) * 1000) {
        console.log('⏰ Time limit approaching, stopping early')
        break
      }

      try {
        const count = await crawler.fn()
        results.push({ source: crawler.name, count })
        console.log(`✅ ${crawler.name}: ${count} jobs`)
      } catch (error: any) {
        console.error(`❌ ${crawler.name}:`, error.message)
        results.push({ source: crawler.name, count: 0, error: error.message })
      }
    }

    const totalJobs = results.reduce((sum, r) => sum + r.count, 0)
    const duration = Math.round((Date.now() - startTime) / 1000)

    // Log to crawl_history table (ignore if table doesn't exist)
    try {
      await supabase.from('crawl_history').insert({
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        total_jobs: totalJobs,
        sources_crawled: results.length,
        status: 'completed',
        details: results,
      })
    } catch {
      // Table may not exist
    }

    console.log(`\n✅ Cron crawl completed: ${totalJobs} jobs in ${duration}s`)

    return NextResponse.json({
      success: true,
      totalJobs,
      duration: `${duration}s`,
      results,
    })
  } catch (error: any) {
    console.error('❌ Cron crawl failed:', error)

    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
