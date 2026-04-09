/**
 * Shared RSS parsing helpers — used by cryptocurrencyjobs, cryptojobs, remote3.
 */

/**
 * Parse "Job Title at Company Name" pattern common in RSS feed titles.
 * Returns original title as fallback if pattern doesn't match.
 */
export function parseTitleAtCompany(rawTitle: string): { title: string; company: string } {
  const match = rawTitle.match(/^(.+?)\s+at\s+(.+)$/i)
  if (match) {
    return { title: match[1].trim(), company: match[2].trim() }
  }
  return { title: rawTitle, company: '' }
}
