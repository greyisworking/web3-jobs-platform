/**
 * SQL LIKE Pattern Sanitization
 *
 * Escape wildcards for safe use in SQL LIKE queries.
 */

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
