import axios from 'axios'
import * as cheerio from 'cheerio'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

export async function fetchHTML(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 10000,
    })
    return cheerio.load(response.data)
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    return null
  }
}

export async function fetchJSON<T = any>(url: string, headers?: Record<string, string>): Promise<T | null> {
  try {
    const response = await axios.get<T>(url, {
      headers: { ...DEFAULT_HEADERS, ...headers },
      timeout: 15000,
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching JSON from ${url}:`, error)
    return null
  }
}

export async function fetchXML(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 10000,
    })
    return cheerio.load(response.data, { xmlMode: true })
  } catch (error) {
    console.error(`Error fetching XML from ${url}:`, error)
    return null
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

/**
 * Extract clean HTML content preserving structure
 */
export function extractHTML($element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  if (!$element.length) return ''

  // Remove script and style tags
  $element.find('script, style, noscript').remove()

  // Get HTML and clean it
  let html = $element.html() || ''

  // Convert to cleaner format
  html = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .trim()

  return html
}

/**
 * Parse salary string to extract min/max/currency
 */
export function parseSalary(salaryStr: string | null | undefined): {
  min: number | null
  max: number | null
  currency: string | null
} {
  if (!salaryStr) return { min: null, max: null, currency: null }

  const result = { min: null as number | null, max: null as number | null, currency: null as string | null }

  // Detect currency
  if (salaryStr.includes('$') || salaryStr.toLowerCase().includes('usd')) {
    result.currency = 'USD'
  } else if (salaryStr.includes('₩') || salaryStr.toLowerCase().includes('krw') || salaryStr.includes('원')) {
    result.currency = 'KRW'
  } else if (salaryStr.includes('€') || salaryStr.toLowerCase().includes('eur')) {
    result.currency = 'EUR'
  } else if (salaryStr.includes('£') || salaryStr.toLowerCase().includes('gbp')) {
    result.currency = 'GBP'
  }

  // Extract numbers (handle K for thousands)
  const numbers = salaryStr.match(/[\d,]+(?:\.\d+)?[kK]?/g)
  if (numbers && numbers.length > 0) {
    const parseNum = (s: string) => {
      const num = parseFloat(s.replace(/,/g, ''))
      if (s.toLowerCase().includes('k')) {
        return num * 1000
      }
      return num
    }

    result.min = parseNum(numbers[0])
    if (numbers.length > 1) {
      result.max = parseNum(numbers[1])
    }
  }

  return result
}

/**
 * Detect experience level from text
 */
export function detectExperienceLevel(text: string): string | null {
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

/**
 * Detect remote type from text
 */
export function detectRemoteType(text: string): string | null {
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
