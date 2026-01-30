'use client'

import { cn } from '@/lib/utils'

interface UnverifiedBadgeProps {
  className?: string
  compact?: boolean
}

export default function UnverifiedBadge({ className, compact }: UnverifiedBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider',
        'bg-gray-500/20 border border-gray-500/50 text-gray-400 px-1.5 py-0.5',
        className
      )}
    >
      <span className="text-[11px]">⚠️</span>
      {!compact && 'UNVERIFIED'}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-[11px] text-white bg-a24-text dark:bg-a24-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Not verified yet - dyor ser
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-a24-text dark:border-t-a24-dark-text" />
      </span>
    </span>
  )
}
