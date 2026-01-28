'use client'

import { cn } from '@/lib/utils'

interface Web3PerksBadgeProps {
  className?: string
}

export default function Web3PerksBadge({ className }: Web3PerksBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold',
        'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
        className
      )}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 1l3.464 6H6.536L10 1zM3 9h14l-7 10L3 9z" clipRule="evenodd" />
      </svg>
      Web3 Perks
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-[11px] text-white bg-sub-charcoal rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Includes token/equity compensation
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-sub-charcoal" />
      </span>
    </span>
  )
}
