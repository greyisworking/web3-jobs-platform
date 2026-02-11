import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { PRIORITY_COMPANIES } from '@/lib/priority-companies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// In-memory cache for company data
const companyCache = new Map<string, { data: CompanyInfo; expiry: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

// ATS platforms to skip when deriving company website
const ATS_PLATFORMS = [
  'greenhouse.io',
  'lever.co',
  'ashbyhq.com',
  'workable.com',
  'breezy.hr',
  'recruitee.com',
  'smartrecruiters.com',
  'jobvite.com',
  'icims.com',
  'workday.com',
  'bamboohr.com',
  'jazz.co',
  'fountain.com',
]

interface CompanyInfo {
  name: string
  logo: string | null
  description: string | null
  website: string | null
  twitter: string | null
  linkedin: string | null
  backers: string[]
  sector: string
  tier: string
  hasToken: boolean
  office_location: string
}

async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NEUN/1.0; +https://neun.wtf)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

function isATSPlatform(hostname: string): boolean {
  return ATS_PLATFORMS.some(ats => hostname.includes(ats))
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(labs?|foundation|protocol|network|finance|dao)$/i, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

async function findCompanyWebsite(companyName: string): Promise<{ domain: string; logo: string } | null> {
  const baseName = normalizeCompanyName(companyName)

  // Try different TLDs
  const tlds = ['.com', '.io', '.xyz', '.co', '.org', '.finance', '.network']

  for (const tld of tlds) {
    const domain = baseName + tld
    const logoUrl = `https://logo.clearbit.com/${domain}`

    const response = await fetchWithTimeout(logoUrl, 2000)
    if (response?.ok) {
      return { domain, logo: logoUrl }
    }
  }

  // Try with common suffixes
  const suffixes = ['labs', 'protocol', 'foundation', 'network']
  for (const suffix of suffixes) {
    for (const tld of ['.com', '.io', '.xyz']) {
      const domain = baseName + suffix + tld
      const logoUrl = `https://logo.clearbit.com/${domain}`

      const response = await fetchWithTimeout(logoUrl, 2000)
      if (response?.ok) {
        return { domain, logo: logoUrl }
      }
    }
  }

  return null
}

async function scrapeWebsiteMeta(websiteUrl: string): Promise<{
  description: string | null
  twitter: string | null
  linkedin: string | null
}> {
  const result = { description: null as string | null, twitter: null as string | null, linkedin: null as string | null }

  try {
    const response = await fetchWithTimeout(websiteUrl, 5000)
    if (!response?.ok) return result

    const html = await response.text()
    const $ = cheerio.load(html)

    result.description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      null

    // Find social links
    $('a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href && !result.twitter && !href.includes('/intent/') && !href.includes('/share')) {
        result.twitter = href
      }
    })

    $('a[href*="linkedin.com/company"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href && !result.linkedin) {
        result.linkedin = href
      }
    })
  } catch {
    // Scraping failed
  }

  return result
}

async function enrichCompanyData(companyName: string): Promise<CompanyInfo | null> {
  // Find company in priority list
  const company = PRIORITY_COMPANIES.find(
    c =>
      c.name.toLowerCase() === companyName.toLowerCase() ||
      c.aliases.some(a => a.toLowerCase() === companyName.toLowerCase())
  )

  if (!company) {
    return null
  }

  const info: CompanyInfo = {
    name: company.name,
    logo: null,
    description: null,
    website: null,
    twitter: null,
    linkedin: null,
    backers: company.backers,
    sector: company.sector,
    tier: company.tier,
    hasToken: company.hasToken,
    office_location: company.office_location,
  }

  // Try to find company website and logo via Clearbit
  const discovered = await findCompanyWebsite(company.name)

  if (discovered) {
    info.logo = discovered.logo
    info.website = `https://${discovered.domain}`

    // Scrape meta data from actual company website
    const meta = await scrapeWebsiteMeta(info.website)
    info.description = meta.description
    info.twitter = meta.twitter
    info.linkedin = meta.linkedin
  }

  // If no website found via Clearbit, try deriving from careerUrl (but skip ATS platforms)
  if (!info.website && company.careerUrl) {
    try {
      const url = new URL(company.careerUrl)

      // Skip if it's an ATS platform
      if (!isATSPlatform(url.hostname)) {
        const mainDomain = url.hostname.replace(/^(jobs\.|careers\.|apply\.|boards\.)/, '')
        info.website = `https://${mainDomain}`

        // Try to get logo if we don't have one
        if (!info.logo) {
          const logoUrl = `https://logo.clearbit.com/${mainDomain}`
          const logoResponse = await fetchWithTimeout(logoUrl, 2000)
          if (logoResponse?.ok) {
            info.logo = logoUrl
          }
        }

        // Scrape meta if we don't have description
        if (!info.description) {
          const meta = await scrapeWebsiteMeta(info.website)
          info.description = meta.description
          info.twitter = info.twitter || meta.twitter
          info.linkedin = info.linkedin || meta.linkedin
        }
      }
    } catch {
      // Invalid URL
    }
  }

  return info
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const companyName = decodeURIComponent(name)

  // Check cache first
  const cached = companyCache.get(companyName.toLowerCase())
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT',
      },
    })
  }

  // Enrich company data
  const companyInfo = await enrichCompanyData(companyName)

  if (!companyInfo) {
    return NextResponse.json(
      { error: 'Company not found' },
      { status: 404 }
    )
  }

  // Cache the result
  companyCache.set(companyName.toLowerCase(), {
    data: companyInfo,
    expiry: Date.now() + CACHE_TTL,
  })

  return NextResponse.json(companyInfo, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'MISS',
    },
  })
}
