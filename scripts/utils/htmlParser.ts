/**
 * HTML Parser Utilities
 *
 * Centralized HTML entity decoding and cleanup for all crawlers.
 * All crawlers should use these functions to ensure consistent output.
 */

// ═══════════════════════════════════════════════════════════════════════════
// HTML Entity Decoding
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HTML entity mapping (common entities)
 */
const HTML_ENTITIES: Record<string, string> = {
  // Spacing
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&#xa0;': ' ',

  // Ampersand (must be decoded last normally, but we handle order properly)
  '&amp;': '&',
  '&#38;': '&',
  '&#x26;': '&',

  // Angle brackets
  '&lt;': '<',
  '&#60;': '<',
  '&#x3c;': '<',
  '&gt;': '>',
  '&#62;': '>',
  '&#x3e;': '>',

  // Quotes
  '&quot;': '"',
  '&#34;': '"',
  '&#x22;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&#x27;': "'",

  // Smart quotes
  '&lsquo;': "'",
  '&rsquo;': "'",
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&#8216;': "'",
  '&#8217;': "'",
  '&#8220;': '"',
  '&#8221;': '"',

  // Dashes
  '&ndash;': '–',
  '&mdash;': '—',
  '&#8211;': '–',
  '&#8212;': '—',

  // Other common entities
  '&hellip;': '...',
  '&#8230;': '...',
  '&bull;': '•',
  '&#8226;': '•',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&euro;': '€',
  '&pound;': '£',
  '&yen;': '¥',
  '&cent;': '¢',
  '&times;': '×',
  '&divide;': '÷',
  '&plusmn;': '±',
  '&deg;': '°',
  '&para;': '¶',
  '&sect;': '§',
}

/**
 * Decode all HTML entities in a string.
 * Handles double-encoded entities (e.g., &amp;lt; → &lt; → <)
 *
 * @param text - Text with HTML entities
 * @returns Decoded text
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return ''

  let decoded = text

  // Pass 1: Decode double-encoded entities (&amp;xxx; → &xxx;)
  // This must happen first to properly handle nested encoding
  decoded = decoded
    .replace(/&amp;lt;/gi, '&lt;')
    .replace(/&amp;gt;/gi, '&gt;')
    .replace(/&amp;quot;/gi, '&quot;')
    .replace(/&amp;apos;/gi, '&apos;')
    .replace(/&amp;nbsp;/gi, '&nbsp;')
    .replace(/&amp;amp;/gi, '&amp;')
    .replace(/&amp;#(\d+);/gi, '&#$1;')
    .replace(/&amp;#x([0-9a-f]+);/gi, '&#x$1;')

  // Pass 2: Decode named entities
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    // Case-insensitive replacement
    const regex = new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    decoded = decoded.replace(regex, char)
  }

  // Pass 3: Decode numeric entities (&#NNN;)
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => {
    const num = parseInt(code, 10)
    return num > 0 && num < 65536 ? String.fromCharCode(num) : ''
  })

  // Pass 4: Decode hex entities (&#xHHH;)
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
    const num = parseInt(hex, 16)
    return num > 0 && num < 65536 ? String.fromCharCode(num) : ''
  })

  return decoded
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML Tag Stripping
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strip HTML tags while preserving content structure.
 * Converts some tags to markdown equivalents.
 *
 * @param html - HTML string
 * @returns Plain text with markdown formatting
 */
