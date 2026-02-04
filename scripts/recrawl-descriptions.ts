/**
 * Re-crawl job descriptions for existing jobs
 * This script fetches descriptions from source URLs for jobs that don't have them
 * Uses Supabase directly (not Prisma)
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'
import 'dotenv/config'
import { cleanDescriptionText } from '../lib/clean-description'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface JobDetails {
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  experienceLevel?: string
  remoteType?: string
  companyLogo?: string
  companyWebsite?: string
}

// Helper functions
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

// cleanDescription removed — now using shared cleanDescriptionText() from lib/clean-description.ts

function extractHTML($element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  if (!$element.length) return ''

  // Clone to avoid modifying original
  const clone = $element.clone()
  clone.find('script, style, noscript, iframe, svg, nav, header, footer').remove()

  // Remove source-site noise elements
  const noiseSelectors = [
    '[class*="related"]', '[class*="recommended"]', '[class*="similar"]',
    '[class*="share"]', '[class*="social"]', '[class*="sharing"]',
    '[class*="salary-comp"]', '[class*="salary-range"]', '[class*="salary-info"]',
    '[class*="average-salary"]', '[class*="compensation-data"]',
    '[class*="candidate"]', '[class*="profile-card"]',
    '[class*="chat"]', '[class*="interview"]', '[class*="cover-letter"]',
    '[class*="trust"]', '[class*="verified-badge"]', '[class*="verification"]',
    '[class*="cookie"]', '[class*="consent"]',
    '[class*="newsletter"]', '[class*="subscribe"]', '[class*="signup"]',
    '[class*="sidebar"]', '[class*="widget"]',
    '[class*="report"]', '[class*="flag"]',
    '[class*="bookmark"]', '[class*="save-job"]',
    '[class*="apply-section"]', '[class*="apply-btn"]',
    '[class*="comment"]', '[class*="discussion"]',
    '[class*="pagination"]', '[class*="pager"]',
    '[class*="ad-"]', '[class*="advert"]', '[class*="promo"]',
    '[class*="banner"]', '[class*="sponsored"]',
  ]
  for (const sel of noiseSelectors) {
    clone.find(sel).remove()
  }

  let html = clone.html() || ''

  // Convert to cleaner format
  html = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return html
}

function detectExperienceLevel(text: string): string | null {
  const lower = text.toLowerCase()

  if (lower.includes('intern') || lower.includes('entry') || lower.includes('junior') || lower.includes('0-2 year') || lower.includes('신입')) {
    return 'Junior'
  }
  if (lower.includes('mid-level') || lower.includes('mid level') || lower.includes('intermediate') || lower.includes('2-5 year') || lower.includes('경력')) {
    return 'Mid'
  }
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal') || lower.includes('5+ year') || lower.includes('시니어')) {
    return 'Senior'
  }
  if (lower.includes('staff') || lower.includes('architect') || lower.includes('director') || lower.includes('head of')) {
    return 'Lead'
  }

  return null
}

function detectRemoteType(text: string): string | null {
  const lower = text.toLowerCase()

  if (lower.includes('fully remote') || lower.includes('100% remote') || lower.includes('remote only') || lower === 'remote') {
    return 'Remote'
  }
  if (lower.includes('hybrid') || lower.includes('flexible')) {
    return 'Hybrid'
  }
  if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('in-office') || lower.includes('office')) {
    return 'Onsite'
  }

  return null
}

/**
 * Fetch HTML from URL with proper error handling
 */
async function fetchHTML(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
      maxRedirects: 5,
    })
    return cheerio.load(response.data)
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null
    }
    console.error(`  ⚠️ Fetch error: ${error.message}`)
    return null
  }
}

/**
 * Source-specific selectors for different job boards
 */
