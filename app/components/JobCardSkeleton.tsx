'use client'

import Pixelbara from './Pixelbara'

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-a24-border/50 dark:bg-a24-dark-border animate-pulse ${className ?? ''}`}
    />
  )
}

export default function JobCardSkeleton() {
  return (
    <div className="p-6 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border -mt-px -ml-px">
      <ShimmerBlock className="h-5 w-2/5 mb-4" />
      <ShimmerBlock className="h-4 w-3/4 mb-2" />
      <ShimmerBlock className="h-3 w-1/4 mt-2" />
    </div>
  )
}

export function JobCardSkeletonGrid({ count = 6, showLoader = true }: { count?: number; showLoader?: boolean }) {
  return (
    <div>
      {showLoader && (
        <div className="flex flex-col items-center mb-6">
          <Pixelbara pose="loading" size={80} />
          <p className="mt-2 text-xs text-a24-muted dark:text-a24-dark-muted tracking-wide">
            loading... plz wait ser
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
