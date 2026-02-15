import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { fetchHTML, delay, cleanText, parseSalary, detectExperienceLevel, detectRemoteType } from '../utils'
import { cleanDescriptionText } from '../../lib/clean-description'

interface CrawlerReturn {
  total: number
  new: number
}

/**
 * Fetch job details from individual job page
 */
async function fetchJobDetails(jobUrl: string): Promise<{
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  experienceLevel?: string
  remoteType?: string
  companyLogo?: string
  companyWebsite?: string
}> {
  const $ = await fetchHTML(jobUrl)
  if (!$) return {}

  const details: Record<string, string | undefined> = {}

  try {
    // Job description - main content area
    const descriptionEl = $('article, .job-description, [class*="description"], .content, main')
    if (descriptionEl.length) {
      // Get text content, clean it up
      let rawText = descriptionEl.first().text()
      // Remove excessive whitespace
      rawText = rawText.replace(/\s+/g, ' ').trim()
      if (rawText.length > 100) {
        details.description = cleanDescriptionText(rawText.slice(0, 5000))
      }
    }

    // Look for specific sections
    $('h2, h3, h4, strong').each((_, el) => {
      const header = cleanText($(el).text()).toLowerCase()
      const nextContent = $(el).nextAll().first().text()
      const content = cleanText(nextContent || '')

      if (content.length > 50) {
        if (header.includes('requirement') || header.includes('qualif') || header.includes('skills') || header.includes('experience')) {
          details.requirements = content.slice(0, 2000)
        }
        if (header.includes('responsib') || header.includes('what you') || header.includes('duties') || header.includes('role')) {
          details.responsibilities = content.slice(0, 2000)
        }
        if (header.includes('benefit') || header.includes('perk') || header.includes('offer') || header.includes('compensation')) {
          details.benefits = content.slice(0, 2000)
        }
      }
    })

    // Company logo
    const logoImg = $('img[src*="logo"], .company-logo img, [class*="company"] img').first()
    if (logoImg.length) {
      const logoSrc = logoImg.attr('src')
      if (logoSrc && !logoSrc.includes('placeholder') && logoSrc.startsWith('http')) {
        details.companyLogo = logoSrc
      }
    }

    // Detect experience level and remote type from full text
    const fullText = $('body').text()
    details.experienceLevel = detectExperienceLevel(fullText) || undefined
    details.remoteType = detectRemoteType(fullText) || undefined

  } catch (error) {
    console.error(`  Error fetching details from ${jobUrl}:`, error)
  }

  return details
}

/**
 * CryptocurrencyJobs.co Crawler
 * Crawls the main jobs listing page and extracts job data from HTML
 */