const SOURCE_SELECTORS: Record<string, {
  description: string[]
  requirements?: string[]
  responsibilities?: string[]
  benefits?: string[]
}> = {
  'web3.career': {
    description: ['.job-description', '.job-content', '[class*="description"]', '.job-details', 'article'],
    requirements: ['[class*="requirement"]', '[class*="qualification"]'],
    responsibilities: ['[class*="responsibilit"]', '[class*="what-you"]'],
    benefits: ['[class*="benefit"]', '[class*="perk"]', '[class*="we-offer"]'],
  },
  'remoteok.com': {
    description: ['.description', '.job-description', '.markdown', '[class*="description"]', '.expandContents'],
  },
  'remote3.co': {
    description: ['.job-content', '.description', 'article', '[class*="content"]', '.prose'],
  },
  'jobs.solana.com': {
    description: ['[class*="description"]', '.job-description', '.content', 'article', '.posting-description'],
  },
  'jobs.sui.io': {
    description: ['[class*="description"]', '.job-description', '.content', 'article', '.posting-description'],
  },
  'ethereum.foundation': {
    description: ['.job-description', '[data-testid="description"]', 'article', '.content'],
  },
  'lever.co': {
    description: ['.section-wrapper', '.posting-description', '[class*="description"]', '.content'],
  },
  'greenhouse.io': {
    description: ['#content', '.job-description', '.content', '[class*="description"]'],
  },
  'ashbyhq.com': {
    description: ['.ashby-job-posting-description', '[class*="description"]', '.content'],
  },
  'wellfound.com': {
    description: ['.job-description', '[class*="description"]', '.styles_description'],
  },
  'cryptojobslist.com': {
    description: ['.job-description', '[class*="description"]', '.content', 'article'],
  },
  default: {
    description: [
      '.job-description',
      '.description',
      '[class*="job-description"]',
      '[class*="description"]',
      '[class*="job-detail"]',
      '[class*="job-content"]',
      '[class*="posting"]',
      'article',
      '.content',
      'main',
      '[role="main"]',
    ],
  },
}

/**
 * Get source key from URL or source field
 */
function getSourceKey(url: string, source: string): string {
  const urlLower = url.toLowerCase()

  for (const key of Object.keys(SOURCE_SELECTORS)) {
    if (key !== 'default' && urlLower.includes(key)) {
      return key
    }
  }

  // Check source field
  const sourceLower = source.toLowerCase()
  for (const key of Object.keys(SOURCE_SELECTORS)) {
    if (key !== 'default' && sourceLower.includes(key)) {
      return key
    }
  }

  return 'default'
}

/**
 * Generic job detail fetcher that works across multiple sources
 */
async function fetchJobDetailsFromUrl(url: string, source: string): Promise<JobDetails> {
  const $ = await fetchHTML(url)
  if (!$) return {}

  const details: JobDetails = {}
  const sourceKey = getSourceKey(url, source)
  const selectors = SOURCE_SELECTORS[sourceKey] || SOURCE_SELECTORS.default

  try {
    // Try each description selector until we find content
    for (const selector of selectors.description) {
      const el = $(selector).first()
      if (el.length) {
        const text = extractHTML(el, $)
        if (text && text.length > 100) {
          details.description = text
          break
        }
      }
    }

    // If no description found, try getting all text from main content
    if (!details.description) {
      const mainContent = $('main, article, [role="main"], .content').first()
      if (mainContent.length) {
        const text = extractHTML(mainContent, $)
        if (text && text.length > 200) {
          details.description = text
        }
      }
    }

    // Look for sections with common headers
    $('h2, h3, h4, strong, b').each((_, el) => {
      const header = cleanText($(el).text()).toLowerCase()
      const nextContent = $(el).nextUntil('h2, h3, h4, strong, b')
      const content = nextContent.length ? extractHTML(nextContent, $) : ''
      const cleanedContent = cleanText(content)

      if (cleanedContent.length < 30) return

      if (!details.requirements && (
        header.includes('requirement') ||
        header.includes('qualif') ||
        header.includes('looking for') ||
        header.includes('must have') ||
        header.includes('need to have') ||
        header.includes('자격') ||
        header.includes('요구사항')
      )) {
        details.requirements = cleanedContent
      }
      if (!details.responsibilities && (
        header.includes('responsib') ||
        header.includes('what you') ||
        header.includes('your role') ||
        header.includes('duties') ||
        header.includes('담당') ||
        header.includes('업무')
      )) {
        details.responsibilities = cleanedContent
      }
      if (!details.benefits && (
        header.includes('benefit') ||
        header.includes('perk') ||
        header.includes('we offer') ||
        header.includes('why join') ||
        header.includes('복리') ||
        header.includes('혜택')
      )) {
        details.benefits = cleanedContent
      }
    })

    // Experience level and remote type detection from full page
    const fullText = $('body').text()
    details.experienceLevel = detectExperienceLevel(fullText) || undefined
    details.remoteType = detectRemoteType(fullText) || undefined

    // Company logo
    const logoImg = $('img[src*="logo"], img[alt*="logo"], .company-logo img, .logo img').first()
    if (logoImg.length) {
      const logoSrc = logoImg.attr('src')
      if (logoSrc && !logoSrc.includes('placeholder') && !logoSrc.includes('data:')) {
        try {
          details.companyLogo = logoSrc.startsWith('http') ? logoSrc : new URL(logoSrc, url).href
        } catch {
          // Invalid URL, skip
        }
      }
    }

    // Company website
    const websiteLinks = $('a[href*="company"], a:contains("website"), a:contains("Visit"), a[rel="noopener"]')
    websiteLinks.each((_, link) => {
      if (details.companyWebsite) return
      const href = $(link).attr('href')
      if (href && href.startsWith('http')) {
        try {
          const linkUrl = new URL(href)
          const pageUrl = new URL(url)
          if (linkUrl.hostname !== pageUrl.hostname) {
            details.companyWebsite = href
          }
        } catch {
          // Invalid URL
        }
      }
    })

  } catch (error) {
    console.error(`  ❌ Error parsing ${url}:`, error)
  }

  return details
}

