'use client'

import { cn } from '@/lib/utils'

interface ActiveBadgeProps {
  className?: string
}

/** 활성 뱃지 — 최근 30일 이내 게시된 공고에 초록 펄스 애니메이션 적용 */
export default function ActiveBadge({ className }: ActiveBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full',
        'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        'border-hairline border-emerald-400/30',
        'shadow-[0_0_8px_rgba(16,185,129,0.15)]',
        'hover:shadow-[0_0_14px_rgba(16,185,129,0.3)]',
        'transition-shadow duration-300',
        className
      )}
    >
      {/* 펄스 점 — 활성 상태 표시 */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      Active
      {/* 툴팁 */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Posted within the last 30 days
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </span>
    </span>
  )
}
