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
      pose="dejected"
      title="no jobs found..."
      message="try different keywords or reset your filters ser"
      ctaText={onReset ? 'Reset Filters' : 'Browse All Jobs'}
      ctaOnClick={onReset}
      ctaHref={onReset ? undefined : '/jobs'}
    />
  )
}

export function NoResultsFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      pose="question"
      title="no results found"
      message="nothing matches your search... maybe try different keywords?"
      ctaText={onReset ? 'Clear Search' : 'Browse All'}
      ctaOnClick={onReset}
      ctaHref={onReset ? undefined : '/jobs'}
    />
  )
}

export function NoBookmarks() {
  return (
    <EmptyState
      pose="sparkle"
      title="no saved jobs yet"
      message="save jobs you're interested in and they'll show up here"
      ctaText="Browse Jobs"
      ctaHref="/jobs"
    />
  )
}

export function NoArticles() {
  return (
    <EmptyState
      pose="reading"
      title="no articles yet..."
      message="be the first to share your knowledge with the community"
      ctaText="Write Article"
      ctaHref="/articles/write"
    />
  )
}

export function NoBounties() {
  return (
    <EmptyState
      pose="toTheMoon"
      title="no bounties available"
      message="check back soon for new opportunities to earn rewards"
      ctaText="Create a Bounty"
      ctaHref="/bounties/create"
    />
  )
}

export function ErrorState({
  onRetry,
  title = 'something went wrong',
  message = "we couldn't load this content. please try again.",
}: {
  onRetry?: () => void
  title?: string
  message?: string
}) {
  return (
    <EmptyState
      pose="sweating"
      title={title}
      message={message}
      ctaText={onRetry ? 'Try Again' : 'Go Home'}
      ctaOnClick={onRetry}
      ctaHref={onRetry ? undefined : '/'}
    />
  )
}

export function LoadingState({ message = 'loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Pixelbara pose="coding" size={100} className="mx-auto mb-4" />
      <p className="text-small text-a24-muted dark:text-a24-dark-muted animate-pulse">
        {message}
      </p>
    </div>
  )
}

export default EmptyState
