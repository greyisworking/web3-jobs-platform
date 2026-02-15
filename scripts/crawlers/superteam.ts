import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchJSON, fetchHTML, delay, cleanText, parseSalary } from '../utils'

interface CrawlerReturn {
  total: number
  new: number
}

interface SuperteamListing {
  id: string
  title: string
  slug: string
  type: 'bounty' | 'project' | 'job'
  sponsor: {
    name: string
    logo?: string
    slug?: string
  }
  skills: string[]
  minRewardAsk?: number
  maxRewardAsk?: number
  rewardAmount?: number
  token?: string
  deadline?: string
  status: string
  isWinnersAnnounced?: boolean
  description?: string
  requirements?: string
  eligibility?: string
}

/**
 * Superteam Earn Crawler
 * Crawls bounties, projects, and jobs from Superteam's platform
 * Focuses on Solana ecosystem opportunities
 */
export async function crawlSuperteamEarn(): Promise<CrawlerReturn> {
  console.log('🚀 Starting Superteam Earn crawler...')

  const baseUrl = 'https://superteam.fun'
  const earnUrl = `${baseUrl}/earn/`

  // Try to fetch the page and extract __NEXT_DATA__
  const $ = await fetchHTML(earnUrl)

  if (!$) {
    console.error('  ❌ Failed to fetch Superteam Earn page')
    await supabase.from('CrawlLog').insert({
      source: 'talent.superteam.fun',
      status: 'failed',
      jobCount: 0,
      error: 'Failed to fetch page',
      createdAt: new Date().toISOString(),
    })
    return { total: 0, new: 0 }
  }

  // Try to extract __NEXT_DATA__
  const nextDataScript = $('script#__NEXT_DATA__').html()

  if (!nextDataScript) {
    console.log('  ⚠️ No __NEXT_DATA__ found, trying API fallback...')

    // Try API endpoints
    const apiEndpoints = [
      `${baseUrl}/api/listings`,
      `${baseUrl}/api/bounties`,
      `${baseUrl}/api/earn/listings`,
    ]

    for (const endpoint of apiEndpoints) {
      try {
        const data = await fetchJSON(endpoint)
        if (data && Array.isArray(data)) {
          console.log(`  ✅ Found API: ${endpoint}`)
          // Process data
          break
        }
      } catch (e) {
        continue
      }
    }
  }

  let listings: SuperteamListing[] = []

  try {
    if (nextDataScript) {
      const nextData = JSON.parse(nextDataScript)
      const pageProps = nextData?.props?.pageProps

      // Look for listings in various possible locations
      listings = pageProps?.listings ||
                 pageProps?.bounties ||
                 pageProps?.projects ||
                 pageProps?.initialData?.listings ||
                 []
    }
  } catch (error) {
    console.error('  Error parsing __NEXT_DATA__:', error)
  }

  // If no listings found, try to scrape from HTML
  if (listings.length === 0) {
    console.log('  📄 Scraping listings from HTML...')

    const scrapedJobs: Array<{
      title: string
      company: string
      url: string
      location: string
      type: string
      category: string
      tags: string[]
      salary?: string
    }> = []

    // Look for listing cards
    $('a[href*="/listings/"], a[href*="/bounties/"], a[href*="/projects/"]').each((_, el) => {
      try {
        const $el = $(el)
        const href = $el.attr('href') || ''

        // Skip navigation links
        if (!href.match(/\/(listings|bounties|projects)\/[\w-]+/)) return

        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`

        // Get parent container
        const $card = $el.closest('div').first()
        const cardText = $card.text()

        // Extract title
        let title = cleanText($el.find('h2, h3, h4').first().text() || $el.text())
        if (title.length < 5) return

        // Extract sponsor/company name
        let company = 'Superteam'
        const sponsorEl = $card.find('[class*="sponsor"], [class*="company"]')
        if (sponsorEl.length) {
          company = cleanText(sponsorEl.text())
        }

        // Determine type from URL
        let type = 'Bounty'
        if (href.includes('/projects/')) type = 'Contract'
        if (href.includes('/listings/') && cardText.toLowerCase().includes('job')) type = 'Full-time'

        // Extract tags
        const tags = ['Solana', 'Web3']
        if (cardText.toLowerCase().includes('design')) tags.push('Design')
        if (cardText.toLowerCase().includes('dev')) tags.push('Development')
        if (cardText.toLowerCase().includes('content')) tags.push('Content')

        // Extract reward/salary
        let salary: string | undefined
        const rewardMatch = cardText.match(/(\$[\d,]+|\d+\s*SOL|\d+\s*USDC)/i)
        if (rewardMatch) {
          salary = rewardMatch[1]
        }

        scrapedJobs.push({
          title,
          company,
          url: fullUrl,
          location: 'Remote',
          type,
          category: type === 'Full-time' ? 'Engineering' : 'Community',
          tags,
          salary,
        })
      } catch (error) {
        // Skip invalid entries
      }
    })

    console.log(`📦 Found ${scrapedJobs.length} listings from Superteam Earn`)

    let savedCount = 0
    let newCount = 0

    for (const job of scrapedJobs) {
      try {
        const salaryInfo = parseSalary(job.salary)

        const result = await validateAndSaveJob(
          {
            title: job.title,
            company: job.company,
            url: job.url,
            location: job.location,
            type: job.type,
            category: job.category,
            salary: job.salary,
            tags: job.tags,
            source: 'talent.superteam.fun',
            region: 'Global',
            postedDate: new Date(),
            salaryMin: salaryInfo.min,
            salaryMax: salaryInfo.max,
            salaryCurrency: salaryInfo.currency,
          },
          'talent.superteam.fun'
        )

        if (result.saved) savedCount++
        if (result.isNew) newCount++

        await delay(100)
      } catch (error) {
        console.error(`  Error saving listing:`, error)
      }
    }

    await supabase.from('CrawlLog').insert({
      source: 'talent.superteam.fun',
      status: 'success',
      jobCount: savedCount,
      createdAt: new Date().toISOString(),
    })

    console.log(`✅ Saved ${savedCount} listings from Superteam Earn (${newCount} new)`)
    return { total: savedCount, new: newCount }
  }

  // Process structured listings
  console.log(`📦 Found ${listings.length} listings from Superteam Earn`)

  let savedCount = 0
  let newCount = 0

  for (const listing of listings) {
    try {
      // Skip completed bounties
      if (listing.isWinnersAnnounced) continue
      if (listing.status === 'completed' || listing.status === 'closed') continue

      const url = `${baseUrl}/listings/${listing.slug}`

      // Determine job type
      let type = 'Contract'
      if (listing.type === 'job') type = 'Full-time'
      if (listing.type === 'bounty') type = 'Bounty'

      // Calculate salary/reward
      let salary: string | undefined
      if (listing.rewardAmount) {
        const token = listing.token || 'USDC'
        salary = `${listing.rewardAmount} ${token}`
      } else if (listing.minRewardAsk && listing.maxRewardAsk) {
        salary = `$${listing.minRewardAsk} - $${listing.maxRewardAsk}`
      }

      const salaryInfo = parseSalary(salary)

      const result = await validateAndSaveJob(
        {
          title: listing.title,
          company: listing.sponsor?.name || 'Superteam',
          url,
          location: 'Remote',
          type,
          category: listing.skills?.includes('development') ? 'Engineering' : 'Community',
          salary,
          tags: ['Solana', 'Web3', ...(listing.skills || [])],
          source: 'talent.superteam.fun',
          region: 'Global',
          postedDate: new Date(),
          description: listing.description,
          requirements: listing.requirements || listing.eligibility,
          salaryMin: salaryInfo.min,
          salaryMax: salaryInfo.max,
          salaryCurrency: salaryInfo.currency || 'USD',
          companyLogo: listing.sponsor?.logo,
          deadline: listing.deadline ? new Date(listing.deadline) : undefined,
        },
        'talent.superteam.fun'
      )

      if (result.saved) savedCount++
      if (result.isNew) newCount++

      await delay(100)
    } catch (error) {
      console.error(`  Error saving listing ${listing.title}:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source: 'talent.superteam.fun',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} listings from Superteam Earn (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
