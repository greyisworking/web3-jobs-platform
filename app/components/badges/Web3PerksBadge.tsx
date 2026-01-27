'use client'

import { cn } from '@/lib/utils'

interface Web3PerksBadgeProps {
  className?: string
}

/** Web3 혜택 뱃지 — 토큰/주식 옵션 등 Web3 특별 보상 포함 */
export default function Web3PerksBadge({ className }: Web3PerksBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full',
        'bg-gradient-to-r from-purple-500/15 to-violet-500/15 dark:from-purple-500/20 dark:to-violet-500/20',
        'text-purple-700 dark:text-purple-300',
        'border-hairline border-purple-400/30',
        'shadow-[0_0_8px_rgba(168,85,247,0.15)]',
        'hover:shadow-[0_0_14px_rgba(168,85,247,0.3)]',
        'transition-shadow duration-300',
        className
      )}
    >
      {/* 토큰/다이아몬드 아이콘 */}
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 1l3.464 6H6.536L10 1zM3 9h14l-7 10L3 9z" clipRule="evenodd" />
      </svg>
      Web3 Perks
      {/* 툴팁 */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Includes token/equity compensation
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </span>
    </span>
  )
}
