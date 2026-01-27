'use client'

import { cn } from '@/lib/utils'

interface EnglishBadgeProps {
  className?: string
}

/** 영어 뱃지 — 영어 사용 환경 표시 */
export default function EnglishBadge({ className }: EnglishBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full',
        'bg-gray-500/15 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300',
        'border-hairline border-gray-400/30',
        'shadow-[0_0_8px_rgba(107,114,128,0.15)]',
        'hover:shadow-[0_0_14px_rgba(107,114,128,0.3)]',
        'transition-shadow duration-300',
        className
      )}
    >
      {/* 깃발/언어 아이콘 */}
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.171 4.146l1.947 2.466a3.514 3.514 0 011.764 0l1.947-2.466a6.52 6.52 0 00-5.658 0zm8.683 3.025l-2.466 1.947c.15.578.15 1.186 0 1.764l2.466 1.947a6.52 6.52 0 000-5.658zm-3.025 8.683l-1.947-2.466c-.578.15-1.186.15-1.764 0l-1.947 2.466a6.52 6.52 0 005.658 0zM4.146 12.83l2.466-1.947a3.514 3.514 0 010-1.764L4.146 7.17a6.52 6.52 0 000 5.658zM10 18a8 8 0 100-16 8 8 0 000 16zm0-5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
      English
      {/* 툴팁 */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        English-friendly work environment
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </span>
    </span>
  )
}
