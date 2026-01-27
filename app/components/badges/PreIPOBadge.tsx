'use client'

import { cn } from '@/lib/utils'

interface PreIPOBadgeProps {
  className?: string
}

/** Pre-IPO 뱃지 — 초기 단계 스타트업 표시 */
export default function PreIPOBadge({ className }: PreIPOBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full',
        'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
        'border-hairline border-amber-400/30',
        'shadow-[0_0_8px_rgba(245,158,11,0.15)]',
        'hover:shadow-[0_0_14px_rgba(245,158,11,0.3)]',
        'transition-shadow duration-300',
        className
      )}
    >
      {/* 성장 그래프 아이콘 */}
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
      </svg>
      Pre-IPO
      {/* 툴팁 */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Early-stage startup (Seed ~ Series C)
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </span>
    </span>
  )
}
