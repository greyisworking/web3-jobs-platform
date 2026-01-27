'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * VC 투자사 브랜드 색상 설정
 * 각 VC의 고유 색상으로 글로우 효과와 배경을 적용
 */
const VC_BRANDS: {
  name: string
  color: string
  bgActive: string
  bgHover: string
  glow: string
}[] = [
  { name: 'Hashed', color: 'text-emerald-600 dark:text-emerald-400', bgActive: 'bg-emerald-500/20 dark:bg-emerald-500/30', bgHover: 'hover:bg-emerald-500/10', glow: 'shadow-[0_0_16px_rgba(16,185,129,0.4)]' },
  { name: 'Samsung Next', color: 'text-blue-600 dark:text-blue-400', bgActive: 'bg-blue-500/20 dark:bg-blue-500/30', bgHover: 'hover:bg-blue-500/10', glow: 'shadow-[0_0_16px_rgba(59,130,246,0.4)]' },
  { name: 'a16z', color: 'text-orange-600 dark:text-orange-400', bgActive: 'bg-orange-500/20 dark:bg-orange-500/30', bgHover: 'hover:bg-orange-500/10', glow: 'shadow-[0_0_16px_rgba(249,115,22,0.4)]' },
  { name: 'Paradigm', color: 'text-blue-600 dark:text-blue-400', bgActive: 'bg-blue-500/20 dark:bg-blue-500/30', bgHover: 'hover:bg-blue-500/10', glow: 'shadow-[0_0_16px_rgba(59,130,246,0.4)]' },
  { name: 'Kakao', color: 'text-yellow-600 dark:text-yellow-400', bgActive: 'bg-yellow-500/20 dark:bg-yellow-500/30', bgHover: 'hover:bg-yellow-500/10', glow: 'shadow-[0_0_16px_rgba(234,179,8,0.4)]' },
  { name: 'Kakao Ventures', color: 'text-yellow-600 dark:text-yellow-400', bgActive: 'bg-yellow-500/20 dark:bg-yellow-500/30', bgHover: 'hover:bg-yellow-500/10', glow: 'shadow-[0_0_16px_rgba(234,179,8,0.4)]' },
  { name: 'KB Investment', color: 'text-violet-600 dark:text-violet-400', bgActive: 'bg-violet-500/20 dark:bg-violet-500/30', bgHover: 'hover:bg-violet-500/10', glow: 'shadow-[0_0_16px_rgba(139,92,246,0.4)]' },
  { name: 'Dunamu', color: 'text-sky-600 dark:text-sky-400', bgActive: 'bg-sky-500/20 dark:bg-sky-500/30', bgHover: 'hover:bg-sky-500/10', glow: 'shadow-[0_0_16px_rgba(14,165,233,0.4)]' },
  { name: 'SoftBank', color: 'text-slate-600 dark:text-slate-400', bgActive: 'bg-slate-500/20 dark:bg-slate-500/30', bgHover: 'hover:bg-slate-500/10', glow: 'shadow-[0_0_16px_rgba(100,116,139,0.4)]' },
  { name: 'Animoca Brands', color: 'text-pink-600 dark:text-pink-400', bgActive: 'bg-pink-500/20 dark:bg-pink-500/30', bgHover: 'hover:bg-pink-500/10', glow: 'shadow-[0_0_16px_rgba(236,72,153,0.4)]' },
  { name: 'Binance', color: 'text-amber-600 dark:text-amber-400', bgActive: 'bg-amber-500/20 dark:bg-amber-500/30', bgHover: 'hover:bg-amber-500/10', glow: 'shadow-[0_0_16px_rgba(245,158,11,0.4)]' },
  { name: 'LINE Corporation', color: 'text-green-600 dark:text-green-400', bgActive: 'bg-green-500/20 dark:bg-green-500/30', bgHover: 'hover:bg-green-500/10', glow: 'shadow-[0_0_16px_rgba(34,197,94,0.4)]' },
  { name: 'Mirae Asset', color: 'text-indigo-600 dark:text-indigo-400', bgActive: 'bg-indigo-500/20 dark:bg-indigo-500/30', bgHover: 'hover:bg-indigo-500/10', glow: 'shadow-[0_0_16px_rgba(99,102,241,0.4)]' },
  { name: 'Wemade', color: 'text-cyan-600 dark:text-cyan-400', bgActive: 'bg-cyan-500/20 dark:bg-cyan-500/30', bgHover: 'hover:bg-cyan-500/10', glow: 'shadow-[0_0_16px_rgba(6,182,212,0.4)]' },
]

interface VCBackersDashboardProps {
  /** 각 VC별 공고 수 맵 */
  vcCounts: Record<string, number>
  /** 현재 선택된 VC */
  selectedVC: string
  /** VC 선택/해제 콜백 */
  onSelectVC: (vc: string) => void
}

export default function VCBackersDashboard({
  vcCounts,
  selectedVC,
  onSelectVC,
}: VCBackersDashboardProps) {
  return (
    <div className="backdrop-blur-md bg-white/70 dark:bg-white/10 border-hairline border-white/20 rounded-xl shadow-glass p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          VC Backers
        </h2>
        {selectedVC && (
          <button
            onClick={() => onSelectVC('')}
            className="text-sm text-web3-electric-blue hover:text-web3-neon-cyan transition-colors"
          >
            Show All
          </button>
        )}
      </div>

      {/* 가로 스크롤 가능한 VC 버튼 행 */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {VC_BRANDS.map((vc) => {
          const count = vcCounts[vc.name] ?? 0
          const isSelected = selectedVC === vc.name
          const initial = vc.name[0]

          return (
            <motion.button
              key={vc.name}
              onClick={() => onSelectVC(isSelected ? '' : vc.name)}
              // 호버 시 확대, 선택 시 글로우 효과
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl',
                'border-hairline border-white/20',
                'transition-all duration-300',
                isSelected
                  ? cn(vc.bgActive, vc.glow)
                  : cn('bg-white/40 dark:bg-white/5', vc.bgHover)
              )}
            >
              {/* VC 이니셜 아바타 */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                  isSelected ? vc.bgActive : 'bg-gray-200/50 dark:bg-white/10',
                  vc.color
                )}
              >
                {initial}
              </div>
              {/* VC 이름 */}
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                isSelected ? vc.color : 'text-gray-600 dark:text-gray-400'
              )}>
                {vc.name}
              </span>
              {/* 공고 수 */}
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                isSelected
                  ? cn(vc.bgActive, vc.color)
                  : 'bg-gray-200/50 dark:bg-white/10 text-gray-500 dark:text-gray-400'
              )}>
                {count}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
