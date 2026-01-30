'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import Pixelbara from '../Pixelbara'
import type { PoseId } from '../Pixelbara'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  message: string
  pose?: PoseId
  size?: number
  ctaText?: string
  ctaHref?: string
  ctaOnClick?: () => void
  secondaryCtaText?: string
  secondaryCtaHref?: string
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  message,
  pose = 'question',
  size = 120,
  ctaText,
  ctaHref,
  ctaOnClick,
  secondaryCtaText,
  secondaryCtaHref,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Pixelbara or Custom Icon */}
      <div className="mb-6">
        {icon || <Pixelbara pose={pose} size={size} className="mx-auto" />}
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-heading-3 text-a24-text dark:text-a24-dark-text mb-2">
          {title}
        </h3>
      )}

      {/* Message */}
      <p className="text-body text-a24-muted dark:text-a24-dark-muted max-w-md mb-6">
        {message}
      </p>

      {/* CTAs */}
      {(ctaText || secondaryCtaText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {ctaText && (
            <>
              {ctaHref ? (
                <Link href={ctaHref}>
                  <Button variant="primary">{ctaText}</Button>
                </Link>
              ) : (
                <Button variant="primary" onClick={ctaOnClick}>
                  {ctaText}
                </Button>
              )}
            </>
          )}

          {secondaryCtaText && secondaryCtaHref && (
            <Link href={secondaryCtaHref}>
              <Button variant="ghost">{secondaryCtaText}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════
// Preset Empty States
// ══════════════════════════════════════════════

export function NoJobsFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      pose="question"
      title="No jobs found"
      message="We couldn't find any jobs matching your filters. Try adjusting your search criteria or check back later."
      ctaText={onReset ? 'Reset Filters' : undefined}
      ctaOnClick={onReset}
      secondaryCtaText="View All Jobs"
      secondaryCtaHref="/careers"
    />
  )
}

export function NoResultsFound() {
  return (
    <EmptyState
      pose="rugged"
      title="No results"
      message="Nothing matches your search. Try different keywords or browse our categories."
      ctaText="Browse All"
      ctaHref="/careers"
    />
  )
}

export function NoBookmarks() {
  return (
    <EmptyState
      pose="sparkle"
      title="No bookmarks yet"
      message="Start saving jobs you're interested in. They'll appear here for easy access."
      ctaText="Explore Jobs"
      ctaHref="/careers"
    />
  )
}

export function NoArticles() {
  return (
    <EmptyState
      pose="question"
      title="No articles yet"
      message="Be the first to share your knowledge with the community."
      ctaText="Write an Article"
      ctaHref="/articles/write"
    />
  )
}

export function NoBounties() {
  return (
    <EmptyState
      pose="toTheMoon"
      title="No bounties available"
      message="Check back soon for new opportunities to earn rewards."
      ctaText="Create a Bounty"
      ctaHref="/bounties/create"
    />
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      pose="rugged"
      title="Something went wrong"
      message="We encountered an error loading this content. Please try again."
      ctaText={onRetry ? 'Try Again' : 'Go Home'}
      ctaOnClick={onRetry}
      ctaHref={onRetry ? undefined : '/'}
    />
  )
}

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Pixelbara pose="loading" size={100} className="mx-auto mb-4" />
      <p className="text-small text-a24-muted dark:text-a24-dark-muted animate-pulse">
        Loading...
      </p>
    </div>
  )
}

export default EmptyState
