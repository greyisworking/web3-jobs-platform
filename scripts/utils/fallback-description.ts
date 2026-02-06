import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * Fallback description fetcher for non-ATS job URLs.
 * Attempts to extract job description from:
 * 1. og:description meta tag
 * 2. meta description
 * 3. Main content areas (article, main, .job-description, etc.)
 * 4. Structured data (JSON-LD)
 */

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Common job description selectors
const JD_SELECTORS = [
  '.job-description',
  '.job-details',
  '.job-content',
  '.description',
  '.posting-description',
  '.job-body',
  '[data-testid="job-description"]',
  '[class*="job-description"]',
  '[class*="JobDescription"]',
  '[id*="job-description"]',
  'article',
  'main',
  '.content',
  '#content',
]

// Minimum length for a valid description
const MIN_DESCRIPTION_LENGTH = 100

interface FetchResult {
  description: string | null
  source: 'og' | 'meta' | 'jsonld' | 'html' | null
}

/**
 * Fetch and parse HTML from a URL
 */
async function fetchHTML(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
      maxRedirects: 5,
    })
    return cheerio.load(response.data)
  } catch (error) {
    return null
  }
}

/**
 * Extract text from HTML, cleaning up whitespace
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')  // Remove any remaining HTML tags
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .replace(/\n\s*\n/g, '\n')  // Remove multiple newlines
    .trim()
}

/**
 * Try to extract description from meta tags
 */
function extractFromMeta($: cheerio.CheerioAPI): string | null {
  // Try og:description first
  const ogDesc = $('meta[property="og:description"]').attr('content')
  if (ogDesc && ogDesc.length > MIN_DESCRIPTION_LENGTH) {
    return cleanText(ogDesc)
  }

  // Try regular meta description
  const metaDesc = $('meta[name="description"]').attr('content')
  if (metaDesc && metaDesc.length > MIN_DESCRIPTION_LENGTH) {
    return cleanText(metaDesc)
  }

  // Try twitter:description
  const twitterDesc = $('meta[name="twitter:description"]').attr('content')
  if (twitterDesc && twitterDesc.length > MIN_DESCRIPTION_LENGTH) {
    return cleanText(twitterDesc)
  }

  return null
}

/**
 * Try to extract from JSON-LD structured data
 */
function extractFromJsonLd($: cheerio.CheerioAPI): string | null {
  const scripts = $('script[type="application/ld+json"]')

  for (let i = 0; i < scripts.length; i++) {
    try {
      const content = $(scripts[i]).html()
      if (!content) continue

      const data = JSON.parse(content)

      // Handle array of items
      const items = Array.isArray(data) ? data : [data]

      for (const item of items) {
        // JobPosting schema
        if (item['@type'] === 'JobPosting') {
          const desc = item.description || item.responsibilities || item.qualifications
          if (desc && desc.length > MIN_DESCRIPTION_LENGTH) {
            return cleanText(desc)
          }
        }

        // Check nested items
        if (item['@graph']) {
          for (const nested of item['@graph']) {
            if (nested['@type'] === 'JobPosting' && nested.description) {
              return cleanText(nested.description)
            }
          }
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  }

  return null
}

/**
 * Try to extract from HTML content areas
 */
function extractFromHTML($: cheerio.CheerioAPI): string | null {
  for (const selector of JD_SELECTORS) {
    const element = $(selector).first()
    if (element.length) {
      const text = element.text()
      if (text && text.length > MIN_DESCRIPTION_LENGTH) {
        return cleanText(text)
      }
    }
  }

  // Fallback: try to find the largest text block
  const bodyText = $('body').text()
  if (bodyText && bodyText.length > MIN_DESCRIPTION_LENGTH) {
    // Only return first 5000 chars to avoid too much noise
    return cleanText(bodyText).substring(0, 5000)
  }

  return null
}

/**
 * Main function: attempt to fetch job description from any URL
 */
export async function fetchFallbackDescription(url: string): Promise<FetchResult> {
  const $ = await fetchHTML(url)
  if (!$) {
    return { description: null, source: null }
  }

  // Try JSON-LD first (most structured)
  const jsonLdDesc = extractFromJsonLd($)
  if (jsonLdDesc) {
    return { description: jsonLdDesc, source: 'jsonld' }
  }

  // Try meta tags
  const metaDesc = extractFromMeta($)
  if (metaDesc) {
    return { description: metaDesc, source: 'meta' }
  }

  // Try HTML content areas
  const htmlDesc = extractFromHTML($)
  if (htmlDesc) {
    return { description: htmlDesc, source: 'html' }
  }

  return { description: null, source: null }
}

/**
 * Batch update: fetch descriptions for jobs without them
 */
export async function updateMissingDescriptions(
  jobs: Array<{ id: string; url: string }>,
  updateFn: (id: string, description: string) => Promise<void>,
  options: { maxJobs?: number; delayMs?: number } = {}
): Promise<{ updated: number; failed: number }> {
  const { maxJobs = 100, delayMs = 500 } = options
  let updated = 0
  let failed = 0

  const jobsToProcess = jobs.slice(0, maxJobs)

  for (const job of jobsToProcess) {
    try {
      const result = await fetchFallbackDescription(job.url)

      if (result.description) {
        await updateFn(job.id, result.description)
        updated++
        console.log(`  ✅ Updated: ${job.url.substring(0, 50)}... (${result.source})`)
      } else {
        failed++
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, delayMs))
    } catch (error) {
      failed++
    }
  }

  return { updated, failed }
}
