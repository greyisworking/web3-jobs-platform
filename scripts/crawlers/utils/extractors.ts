/**
 * Shared HTML extraction helpers for __NEXT_DATA__ and JSON-LD.
 */
import type { CheerioAPI } from 'cheerio'

/**
 * Extract and parse __NEXT_DATA__ JSON from a Next.js SSR page.
 * Returns the full parsed object, or null if not found / parse error.
 */
export function extractNextData($: CheerioAPI): any | null {
  const script = $('script#__NEXT_DATA__').html()
  if (!script) return null
  try {
    return JSON.parse(script)
  } catch {
    return null
  }
}

/**
 * Shortcut: extract pageProps from __NEXT_DATA__.
 */
export function extractPageProps($: CheerioAPI): any | null {
  return extractNextData($)?.props?.pageProps ?? null
}

/**
 * Extract the first JSON-LD block with @type "JobPosting" and return its description.
 * Returns null if no matching JSON-LD block is found.
 */
export function extractJsonLdDescription($: CheerioAPI): string | null {
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    const text = $(el).text().trim()
    if (!text) continue
    try {
      const data = JSON.parse(text)
      if (data['@type'] === 'JobPosting' && data.description) {
        return data.description
      }
    } catch {}
  }
  return null
}
