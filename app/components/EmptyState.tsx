'use client'

import Pixelbara from './Pixelbara'
import type { PoseId } from './Pixelbara'

interface EmptyStateProps {
  type: 'jobs' | 'articles' | 'bookmarks' | 'investors' | 'companies' | 'search' | 'custom'
  message?: string
  pose?: PoseId
  className?: string
}

const EMPTY_STATES: Record<string, { message: string; pose: PoseId }> = {
  jobs: {
    message: 'no jobs found... ngmi',
    pose: 'question',
  },
  articles: {
    message: 'no articles yet... be the first writer',
    pose: 'sparkle',
  },
  bookmarks: {
    message: 'no saved jobs yet... start exploring',
    pose: 'dejected',
  },
  investors: {
    message: 'more VCs coming...',
    pose: 'building',
  },
  companies: {
    message: 'more companies coming...',
    pose: 'sparkle',
  },
  search: {
    message: 'no results found... try a different search',
    pose: 'question',
  },
}

export default function EmptyState({
  type,
  message,
  pose,
  className = '',
}: EmptyStateProps) {
  const config = EMPTY_STATES[type] || EMPTY_STATES.search
  const displayMessage = message || config.message
  const displayPose = pose || config.pose

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
      <Pixelbara pose={displayPose} size={120} className="mb-6 opacity-70" />
      <p className="text-sm text-a24-muted dark:text-a24-dark-muted text-center">
        {displayMessage}
      </p>
    </div>
  )
}
