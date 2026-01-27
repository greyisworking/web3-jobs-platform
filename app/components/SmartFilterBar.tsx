'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react'

export interface SmartFilters {
  region: string
  type: string
  sector: string
  backer: string
  techStack: string
}

interface SmartFilterBarProps {
  onFilterChange: (filters: SmartFilters) => void
}

const FILTER_CONFIGS = [
  {
    key: 'region' as const,
    label: '지역',
    options: ['Global', 'Korea'],
    color: 'green',
  },
  {
    key: 'type' as const,
    label: '고용 형태',
    options: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    color: 'purple',
  },
  {
    key: 'sector' as const,
    label: '섹터',
    options: ['DeFi', 'NFT', 'GameFi', 'Infrastructure', 'DAO', 'L1/L2', 'Security'],
    color: 'blue',
  },
  {
    key: 'backer' as const,
    label: '투자사 (VC)',
    options: [
      'Hashed', 'a16z', 'Paradigm', 'Kakao', 'Kakao Ventures',
      'Dunamu', 'Animoca Brands', 'SoftBank', 'Binance',
      'LINE Corporation', 'Mirae Asset', 'KB Investment', 'Wemade',
    ],
    color: 'violet',
  },
  {
    key: 'techStack' as const,
    label: '기술 스택',
    options: ['Solidity', 'Rust', 'TypeScript', 'Go', 'Python', 'React', 'Node.js', 'Move'],
    color: 'orange',
  },
] as const

const CHIP_COLORS: Record<string, string> = {
  green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
}

const emptyFilters: SmartFilters = {
  region: '',
  type: '',
  sector: '',
  backer: '',
  techStack: '',
}

export default function SmartFilterBar({ onFilterChange }: SmartFilterBarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)

  // URL 파라미터에서 초기 상태 읽기
  const [filters, setFilters] = useState<SmartFilters>(() => ({
    region: searchParams.get('region') ?? '',
    type: searchParams.get('type') ?? '',
    sector: searchParams.get('sector') ?? '',
    backer: searchParams.get('backer') ?? '',
    techStack: searchParams.get('techStack') ?? '',
  }))

  // 마운트 시 URL 파라미터가 있으면 콜백 호출
  useEffect(() => {
    const hasParams = Object.values(filters).some((v) => v)
    if (hasParams) {
      onFilterChange(filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncToURL = useCallback(
    (next: SmartFilters) => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value)
      }
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : '/', { scroll: false })
    },
    [router]
  )

  const handleChange = (key: keyof SmartFilters, value: string) => {
    const next = { ...filters, [key]: filters[key] === value ? '' : value }
    setFilters(next)
    syncToURL(next)
    onFilterChange(next)
  }

  const clearFilter = (key: keyof SmartFilters) => {
    const next = { ...filters, [key]: '' }
    setFilters(next)
    syncToURL(next)
    onFilterChange(next)
  }

  const clearAll = () => {
    setFilters(emptyFilters)
    syncToURL(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="backdrop-blur-md bg-white/70 dark:bg-white/10 rounded-xl border-hairline border-white/20 shadow-glass p-6 mb-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            스마트 필터
          </h2>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-web3-electric-blue text-white">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 font-medium"
            >
              전체 초기화
            </button>
          )}
          {/* 모바일 토글 */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* 필터 그리드 */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FILTER_CONFIGS.map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                  </label>
                  <select
                    value={filters[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-web3-electric-blue dark:bg-white/10 dark:text-white text-sm"
                  >
                    <option value="">전체</option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 활성 필터 칩 */}
      <AnimatePresence mode="popLayout">
        {activeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {FILTER_CONFIGS.map(({ key, label, color }) => {
              const value = filters[key]
              if (!value) return null
              return (
                <motion.span
                  key={key}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${CHIP_COLORS[color]}`}
                >
                  {label}: {value}
                  <button
                    onClick={() => clearFilter(key)}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.span>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
