'use client'

import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const VC_BRANDS: {
  name: string
  color: string
}[] = [
  { name: 'Hashed', color: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Samsung Next', color: 'text-blue-600 dark:text-blue-400' },
  { name: 'a16z', color: 'text-orange-600 dark:text-orange-400' },
  { name: 'Paradigm', color: 'text-blue-600 dark:text-blue-400' },
  { name: 'Kakao', color: 'text-yellow-600 dark:text-yellow-400' },
  { name: 'Kakao Ventures', color: 'text-yellow-600 dark:text-yellow-400' },
  { name: 'KB Investment', color: 'text-violet-600 dark:text-violet-400' },
  { name: 'Dunamu', color: 'text-sky-600 dark:text-sky-400' },
  { name: 'SoftBank', color: 'text-slate-600 dark:text-slate-400' },
  { name: 'Animoca Brands', color: 'text-pink-600 dark:text-pink-400' },
  { name: 'Binance', color: 'text-amber-600 dark:text-amber-400' },
  { name: 'LINE Corporation', color: 'text-green-600 dark:text-green-400' },
  { name: 'Mirae Asset', color: 'text-indigo-600 dark:text-indigo-400' },
  { name: 'Wemade', color: 'text-cyan-600 dark:text-cyan-400' },
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
    <div className="bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200">
          VC BACKERS
        </h2>
        {selectedVC && (
          <button
            onClick={() => onSelectVC('')}
            className="text-xs text-sub-hotpink hover:opacity-80 transition-opacity uppercase tracking-wider"
          >
            Show All
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {VC_BRANDS.map((vc) => {
          const count = vcCounts[vc.name] ?? 0
          const isSelected = selectedVC === vc.name
          const initial = vc.name[0]

          return (
            <button
              key={vc.name}
              onClick={() => {
                trackEvent('vc_click', { vc_name: vc.name, action: isSelected ? 'deselect' : 'select' })
                onSelectVC(isSelected ? '' : vc.name)
              }}
              className={cn(
                'flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3',
                'border transition-colors duration-150',
                isSelected
                  ? 'bg-sub-hotpink/10 border-sub-hotpink'
                  : 'border-sub-border dark:border-sub-border-dark hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 flex items-center justify-center text-sm font-heading uppercase',
                  isSelected
                    ? 'bg-sub-hotpink/20 ' + vc.color
                    : 'bg-gray-100 dark:bg-gray-800 ' + vc.color
                )}
              >
                {initial}
              </div>
              <span className={cn(
                'text-[11px] font-medium whitespace-nowrap',
                isSelected ? vc.color : 'text-sub-charcoal dark:text-gray-400'
              )}>
                {vc.name}
              </span>
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5',
                isSelected
                  ? 'bg-sub-hotpink/20 text-sub-hotpink'
                  : 'bg-gray-100 dark:bg-gray-800 text-sub-muted dark:text-gray-400'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
