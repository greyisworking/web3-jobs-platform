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

function VCButton({
  name,
  count,
  isSelected,
  onClick,
}: {
  name: string
  count: number
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 px-3 py-1.5 text-xs transition-colors border whitespace-nowrap',
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
}

export default function VCBackersDashboard({
  vcCounts,
  selectedVC,
  onSelectVC,
}: VCBackersDashboardProps) {
  const handleClick = (name: string, isSelected: boolean) => {
    trackEvent('vc_click', { vc_name: name, action: isSelected ? 'deselect' : 'select' })
    onSelectVC(isSelected ? '' : name)
  }

  return (
    <div className="mb-10 pb-6 border-b border-a24-border dark:border-a24-dark-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
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

      {/* Marquee container - no scrollbar, infinite loop animation */}
      <div className="overflow-hidden">
        <div className="flex gap-2 vc-marquee w-max">
          {/* First set */}
          {VC_BRANDS.map((name) => (
            <VCButton
              key={`first-${name}`}
              name={name}
              count={vcCounts[name] ?? 0}
              isSelected={selectedVC === name}
              onClick={() => handleClick(name, selectedVC === name)}
            />
          ))}
          {/* Duplicate set for seamless loop */}
          {VC_BRANDS.map((name) => (
            <VCButton
              key={`second-${name}`}
              name={name}
              count={vcCounts[name] ?? 0}
              isSelected={selectedVC === name}
              onClick={() => handleClick(name, selectedVC === name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
