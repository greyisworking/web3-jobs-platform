'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

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
    label: 'REGION',
    options: ['Global', 'Korea'],
    color: 'sky',
  },
  {
    key: 'type' as const,
    label: 'TYPE',
    options: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    color: 'pink',
  },
  {
    key: 'sector' as const,
    label: 'SECTOR',
    options: ['DeFi', 'NFT', 'GameFi', 'Infrastructure', 'DAO', 'L1/L2', 'Security'],
    color: 'sky',
  },
  {
    key: 'backer' as const,
    label: 'VC BACKER',
    options: [
      'Hashed', 'a16z', 'Paradigm', 'Kakao', 'Kakao Ventures',
      'Dunamu', 'Animoca Brands', 'SoftBank', 'Binance',
      'LINE Corporation', 'Mirae Asset', 'KB Investment', 'Wemade',
    ],
    color: 'pink',
  },
  {
    key: 'techStack' as const,
    label: 'TECH',
    options: ['Solidity', 'Rust', 'TypeScript', 'Go', 'Python', 'React', 'Node.js', 'Move'],
    color: 'sky',
  },
] as const

const CHIP_COLORS: Record<string, string> = {
  sky: 'bg-sub-sky/15 text-[#1a3a5c] dark:text-[#a8d4f0] border border-sub-sky/30',
  pink: 'bg-sub-hotpink/15 text-[#5c1a35] dark:text-[#f0a8c4] border border-sub-hotpink/30',
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

  const [filters, setFilters] = useState<SmartFilters>(() => ({
    region: searchParams.get('region') ?? '',
    type: searchParams.get('type') ?? '',
    sector: searchParams.get('sector') ?? '',
    backer: searchParams.get('backer') ?? '',
    techStack: searchParams.get('techStack') ?? '',
  }))

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
    trackEvent('filter_use', { filter_key: key, filter_value: next[key] || '(cleared)' })
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
    <div className="bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark p-6 mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sub-muted" />
          <h2 className="text-sm font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200">
            FILTERS
          </h2>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-medium bg-sub-hotpink text-white">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-sub-hotpink hover:opacity-80 font-medium uppercase tracking-wider"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="md:hidden p-1 hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-sub-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-sub-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Filter grid */}
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
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-sub-muted dark:text-gray-400 mb-2">
                    {label}
                  </label>
                  <select
                    value={filters[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-sub-border dark:border-sub-border-dark bg-white dark:bg-sub-dark-bg text-sub-charcoal dark:text-gray-200 text-sm focus:ring-2 focus:ring-sub-hotpink focus:border-sub-hotpink outline-none"
                  >
                    <option value="">All</option>
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

      {/* Active filter chips */}
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium ${CHIP_COLORS[color]}`}
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
