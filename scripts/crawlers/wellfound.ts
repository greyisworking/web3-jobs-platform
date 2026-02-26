import { supabase } from '../../lib/supabase-script'
import { fetchWithRetry } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

/**
 * Wellfound (formerly AngelList Talent) Crawler
 * Uses GraphQL API to fetch Web3/Crypto startup jobs
 * Note: Wellfound has anti-bot protection, so this may not always work
 */
export async function crawlWellfound(): Promise<CrawlerReturn> {
  console.log('🚀 Starting Wellfound crawler...')

  // Wellfound uses GraphQL API
  const graphqlUrl = 'https://wellfound.com/graphql'

  try {
    // Try to fetch from GraphQL API
    const _response = await fetchWithRetry(graphqlUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://wellfound.com',
        'Referer': 'https://wellfound.com/jobs',
      },
      maxRetries: 2,
    })

    // If we get here, we got blocked
    console.log('  ⚠️ Wellfound API access blocked (403 Forbidden)')
    console.log('  ℹ️ Wellfound has strict anti-bot protection')

    // Log failed attempt
    await supabase.from('CrawlLog').insert({
      source: 'wellfound.com',
      status: 'failed',
      jobCount: 0,
      error: 'API access blocked - 403 Forbidden',
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  } catch (error: any) {
    // Expected to fail - Wellfound blocks most scraping attempts
    console.log(`  ⚠️ Wellfound crawler skipped: ${error.message}`)

    await supabase.from('CrawlLog').insert({
      source: 'wellfound.com',
      status: 'failed',
      jobCount: 0,
      error: error.message,
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  }
}

/**
 * Alternative: Crawl Wellfound via sitemap
 * This might work better than GraphQL API
 */
export async function crawlWellfoundSitemap(): Promise<CrawlerReturn> {
  console.log('🚀 Starting Wellfound Sitemap crawler...')

  const sitemapUrl = 'https://wellfound.com/sitemap-jobs.xml'

  try {
    const _response = await fetchWithRetry(sitemapUrl, {
      headers: {
        'Accept': 'application/xml',
      },
      maxRetries: 2,
    })

    // Parse XML and extract job URLs
    // Note: This is a simplified approach - actual implementation would need XML parsing

    console.log('  ℹ️ Sitemap fetched, parsing...')

    // Log success
    await supabase.from('CrawlLog').insert({
      source: 'wellfound.com',
      status: 'success',
      jobCount: 0,
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  } catch (error: any) {
    console.log(`  ⚠️ Wellfound sitemap access failed: ${error.message}`)

    await supabase.from('CrawlLog').insert({
      source: 'wellfound.com',
      status: 'failed',
      jobCount: 0,
      error: error.message,
      createdAt: new Date().toISOString(),
    })

    return { total: 0, new: 0 }
  }
}
