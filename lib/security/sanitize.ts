// ════════════════════════════════════════════════════════════════════════════
// Input Validation & Sanitization
// XSS Prevention, Length Limits, Special Character Filtering
// ════════════════════════════════════════════════════════════════════════════

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

// Regex patterns for dangerous content
const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
const EVENT_HANDLER_PATTERN = /\s*on\w+\s*=/gi
const JAVASCRIPT_URL_PATTERN = /javascript:/gi
const DATA_URL_PATTERN = /data:/gi
const STYLE_EXPRESSION_PATTERN = /expression\s*\(/gi
const EVAL_PATTERN = /eval\s*\(/gi

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Remove all HTML tags
 */
function stripHtml(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize text by removing dangerous patterns
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return ''

  let sanitized = text
    // Remove script tags
    .replace(SCRIPT_PATTERN, '')
    // Remove event handlers
    .replace(EVENT_HANDLER_PATTERN, ' ')
    // Remove javascript: URLs
    .replace(JAVASCRIPT_URL_PATTERN, '')
    // Remove data: URLs (can contain scripts)
    .replace(DATA_URL_PATTERN, '')
    // Remove CSS expressions
    .replace(STYLE_EXPRESSION_PATTERN, '')
    // Remove eval calls
    .replace(EVAL_PATTERN, '')

  // Escape remaining HTML entities
  return escapeHtml(sanitized)
}

/**
 * Sanitize HTML while allowing safe tags
 */
export function sanitizeHtml(html: string, allowedTags: string[] = []): string {
  if (!html || typeof html !== 'string') return ''

  // Default allowed tags for rich text content
  const safeTagsDefault = [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
  ]

  const safeTags = allowedTags.length > 0 ? allowedTags : safeTagsDefault
  const safeTagsPattern = safeTags.join('|')

  let sanitized = html
    // Remove script tags completely
    .replace(SCRIPT_PATTERN, '')
    // Remove event handlers
    .replace(EVENT_HANDLER_PATTERN, ' ')
    // Remove javascript: URLs
    .replace(JAVASCRIPT_URL_PATTERN, '')
    // Remove data: URLs
    .replace(DATA_URL_PATTERN, '')
    // Remove CSS expressions
    .replace(STYLE_EXPRESSION_PATTERN, '')

  // Remove style attributes (can contain expressions)
  sanitized = sanitized.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')

  // Remove tags not in safe list (but keep content)
  const tagPattern = new RegExp(
    `<(?!\/?(${safeTagsPattern})(?=>|\\s))[^>]+>`,
    'gi'
  )
  sanitized = sanitized.replace(tagPattern, '')

  return sanitized
}

// ════════════════════════════════════════════════════════════════════════════
// Text Length Limits
// ════════════════════════════════════════════════════════════════════════════

export const TEXT_LIMITS = {
  // General
  name: 100,
  title: 200,
  description: 5000,
  shortDescription: 500,

  // Job posting
  jobTitle: 150,
  jobDescription: 10000,
  companyName: 100,

  // User content
  message: 1000,
  comment: 2000,
  reason: 1000,
  bio: 500,

  // Article
  articleTitle: 200,
  articleContent: 50000,
  articleExcerpt: 500,

  // URLs
  url: 2048,
  imageUrl: 500,

  // Search
  searchQuery: 200,
} as const

type TextLimitKey = keyof typeof TEXT_LIMITS

/**
 * Validate and truncate text to limit
 */
export function limitText(text: string, limitKey: TextLimitKey): string {
  if (!text || typeof text !== 'string') return ''
  const limit = TEXT_LIMITS[limitKey]
  return text.slice(0, limit)
}

/**
 * Check if text exceeds limit
 */
export function exceedsLimit(text: string, limitKey: TextLimitKey): boolean {
  if (!text || typeof text !== 'string') return false
  return text.length > TEXT_LIMITS[limitKey]
}

// ════════════════════════════════════════════════════════════════════════════
// Special Character Filtering
// ════════════════════════════════════════════════════════════════════════════

// Control characters (except newlines and tabs)
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

// Zero-width characters (often used for obfuscation)
const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF\u2060]/g

/**
 * Remove control characters
 */
function removeControlChars(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text.replace(CONTROL_CHARS_PATTERN, '')
}

/**
 * Remove zero-width characters
 */
function removeZeroWidth(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text.replace(ZERO_WIDTH_PATTERN, '')
}

/**
 * Full text sanitization pipeline
 */
export function sanitizeInput(
  text: string,
  options: {
    limitKey?: TextLimitKey
    allowHtml?: boolean
    allowedTags?: string[]
  } = {}
): string {
  if (!text || typeof text !== 'string') return ''

  let result = text

  // Remove control characters
  result = removeControlChars(result)

  // Remove zero-width characters
  result = removeZeroWidth(result)

  // Sanitize HTML or strip it
  if (options.allowHtml) {
    result = sanitizeHtml(result, options.allowedTags)
  } else {
    result = sanitizeText(result)
  }

  // Apply length limit
  if (options.limitKey) {
    result = limitText(result, options.limitKey)
  }

  // Trim whitespace
  result = result.trim()

  return result
}

// ════════════════════════════════════════════════════════════════════════════
// URL Validation
// ════════════════════════════════════════════════════════════════════════════

const SAFE_PROTOCOLS = ['http:', 'https:']

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null

  try {
    const parsed = new URL(url.trim())

    // Only allow safe protocols
    if (!SAFE_PROTOCOLS.includes(parsed.protocol)) {
      return null
    }

    // Prevent localhost/internal URLs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname.toLowerCase()
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local')
      ) {
        return null
      }
    }

    return parsed.href
  } catch {
    return null
  }
}

