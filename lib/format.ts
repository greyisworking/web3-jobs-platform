/**
 * Centralized formatting utilities for NEUN
 * Ensures consistent date, number, and text formatting across the app
 */

// ═══════════════════════════════════════════════════════════════
// DATE FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Format date consistently across the app
 * Default: "Feb 11, 2026"
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: {
    includeTime?: boolean
    longMonth?: boolean
  }
): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const baseOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: options?.longMonth ? 'long' : 'short',
    day: 'numeric',
  }

  if (options?.includeTime) {
    baseOptions.hour = '2-digit'
    baseOptions.minute = '2-digit'
  }

  return d.toLocaleDateString('en-US', baseOptions)
}

/**
 * Format relative time (e.g., "2 days ago", "just now")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  if (diffMonths < 12) return `${diffMonths}mo ago`

  return formatDate(d)
}

// ═══════════════════════════════════════════════════════════════
// NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Format number with commas (e.g., 1,000,000)
 */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return ''
  return num.toLocaleString('en-US')
}

/**
 * Format number with abbreviation (e.g., 1.5k, 2.3M)
 */
export function formatCompactNumber(num: number | null | undefined): string {
  if (num == null) return ''

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return num.toString()
}

/**
 * Format salary range
 */
export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'USD'
): string {
  if (!min && !max) return ''

  if (min && max) {
    return `${currency} ${formatNumber(min)} - ${formatNumber(max)}/yr`
  }
  if (min) {
    return `${currency} ${formatNumber(min)}+/yr`
  }
  if (max) {
    return `Up to ${currency} ${formatNumber(max)}/yr`
  }
  return ''
}

/**
 * Format crypto amount with token symbol
 */
export function formatCryptoAmount(
  amount: number | null | undefined,
  token: string
): string {
  if (amount == null) return ''

  if (amount >= 1000) {
    return `${formatCompactNumber(amount)} ${token}`
  }
  return `${amount} ${token}`
}

// ═══════════════════════════════════════════════════════════════
// TEXT FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format wallet address (0x1234...5678)
 */
export function formatWalletAddress(address: string | null | undefined): string {
  if (!address) return ''
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
