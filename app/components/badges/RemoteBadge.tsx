'use client'

import { cn } from '@/lib/utils'

interface RemoteBadgeProps {
  className?: string
}

export default function RemoteBadge({ className }: RemoteBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold',
        'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
        className
      )}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M16.5 6.621A6.998 6.998 0 003.5 6.62l-.678.71A7.5 7.5 0 0010 17.5a7.5 7.5 0 007.178-10.169l-.678-.71zM10 15a5.5 5.5 0 01-4.95-3.1c.33-.05.67-.08 1-.1a8.45 8.45 0 013.95.95A8.45 8.45 0 0114 11.5a5.5 5.5 0 01-4 3.5zM10 4a5.5 5.5 0 014.383 2.19A6.94 6.94 0 0010 7.5a6.94 6.94 0 00-4.383-1.31A5.5 5.5 0 0110 4z" />
      </svg>
      Remote
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-[11px] text-white bg-sub-charcoal rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Remote work position available
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-sub-charcoal" />
      </span>
    </span>
  )
}
