'use client'

import { cn } from '@/lib/utils'

interface TrustVerifiedBadgeProps {
  className?: string
  compact?: boolean
}

export default function TrustVerifiedBadge({ className, compact }: TrustVerifiedBadgeProps) {
  return (
    <span
      className={cn(
        'group relative inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider',
        'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-1.5 py-0.5',
        className
      )}
    >
      <span className="text-[11px]">✓</span>
      {!compact && 'VERIFIED'}
    </span>
  )
}
