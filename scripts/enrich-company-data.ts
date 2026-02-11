/**
 * Company Data Enrichment Script
 * Fetches company info (logo, description, social links) from various sources
 *
 * Sources:
 * 1. Clearbit Logo API
 * 2. Company website meta tags
 * 3. LinkedIn (if available)
 *
 * Usage: npx tsx scripts/enrich-company-data.ts
 */

import * as cheerio from 'cheerio'
import { PRIORITY_COMPANIES, PriorityCompany } from '../lib/priority-companies'

interface EnrichedCompanyData {
  name: string
  logo: string | null
  description: string | null
  website: string | null
  twitter: string | null
  linkedin: string | null
  founded: string | null
  employees: string | null
  headquarters: string | null
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

async function getClearbitLogo(companyName: string): Promise<string | null> {
  const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com'
  const logoUrl = `https://logo.clearbit.com/${domain}`

  const response = await fetchWithTimeout(logoUrl, 5000)
  if (response?.ok) {
    return logoUrl
  }
  return null
}

async function scrapeWebsiteMeta(url: string): Promise<Partial<EnrichedCompanyData>> {
  const result: Partial<EnrichedCompanyData> = {}

  try {
    const response = await fetchWithTimeout(url)
    if (!response?.ok) return result

    const html = await response.text()
    const $ = cheerio.load(html)

    // Get description from meta tags
    result.description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      null

    // Get social links
    $('a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href && !result.twitter) {
        result.twitter = href
      }
    })

    $('a[href*="linkedin.com"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href && href.includes('/company/') && !result.linkedin) {
        result.linkedin = href
      }
    })

  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
  }

  return result
}

async function enrichCompany(company: PriorityCompany): Promise<EnrichedCompanyData> {
  console.log(`Enriching: ${company.name}...`)

  const data: EnrichedCompanyData = {
    name: company.name,
    logo: null,
    description: null,
    website: null,
    twitter: null,
    linkedin: null,
    founded: null,
    employees: null,
    headquarters: company.office_location,
  }

  // Get logo from Clearbit
  data.logo = await getClearbitLogo(company.name)

  // If company has a career URL, try to derive the main website
  if (company.careerUrl) {
    try {
      const url = new URL(company.careerUrl)
      // Try main domain
      const mainDomain = url.hostname.replace(/^(jobs\.|careers\.|apply\.)/, '')
      const websiteUrl = `https://${mainDomain}`
      data.website = websiteUrl

      // Scrape meta data
      const meta = await scrapeWebsiteMeta(websiteUrl)
      Object.assign(data, meta)
    } catch {
      // Invalid URL, skip
    }
  }

  return data
}

async function main() {
  console.log('Starting company data enrichment...\n')

  const enrichedData: EnrichedCompanyData[] = []

  // Process companies in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < PRIORITY_COMPANIES.length; i += batchSize) {
    const batch = PRIORITY_COMPANIES.slice(i, i + batchSize)

    const results = await Promise.all(
      batch.map(company => enrichCompany(company))
    )

    enrichedData.push(...results)

    // Small delay between batches
    if (i + batchSize < PRIORITY_COMPANIES.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Output results
  console.log('\n=== Enrichment Complete ===\n')

  const withLogos = enrichedData.filter(d => d.logo)
  const withDescriptions = enrichedData.filter(d => d.description)
  const withTwitter = enrichedData.filter(d => d.twitter)

  console.log(`Total companies: ${enrichedData.length}`)
  console.log(`With logos: ${withLogos.length}`)
  console.log(`With descriptions: ${withDescriptions.length}`)
  console.log(`With Twitter: ${withTwitter.length}`)

  // Save to JSON file
  const outputPath = './data/enriched-companies.json'
  const fs = await import('fs/promises')
  await fs.mkdir('./data', { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(enrichedData, null, 2))

  console.log(`\nData saved to ${outputPath}`)
}

main().catch(console.error)
