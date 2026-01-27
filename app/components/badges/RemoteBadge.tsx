'use client'

import { cn } from '@/lib/utils'

interface RemoteBadgeProps {
  className?: string
}

/** 리모트 뱃지 — 원격 근무 가능한 포지션 */
export default function RemoteBadge({ className }: RemoteBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full',
        'bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
        'border-hairline border-blue-400/30',
        'shadow-[0_0_8px_rgba(59,130,246,0.15)]',
        'hover:shadow-[0_0_14px_rgba(59,130,246,0.3)]',
        'transition-shadow duration-300',
        className
      )}
    >
      {/* 지구본 아이콘 */}
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M16.5 6.621A6.998 6.998 0 003.5 6.62l-.678.71A7.5 7.5 0 0010 17.5a7.5 7.5 0 007.178-10.169l-.678-.71zM10 15a5.5 5.5 0 01-4.95-3.1c.33-.05.67-.08 1-.1a8.45 8.45 0 013.95.95A8.45 8.45 0 0114 11.5a5.5 5.5 0 01-4 3.5zM10 4a5.5 5.5 0 014.383 2.19A6.94 6.94 0 0010 7.5a6.94 6.94 0 00-4.383-1.31A5.5 5.5 0 0110 4z" />
      </svg>
      Remote
      {/* 툴팁 */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Remote work position available
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </span>
    </span>
  )
}