export async function crawlCryptocurrencyJobs(): Promise<CrawlerReturn> {
  console.log('🚀 Starting CryptocurrencyJobs crawler...')

  const baseUrl = 'https://cryptocurrencyjobs.co'
  const pages = [
    `${baseUrl}/`,  // Main page
    `${baseUrl}/web3/`,  // Web3 specific jobs
    `${baseUrl}/engineering/`,  // Engineering jobs
    `${baseUrl}/remote/`,  // Remote jobs
  ]

  const allJobs: Array<{
    title: string
    company: string
    url: string
    location: string
    type: string
    category: string
    salary?: string
    tags: string[]
  }> = []

  const seenUrls = new Set<string>()

  for (const pageUrl of pages) {
    console.log(`  📄 Fetching ${pageUrl}`)
    const $ = await fetchHTML(pageUrl)

    if (!$) {
      console.error(`  ❌ Failed to fetch ${pageUrl}`)
      continue
    }

    // Find job listings - they are typically in <a> tags that link to job pages
    // The URL pattern is: /category/company-job-title/
    $('a[href*="/"][href$="/"]').each((_, el) => {
      try {
        const $el = $(el)
        const href = $el.attr('href') || ''

        // Filter for job links (they have category prefix and job slug)
        // Pattern: /engineering/company-job-title/ or /marketing/company-job-title/
        const jobUrlPattern = /^\/(engineering|marketing|sales|design|product|operations|community|legal|finance|data|defi|nft|web3|remote|full-time|part-time|contract)\/.+\/$/
        if (!jobUrlPattern.test(href)) return

        // Skip if URL looks like a category page (no hyphen in slug)
        const slug = href.split('/').filter(Boolean)[1] || ''
        if (!slug.includes('-')) return

        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`

        // Skip duplicates
        if (seenUrls.has(fullUrl)) return
        seenUrls.add(fullUrl)

        // Try to get title from this link or parent container
        let title = cleanText($el.text())

        // If title is too short, it might be a badge - look for nearby title
        if (title.length < 5 || title.length > 200) {
          // Look in parent or sibling elements
          const parent = $el.parent().parent()
          const possibleTitle = parent.find('a').first().text()
          if (possibleTitle.length > 5 && possibleTitle.length < 200) {
            title = cleanText(possibleTitle)
          }
        }

        // Skip if still no valid title
        if (title.length < 5) return

        // Try to extract company name from parent container
        let company = 'Unknown'
        const parentContainer = $el.closest('li, article, div[class*="job"], div[class*="card"]')
        if (parentContainer.length) {
          // Look for company link (usually links to /company/name/)
          const companyLink = parentContainer.find('a[href*="/company/"]')
          if (companyLink.length) {
            company = cleanText(companyLink.text())
          } else {
            // Look for any text that might be company name
            const allText = parentContainer.text()
            // Company name is usually before "Remote" or location
            const match = allText.match(/([A-Z][a-zA-Z0-9\s&.]+)(?=\s*Remote|\s*Full-Time|\s*Part-Time|\s*Contract)/i)
            if (match) {
              company = cleanText(match[1])
            }
          }
        }

        // Extract location
        let location = 'Remote'
        const locationText = parentContainer?.text() || ''
        if (locationText.toLowerCase().includes('remote')) {
          location = 'Remote'
        } else {
          // Look for location patterns
          const locationMatch = locationText.match(/([\w\s,]+(?:USA|UK|Europe|Asia|Germany|France|Singapore|UAE))/i)
          if (locationMatch) {
            location = cleanText(locationMatch[1])
          }
        }

        // Extract employment type
        let type = 'Full-time'
        if (locationText.toLowerCase().includes('contract')) {
          type = 'Contract'
        } else if (locationText.toLowerCase().includes('part-time')) {
          type = 'Part-time'
        }

        // Extract category from URL
        const category = href.split('/')[1] || 'Engineering'
        const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1)

        // Extract salary if visible
        let salary: string | undefined
        const salaryMatch = locationText.match(/(\$[\d,]+K?\s*[-–]\s*\$?[\d,]+K?|£[\d,]+K?\s*[-–]\s*£?[\d,]+K?|€[\d,]+K?\s*[-–]\s*€?[\d,]+K?)/i)
        if (salaryMatch) {
          salary = salaryMatch[1]
        }

        // Extract tags from badges
        const tags: string[] = []
        parentContainer?.find('a[href^="/"]').each((_, badge) => {
          const badgeText = cleanText($(badge).text())
          if (badgeText.length > 1 && badgeText.length < 30) {
            const lowerBadge = badgeText.toLowerCase()
            // Skip common non-tag badges
            if (!['featured', 'today', 'remote', 'full-time', 'part-time', 'contract'].includes(lowerBadge)) {
              tags.push(badgeText)
            }
          }
        })

        allJobs.push({
          title,
          company,
          url: fullUrl,
          location,
          type,
          category: ['Engineering', 'Marketing', 'Sales', 'Design', 'Product', 'Operations', 'Community'].includes(normalizedCategory)
            ? normalizedCategory
            : 'Engineering',
          salary,
          tags: tags.slice(0, 10), // Limit tags
        })
      } catch (error) {
        // Skip invalid entries
      }
    })

    await delay(500) // Rate limit between pages
  }

  // Remove duplicates by URL
  const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.url, j])).values())

  console.log(`📦 Found ${uniqueJobs.length} unique jobs from CryptocurrencyJobs`)

  let savedCount = 0
  let newCount = 0

  for (const job of uniqueJobs) {
    try {
      // Fetch job details for first 50 jobs only (rate limiting)
      let details = {}
      if (savedCount < 50) {
        console.log(`  📄 Fetching details: ${job.title.slice(0, 50)}...`)
        details = await fetchJobDetails(job.url)
        await delay(300)
      }

      // Parse salary
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
          source: 'cryptocurrencyjobs.co',
          region: 'Global',
          postedDate: new Date(),
          // Enhanced details
          description: (details as any).description,
          requirements: (details as any).requirements,
          responsibilities: (details as any).responsibilities,
          benefits: (details as any).benefits,
          salaryMin: salaryInfo.min,
          salaryMax: salaryInfo.max,
          salaryCurrency: salaryInfo.currency,
          experienceLevel: (details as any).experienceLevel,
          remoteType: (details as any).remoteType,
          companyLogo: (details as any).companyLogo,
        },
        'cryptocurrencyjobs.co'
      )

      if (result.saved) savedCount++
      if (result.isNew) newCount++

      await delay(100)
    } catch (error) {
      console.error(`  Error saving job ${job.url}:`, error)
    }
  }

  // Log crawl result
  await supabase.from('CrawlLog').insert({
    source: 'cryptocurrencyjobs.co',
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from CryptocurrencyJobs (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
