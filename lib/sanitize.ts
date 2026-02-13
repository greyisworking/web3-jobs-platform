/**
 * Input Sanitization Utilities
 *
 * Comprehensive sanitization for user inputs to prevent XSS, injection attacks, etc.
 */

/**
 * Sanitize text to prevent XSS attacks
 * - Escapes HTML special characters
 * - Removes dangerous protocols (javascript:, data:, vbscript:)
 * - Removes event handlers (onclick=, onerror=, etc.)
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return ''

  return text
    // Escape HTML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove dangerous protocols (case-insensitive, handles obfuscation)
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
    .replace(/file\s*:/gi, '')
    // Remove event handlers (onclick, onerror, onload, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Remove expression() (IE CSS exploit)
    .replace(/expression\s*\(/gi, '')
    // Remove url() in suspicious contexts
    .replace(/url\s*\(\s*['"]?\s*javascript/gi, '')
    // Clean control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
}

/**
 * Sanitize HTML content - more permissive, allows safe HTML tags
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''

  // Remove script/style tags entirely with content
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')

  // Remove event handlers from tags
  cleaned = cleaned.replace(/<(\w+)([^>]*)\s+on\w+\s*=\s*["'][^"']*["']([^>]*)>/gi, '<$1$2$3>')

  // Remove dangerous attributes
  cleaned = cleaned.replace(/\s+(?:href|src|action|formaction)\s*=\s*["']\s*javascript:[^"']*["']/gi, '')

  return cleaned.trim()
}

/**
 * Sanitize URL - ensure it's a valid, safe URL
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''

  const trimmed = url.trim()

  // Only allow http/https protocols
  if (!/^https?:\/\//i.test(trimmed)) {
    // If no protocol, assume https
    if (/^[\w-]+\.[\w.-]+/i.test(trimmed)) {
      return `https://${trimmed}`
    }
    return ''
  }

  // Block dangerous protocols
  if (/^(?:javascript|vbscript|data|file):/i.test(trimmed)) {
    return ''
  }

  try {
    // Validate URL structure
    const parsed = new URL(trimmed)
    // Ensure it's http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return ''

  const trimmed = email.trim().toLowerCase()

  // Basic email validation
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
  if (!emailRegex.test(trimmed)) {
    return ''
  }

  return trimmed
}

/**
 * Sanitize wallet address (Ethereum)
 */
export function sanitizeWalletAddress(address: string | null | undefined): string {
  if (!address) return ''

  const trimmed = address.trim()

  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return ''
  }

  // Return checksummed address (lowercase for now)
  return trimmed.toLowerCase()
}

/**
 * Escape LIKE pattern wildcards for safe use in SQL LIKE queries
 */
export function escapeLikePattern(pattern: string): string {
  return pattern
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/%/g, '\\%')    // Escape percent
    .replace(/_/g, '\\_')    // Escape underscore
}

/**
 * Create safe LIKE pattern for partial matching
 */
export function createSafeLikePattern(search: string): string {
  return `%${escapeLikePattern(search)}%`
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(
  arr: unknown,
  options: { maxLength?: number; maxItems?: number } = {}
): string[] {
  const { maxLength = 100, maxItems = 50 } = options

  if (!Array.isArray(arr)) return []

  return arr
    .slice(0, maxItems)
    .filter((item): item is string => typeof item === 'string')
    .map(item => sanitizeText(item.slice(0, maxLength)))
    .filter(item => item.length > 0)
}

/**
 * Sanitize integer input
 */
export function sanitizeInt(
  value: unknown,
  options: { min?: number; max?: number; default?: number } = {}
): number {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, default: defaultValue = 0 } = options

  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return defaultValue
    }
    return Math.min(max, Math.max(min, Math.floor(value)))
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      return defaultValue
    }
    return Math.min(max, Math.max(min, parsed))
  }

  return defaultValue
}
