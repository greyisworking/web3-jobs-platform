import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { PRIORITY_COMPANIES } from '@/lib/priority-companies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// In-memory cache for company data
const companyCache = new Map<string, { data: CompanyInfo; expiry: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

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

  // Try to get logo from Clearbit
  const domain = company.name.toLowerCase().replace(/\s+/g, '') + '.com'
  const logoUrl = `https://logo.clearbit.com/${domain}`
  const logoResponse = await fetchWithTimeout(logoUrl, 3000)
  if (logoResponse?.ok) {
    info.logo = logoUrl
  }

  // If career URL exists, derive website
  if (company.careerUrl) {
    try {
      const url = new URL(company.careerUrl)
      const mainDomain = url.hostname.replace(/^(jobs\.|careers\.|apply\.)/, '')
      info.website = `https://${mainDomain}`

      // Try to scrape meta description
      const siteResponse = await fetchWithTimeout(info.website, 5000)
      if (siteResponse?.ok) {
        const html = await siteResponse.text()
        const $ = cheerio.load(html)

        info.description =
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          null

        // Find social links
        $('a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => {
          const href = $(el).attr('href')
          if (href && !info.twitter) {
            info.twitter = href
          }
        })

        $('a[href*="linkedin.com/company"]').each((_, el) => {
          const href = $(el).attr('href')
          if (href && !info.linkedin) {
            info.linkedin = href
          }
        })
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
