'use client'

import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  className?: string
}

/** VC 검증 뱃지 — 주요 VC 투자를 받은 회사 표시 */
export default function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full',
        'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        'border-hairline border-emerald-400/30',
        'shadow-[0_0_8px_rgba(16,185,129,0.15)]',
        'hover:shadow-[0_0_14px_rgba(16,185,129,0.3)]',
        'transition-shadow duration-300',
        className
      )}
    >
      {/* 체크 아이콘 */}
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
      VC Verified
      {/* 툴팁 */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        Backed by top-tier VC investors
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </span>
    </span>
  )
}
