/**
 * Fuzzy Search Utility
 * Postel's Law: Be liberal in what you accept
 *
 * Implements forgiving search that handles:
 * - Typos and misspellings
 * - Different word orders
 * - Partial matches
 * - Case insensitivity
 * - Special characters
 */

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Calculate similarity score (0-1)
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLen
}

// Normalize string for comparison
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Tokenize string into words
function tokenize(str: string): string[] {
  return normalize(str).split(' ').filter(Boolean)
}

export interface FuzzySearchOptions {
  threshold?: number // Minimum similarity score (0-1)
  keys?: string[] // Object keys to search in
  maxResults?: number // Maximum number of results
  sortByScore?: boolean // Sort results by match score
}

export interface FuzzySearchResult<T> {
  item: T
  score: number
  matches: { key: string; value: string; score: number }[]
}

/**
 * Fuzzy search through an array of items
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  options: FuzzySearchOptions = {}
): FuzzySearchResult<T>[] {
  const {
    threshold = 0.3, // 30% similarity minimum
    keys = [],
    maxResults = Infinity,
    sortByScore = true,
  } = options

  if (!query.trim()) {
    return items.map((item) => ({ item, score: 1, matches: [] }))
  }

  const queryTokens = tokenize(query)
  const results: FuzzySearchResult<T>[] = []

  for (const item of items) {
    const matches: FuzzySearchResult<T>['matches'] = []
    let totalScore = 0
    let matchCount = 0

    // Get searchable values
    const searchValues: { key: string; value: string }[] = []

    if (keys.length > 0 && typeof item === 'object' && item !== null) {
      for (const key of keys) {
        const value = (item as Record<string, unknown>)[key]
        if (typeof value === 'string') {
          searchValues.push({ key, value })
        }
      }
    } else if (typeof item === 'string') {
      searchValues.push({ key: 'value', value: item })
    }

    // Score each searchable value
    for (const { key, value } of searchValues) {
      const normalizedValue = normalize(value)
      const valueTokens = tokenize(value)

      // Check for exact substring match (highest priority)
      if (normalizedValue.includes(normalize(query))) {
        const score = 1
        matches.push({ key, value, score })
        totalScore += score
        matchCount++
        continue
      }

      // Token-based matching
      let tokenScore = 0
      let tokenMatches = 0

      for (const queryToken of queryTokens) {
        let bestMatch = 0

        for (const valueToken of valueTokens) {
          // Exact token match
          if (valueToken === queryToken) {
            bestMatch = 1
            break
          }

          // Starts with query token
          if (valueToken.startsWith(queryToken)) {
            bestMatch = Math.max(bestMatch, 0.9)
            continue
          }

          // Contains query token
          if (valueToken.includes(queryToken)) {
            bestMatch = Math.max(bestMatch, 0.8)
            continue
          }

          // Fuzzy match
          const sim = similarity(queryToken, valueToken)
          if (sim > threshold) {
            bestMatch = Math.max(bestMatch, sim * 0.7)
          }
        }

        if (bestMatch > 0) {
          tokenScore += bestMatch
          tokenMatches++
        }
      }

      if (tokenMatches > 0) {
        const score = (tokenScore / queryTokens.length) * (tokenMatches / queryTokens.length)
        if (score >= threshold) {
          matches.push({ key, value, score })
          totalScore += score
          matchCount++
        }
      }
    }

    // Add item if it has any matches
    if (matchCount > 0) {
      results.push({
        item,
        score: totalScore / matchCount,
        matches,
      })
    }
  }

  // Sort by score if requested
  if (sortByScore) {
    results.sort((a, b) => b.score - a.score)
  }

  // Limit results
  return results.slice(0, maxResults)
}

/**
 * Simple fuzzy match check (returns boolean)
 */
export function fuzzyMatch(text: string, query: string, threshold = 0.3): boolean {
  if (!query.trim()) return true
  if (!text.trim()) return false

  const normalizedText = normalize(text)
  const normalizedQuery = normalize(query)

  // Exact substring match
  if (normalizedText.includes(normalizedQuery)) return true

  // Token-based fuzzy match
  const queryTokens = tokenize(query)
  const textTokens = tokenize(text)

  let matchedTokens = 0
  for (const queryToken of queryTokens) {
    for (const textToken of textTokens) {
      if (
        textToken === queryToken ||
        textToken.startsWith(queryToken) ||
        textToken.includes(queryToken) ||
        similarity(queryToken, textToken) >= threshold
      ) {
        matchedTokens++
        break
      }
    }
  }

  return matchedTokens >= queryTokens.length * 0.5 // At least 50% of query tokens match
}

/**
 * Highlight matched portions in text
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text

  const normalizedQuery = normalize(query)
  const queryTokens = tokenize(query)

  let result = text
  for (const token of queryTokens) {
    const regex = new RegExp(`(${token})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  }

  return result
}

export default fuzzySearch
