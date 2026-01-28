'use client'

import { cn } from '@/lib/utils'

interface ActiveBadgeProps {
  className?: string
}

export default function ActiveBadge({ className }: ActiveBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium',
        'border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text',
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-a24-text dark:bg-a24-dark-text opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-a24-text dark:bg-a24-dark-text" />
      </span>
      Active
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-[11px] text-white bg-a24-text dark:bg-a24-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Posted within the last 30 days
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-a24-text dark:border-t-a24-dark-text" />
      </span>
    </span>
  )
}
