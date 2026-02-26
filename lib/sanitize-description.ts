/**
 * Sanitize job description for safe rendering
 *
 * This is the SINGLE source of truth for description sanitization.
 * Crawlers save raw HTML/text, frontend sanitizes before rendering.
 */

import sanitizeHtml from 'sanitize-html'

// Allowed HTML tags for job descriptions
const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'strong', 'b', 'em', 'i', 'u',
  'a',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'blockquote', 'pre', 'code',
  'hr',
]

// Allowed attributes per tag
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title'],
  'td': ['colspan', 'rowspan'],
  'th': ['colspan', 'rowspan'],
}

// Patterns to detect plain text (not HTML)
const HTML_TAG_PATTERN = /<[a-z][\s\S]*>/i

// Boilerplate patterns to remove
const BOILERPLATE_PATTERNS = [
  // Apply now CTAs
  /apply\s*(now|today|here)\s*[!→>]*/gi,
  /click\s*(here\s*)?to\s*apply/gi,
  // Social sharing
  /share\s*(this\s*)?(job\s*)?(on\s*)?(twitter|linkedin|facebook)/gi,
  // Cookie notices
  /we\s*use\s*cookies/gi,
  /cookie\s*(policy|notice|consent)/gi,
  // Referral bonuses (often spam)
  /refer\s*a\s*friend/gi,
  /referral\s*bonus/gi,
  // Newsletter prompts
  /subscribe\s*to\s*(our\s*)?newsletter/gi,
  /sign\s*up\s*for\s*(our\s*)?(email|updates)/gi,
]

// Empty tag patterns
const EMPTY_TAG_PATTERNS = [
  /<p>\s*<\/p>/gi,
  /<div>\s*<\/div>/gi,
  /<span>\s*<\/span>/gi,
  /<h[1-6]>\s*<\/h[1-6]>/gi,
  /<li>\s*<\/li>/gi,
]

/**
 * Check if content is plain text (not HTML)
 */
function isPlainText(content: string): boolean {
  return !HTML_TAG_PATTERN.test(content)
}

/**
 * Convert plain text to HTML with proper line breaks
 */
function plainTextToHtml(text: string): string {
  // Escape HTML entities
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Convert line breaks to HTML
  // Double newlines = paragraph breaks
  // Single newlines = line breaks
  const paragraphs = escaped.split(/\n\s*\n/)

  return paragraphs
    .map(p => {
      const withBr = p.replace(/\n/g, '<br>')
      return `<p>${withBr}</p>`
    })
    .join('\n')
}

/**
 * Remove boilerplate content
 */
function removeBoilerplate(html: string): string {
  let result = html

  for (const pattern of BOILERPLATE_PATTERNS) {
    result = result.replace(pattern, '')
  }

  return result
}

/**
 * Remove empty tags
 */
function removeEmptyTags(html: string): string {
  let result = html
  let prevResult = ''

  // Keep removing until no more changes (handles nested empty tags)
  while (result !== prevResult) {
    prevResult = result
    for (const pattern of EMPTY_TAG_PATTERNS) {
      result = result.replace(pattern, '')
    }
  }

  return result
}

/**
 * Normalize whitespace and blank lines
 */
function normalizeWhitespace(html: string): string {
  return html
    // Remove excessive whitespace between tags
    .replace(/>\s+</g, '>\n<')
    // Normalize multiple blank lines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()
}

/**
 * Main sanitization function
 *
 * @param raw - Raw description from database (HTML or plain text)
 * @returns Sanitized HTML safe for rendering with dangerouslySetInnerHTML
 */
export function sanitizeJobDescription(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') {
    return ''
  }

  // Trim and check for empty
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }

  // Convert plain text to HTML if needed
  let html = isPlainText(trimmed) ? plainTextToHtml(trimmed) : trimmed

  // Remove boilerplate
  html = removeBoilerplate(html)

  // Sanitize HTML using sanitize-html
  let sanitized = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    // Transform all links to open in new tab
    transformTags: {
      'a': (_tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            href: attribs.href || '#',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        }
      },
    },
    // Remove style and class attributes
    allowedStyles: {},
    // Don't allow any classes
    allowedClasses: {},
    // Discard tags not in allowedTags (don't keep their content if they're dangerous)
    disallowedTagsMode: 'discard',
    // Parse as HTML5
    parser: {
      lowerCaseTags: true,
    },
  })

  // Remove empty tags
  sanitized = removeEmptyTags(sanitized)

  // Normalize whitespace
  sanitized = normalizeWhitespace(sanitized)

  return sanitized
}

/**
 * Quick check if description needs sanitization
 * (for optimization - skip if already clean)
 */
export function needsSanitization(content: string | null | undefined): boolean {
  if (!content) return false

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /<style/i,
    /<form/i,
    /<input/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers
    /style\s*=/i, // inline styles
    /class\s*=/i, // class attributes
  ]

  return dangerousPatterns.some(pattern => pattern.test(content))
}

/**
 * Truncate description for preview
 */
export function truncateDescription(html: string, maxLength: number = 300): string {
  // Strip HTML for length calculation
  const text = sanitizeHtml(html, { allowedTags: [] })

  if (text.length <= maxLength) {
    return html
  }

  // Find a good breaking point
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  const breakPoint = lastSpace > maxLength * 0.8 ? lastSpace : maxLength

  return text.slice(0, breakPoint) + '...'
}

/**
 * Extract plain text from HTML (for search indexing, etc.)
 */
export function extractPlainText(html: string | null | undefined): string {
  if (!html) return ''
  return sanitizeHtml(html, { allowedTags: [] }).trim()
}
