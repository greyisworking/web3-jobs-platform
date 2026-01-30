'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

const roundedStyles = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export function Skeleton({
  className,
  width,
  height,
  rounded = 'none',
}: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', roundedStyles[rounded], className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  )
}

// ══════════════════════════════════════════════
// Preset Skeleton Components
// ══════════════════════════════════════════════

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className={cn(
            i === lines - 1 ? 'w-3/4' : 'w-full' // Last line is shorter
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      rounded="full"
      className={className}
    />
  )
}

export function SkeletonButton({
  width = 100,
  height = 40,
  className,
}: {
  width?: number
  height?: number
  className?: string
}) {
  return <Skeleton width={width} height={height} className={className} />
}

// ══════════════════════════════════════════════
// Job Card Skeleton
// ══════════════════════════════════════════════

export function JobCardSkeleton() {
  return (
    <div className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <Skeleton height={12} className="w-24 mb-2" />
          <Skeleton height={20} className="w-full mb-1" />
          <Skeleton height={20} className="w-3/4" />
        </div>
        <Skeleton width={40} height={20} />
      </div>

      <div className="flex gap-3 mb-4">
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={14} />
      </div>

      <div className="pt-3 border-t border-a24-border dark:border-a24-dark-border flex items-center justify-between">
        <Skeleton width={60} height={12} />
        <Skeleton width={16} height={16} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// Company Card Skeleton
// ══════════════════════════════════════════════

export function CompanyCardSkeleton() {
  return (
    <div className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border p-4 md:p-5 text-center">
      <SkeletonAvatar size={64} className="mx-auto mb-3" />
      <Skeleton height={18} className="w-3/4 mx-auto mb-2" />
      <Skeleton height={14} className="w-1/2 mx-auto mb-2" />
      <Skeleton height={14} className="w-2/3 mx-auto" />
    </div>
  )
}

// ══════════════════════════════════════════════
// Article Card Skeleton
// ══════════════════════════════════════════════

export function ArticleCardSkeleton() {
  return (
    <div className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border overflow-hidden">
      {/* Cover image skeleton */}
      <Skeleton className="aspect-video w-full" />

      <div className="p-4 md:p-5">
        {/* Tags */}
        <div className="flex gap-1.5 mb-3">
          <Skeleton width={50} height={18} />
          <Skeleton width={40} height={18} />
        </div>

        {/* Title */}
        <Skeleton height={20} className="w-full mb-2" />
        <Skeleton height={20} className="w-3/4 mb-3" />

        {/* Excerpt */}
        <Skeleton height={14} className="w-full mb-1" />
        <Skeleton height={14} className="w-5/6 mb-4" />

        {/* Meta */}
        <div className="flex justify-between">
          <Skeleton width={60} height={14} />
          <Skeleton width={80} height={14} />
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// List Skeleton
// ══════════════════════════════════════════════

export function JobListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ArticleListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════
// Page Skeleton
// ══════════════════════════════════════════════

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton height={40} className="w-1/3 mb-4" />
      <Skeleton height={20} className="w-2/3" />
    </div>
  )
}

export default Skeleton