export function stripHtmlTags(html: string): string {
  if (!html) return ''

  let text = html

  // Remove script, style, and other non-content tags entirely
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  text = text.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
  text = text.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // Remove inline styles and classes
  text = text.replace(/\s+(?:style|class|id|data-[a-z-]+)="[^"]*"/gi, '')
  text = text.replace(/\s+(?:style|class|id|data-[a-z-]+)='[^']*'/gi, '')

  // Convert line-break elements to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<p[^>]*>/gi, '')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<div[^>]*>/gi, '')

  // Convert headings to markdown
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
  text = text.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n#### $1\n')

  // Convert formatting to markdown
  text = text.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**')
  text = text.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*')
  text = text.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '$1')

  // Convert lists
  text = text.replace(/<li[^>]*>/gi, '\n- ')
  text = text.replace(/<\/li>/gi, '')
  text = text.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n')

  // Convert links to markdown
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')

  // Remove span tags but keep content
  text = text.replace(/<\/?span[^>]*>/gi, '')

  // Remove any remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Normalize whitespace
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n[ \t]+/g, '\n')
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

// ═══════════════════════════════════════════════════════════════════════════
// Combined Cleanup
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Full HTML cleanup: decode entities + strip tags.
 * This is the main function crawlers should use.
 *
 * @param html - Raw HTML string
 * @returns Clean text ready for storage
 */
export function cleanHtml(html: string): string {
  if (!html) return ''

  // Step 1: Decode HTML entities
  let cleaned = decodeHtmlEntities(html)

  // Step 2: Strip HTML tags
  cleaned = stripHtmlTags(cleaned)

  // Step 3: Final cleanup
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  return cleaned
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation (for testing)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common HTML entity patterns that should NOT remain in cleaned text
 */
const ENTITY_PATTERNS = [
  /&lt;/gi,
  /&gt;/gi,
  /&amp;(?!#)/gi,  // &amp; but not &#
  /&quot;/gi,
  /&apos;/gi,
  /&nbsp;/gi,
  /&#\d+;/g,
  /&#x[0-9a-f]+;/gi,
]

/**
 * Check if text contains HTML entities that should have been decoded.
 * Used for testing crawler output.
 *
 * @param text - Text to check
 * @returns Object with validation result and found entities
 */
export function hasUndecodedEntities(text: string): {
  valid: boolean
  entities: string[]
} {
  if (!text) return { valid: true, entities: [] }

  const found: string[] = []

  for (const pattern of ENTITY_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      found.push(...matches.slice(0, 5)) // Limit to 5 examples per pattern
    }
  }

  return {
    valid: found.length === 0,
    entities: [...new Set(found)], // Unique entities
  }
}

/**
 * Check if text contains raw HTML tags that should have been stripped.
 * Used for testing crawler output.
 *
 * @param text - Text to check
 * @returns Object with validation result and found tags
 */
export function hasHtmlTags(text: string): {
  valid: boolean
  tags: string[]
} {
  if (!text) return { valid: true, tags: [] }

  // Match opening tags like <div, <p, <span, etc.
  const tagPattern = /<([a-z][a-z0-9]*)[^>]*>/gi
  const matches = text.match(tagPattern)

  if (!matches) return { valid: true, tags: [] }

  // Filter out legitimate content that looks like tags
  const realTags = matches.filter(tag => {
    // Ignore markdown angle brackets in code blocks
    if (tag.includes('`')) return false
    // Ignore common false positives
    if (/^<[a-z]+>$/i.test(tag)) return true
    if (/^<[a-z]+\s/i.test(tag)) return true
    return false
  })

  return {
    valid: realTags.length === 0,
    tags: [...new Set(realTags.slice(0, 10))], // Unique, limited to 10
  }
}

/**
 * Validate cleaned description output.
 * Combines entity and tag checks.
 *
 * @param text - Cleaned description text
 * @returns Validation result with details
 */
export function validateCleanedOutput(text: string): {
  valid: boolean
  issues: string[]
} {
  const entityCheck = hasUndecodedEntities(text)
  const tagCheck = hasHtmlTags(text)

  const issues: string[] = []

  if (!entityCheck.valid) {
    issues.push(`Found HTML entities: ${entityCheck.entities.join(', ')}`)
  }

  if (!tagCheck.valid) {
    issues.push(`Found HTML tags: ${tagCheck.tags.join(', ')}`)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
