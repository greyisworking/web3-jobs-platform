'use client'

import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const VC_BRANDS = [
  'Hashed',
  'Samsung Next',
  'a16z',
  'Paradigm',
  'Kakao',
  'Kakao Ventures',
  'KB Investment',
  'Dunamu',
  'SoftBank',
  'Animoca Brands',
  'Binance',
  'LINE Corporation',
  'Mirae Asset',
  'Wemade',
]

interface VCBackersDashboardProps {
  vcCounts: Record<string, number>
  selectedVC: string
  onSelectVC: (vc: string) => void
}

export default function VCBackersDashboard({
  vcCounts,
  selectedVC,
  onSelectVC,
}: VCBackersDashboardProps) {
  return (
    <div className="mb-10 pb-6 border-b border-a24-border dark:border-a24-dark-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-heading uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted">
          VC Backers
        </h2>
        {selectedVC && (
          <button
            onClick={() => onSelectVC('')}
            className="text-xs text-a24-accent hover:opacity-70 transition-opacity uppercase tracking-wider"
          >
            Show All
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {VC_BRANDS.map((name) => {
          const count = vcCounts[name] ?? 0
          const isSelected = selectedVC === name

          return (
            <button
              key={name}
              onClick={() => {
                trackEvent('vc_click', { vc_name: name, action: isSelected ? 'deselect' : 'select' })
                onSelectVC(isSelected ? '' : name)
              }}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 text-xs transition-colors border',
                isSelected
                  ? 'border-a24-text dark:border-a24-dark-text text-a24-text dark:text-a24-dark-text bg-a24-bg dark:bg-a24-dark-bg'
                  : 'border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text'
              )}
            >
              {name}
              {count > 0 && (
                <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
