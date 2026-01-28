'use client'

import { cn } from '@/lib/utils'

interface ActiveBadgeProps {
  className?: string
}

export default function ActiveBadge({ className }: ActiveBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold',
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      Active
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-[11px] text-white bg-sub-charcoal rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Posted within the last 30 days
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-sub-charcoal" />
      </span>
    </span>
  )
}