/**
 * Main function to recrawl descriptions
 */
async function recrawlDescriptions(options: { limit?: number; all?: boolean } = {}) {
  const { limit = 50, all = false } = options

  console.log('🔄 Starting re-crawl for job descriptions...\n')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  console.log(`📡 Connected to Supabase: ${supabaseUrl}\n`)

  // Get all active jobs without descriptions (or all if --all flag)
  let query = supabase
    .from('Job')
    .select('id, url, source, title, company, description')
    .eq('isActive', true)
    .order('postedDate', { ascending: false })
    .order('crawledAt', { ascending: false })

  if (!all) {
    // Only get jobs without descriptions
    query = query.or('description.is.null,description.eq.')
  }

  const { data: jobs, error } = await query.limit(all ? 1000 : limit)

  if (error) {
    console.error('Error fetching jobs:', error)
    return
  }

  // Filter jobs that need description
  const jobsToProcess = all
    ? jobs
    : jobs?.filter(j => !j.description || j.description.length < 100) || []

  console.log(`📦 Found ${jobsToProcess.length} jobs to process\n`)

  let successCount = 0
  let failCount = 0
  let skipCount = 0

  for (let i = 0; i < jobsToProcess.length; i++) {
    const job = jobsToProcess[i]
    console.log(`[${i + 1}/${jobsToProcess.length}] ${job.title?.substring(0, 40)}...`)
    console.log(`  📍 ${job.company} | ${job.source}`)
    console.log(`  🔗 ${job.url.substring(0, 60)}...`)

    // Skip if already has description
    if (job.description && job.description.length > 100 && !all) {
      console.log(`  ⏭️ Already has description (${job.description.length} chars)`)
      skipCount++
      continue
    }

    try {
      const details = await fetchJobDetailsFromUrl(job.url, job.source)

      if (details.description && details.description.length > 50) {
        // Clean the description to remove junk
        const cleanedDesc = cleanDescriptionText(details.description)

        // Only update description field (other fields may not exist in Supabase schema)
        const updateData: any = {
          description: cleanedDesc.substring(0, 10000), // Limit size
        }

        const { error: updateError } = await supabase
          .from('Job')
          .update(updateData)
          .eq('id', job.id)

        if (updateError) {
          console.log(`  ⚠️ Update error: ${updateError.message}`)
          failCount++
        } else {
          console.log(`  ✅ Updated with ${details.description.length} chars description`)
          successCount++
        }
      } else {
        console.log(`  ⚠️ No description found or too short`)
        failCount++
      }
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`)
      failCount++
    }

    // Rate limiting
    await delay(800)
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Failed/No content: ${failCount}`)
  console.log(`⏭️ Skipped (already has): ${skipCount}`)
  console.log(`${'═'.repeat(50)}`)

  // Print stats
  const [totalResult, withDescResult] = await Promise.all([
    supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true),
    supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true).not('description', 'is', null),
  ])

  console.log(`\n📊 Description Statistics:`)
  console.log(`  Active Jobs: ${totalResult.count || 0}`)
  console.log(`  With Description: ${withDescResult.count || 0}`)
  console.log(`  Coverage: ${totalResult.count ? ((withDescResult.count || 0) / totalResult.count * 100).toFixed(1) : 0}%`)

  return { successCount, failCount, skipCount }
}

// CLI arguments
const args = process.argv.slice(2)
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 50
const all = args.includes('--all')

// Run
recrawlDescriptions({ limit, all }).catch(console.error)
