/**
 * Crawler Utility: Format Description
 *
 * Formats job descriptions before saving to database.
 * Preserves original in raw_description field.
 */

import { formatJobDescription, needsFormatting } from '../../../lib/description-formatter'

interface DescriptionFields {
  description: string | null
  raw_description?: string | null
}

/**
 * Format a job description for storage
 *
 * @param rawDescription - The original description text (HTML or plain text)
 * @returns Object with description (formatted) and raw_description (original)
 */
export function prepareDescriptionForStorage(rawDescription: string | null | undefined): DescriptionFields {
  if (!rawDescription || rawDescription.trim().length === 0) {
    return {
      description: null,
      raw_description: null,
    }
  }

  // Check if formatting is needed
  if (!needsFormatting(rawDescription)) {
    // Already clean, just use as is
    return {
      description: rawDescription,
      raw_description: null, // No need to preserve if already clean
    }
  }

  // Format the description
  const result = formatJobDescription(rawDescription)

  return {
    description: result.formatted,
    raw_description: rawDescription, // Preserve original
  }
}

/**
 * Batch format multiple job descriptions
 *
 * @param jobs - Array of jobs with description field
 * @returns Array of jobs with formatted descriptions
 */
export function batchPrepareDescriptions<T extends { description?: string | null }>(
  jobs: T[]
): (T & DescriptionFields)[] {
  return jobs.map(job => {
    const { description, raw_description } = prepareDescriptionForStorage(job.description)
    return {
      ...job,
      description,
      raw_description,
    }
  })
}

/**
 * Quick check if a description should be formatted
 * (lighter weight than full formatting)
 */
export function shouldFormatDescription(description: string | null | undefined): boolean {
  if (!description) return false
  return needsFormatting(description)
}
