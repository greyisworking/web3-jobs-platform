'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const VC_REASONS: Record<string, string> = {
  'a16z': 'Most influential crypto VC',
  Paradigm: 'Crypto-native research-driven fund',
  Hashed: "Asia's largest blockchain fund",
  'Samsung Next': 'Samsung strategic investment arm',
  Kakao: 'Kakao ecosystem blockchain innovation',
  'Kakao Ventures': 'Early-stage Web3 investor',
  'KB Investment': 'Blockchain fintech expertise',
  Dunamu: 'Upbit operator, digital asset ecosystem',
  SoftBank: 'Global tech investment leader',
  'Animoca Brands': 'GameFi & metaverse pioneer',
  Binance: "World's largest crypto exchange",
  'LINE Corporation': 'LINE-based blockchain services',
  'Mirae Asset': 'Digital assets & fintech',
  Wemade: 'Blockchain gaming leader',
}

interface GlowBadgeProps {
  name: string
  className?: string
}

export default function GlowBadge({ name, className }: GlowBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const reason = VC_REASONS[name]

  return (
    <span
      className={cn(
        'relative inline-flex items-center px-2 py-0.5 text-[11px]',
        'border border-a24-border dark:border-a24-dark-border',
        'border-l-2 border-l-px-gold',
        'text-a24-muted dark:text-a24-dark-muted',
        'hover:text-a24-text dark:hover:text-a24-dark-text transition-colors',
        className
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {name}
      {showTooltip && reason && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] whitespace-nowrap bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg z-50 pointer-events-none">
          {reason}
        </span>
      )}
    </span>
  )
}
