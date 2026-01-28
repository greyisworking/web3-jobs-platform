'use client'

import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  className?: string
}

export default function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold',
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        className
      )}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
      VC Verified
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-[11px] text-white bg-sub-charcoal rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Backed by top-tier VC investors
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-sub-charcoal" />
      </span>
    </span>
  )
}
