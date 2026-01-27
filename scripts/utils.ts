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
