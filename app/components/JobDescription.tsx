'use client'

import { useMemo } from 'react'
import { sanitizeJobDescription } from '@/lib/sanitize-description'

interface JobDescriptionProps {
  content: string | null | undefined
  className?: string
}

/**
 * Safe job description renderer
 *
 * Sanitizes raw HTML/text from crawlers and renders safely.
 * This is the SINGLE point of description rendering - all job descriptions
 * should use this component.
 */
export default function JobDescription({ content, className = '' }: JobDescriptionProps) {
  // Memoize sanitization to avoid re-processing on every render
  const sanitizedHtml = useMemo(() => {
    return sanitizeJobDescription(content)
  }, [content])

  if (!sanitizedHtml) {
    return null
  }

  return (
    <div
      className={`job-description ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
