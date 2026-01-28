'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
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
    label: 'Region',
    options: ['Global', 'Korea'],
  },
  {
    key: 'type' as const,
    label: 'Type',
    options: ['Full-time', 'Part-time', 'Contract', 'Internship'],
  },
  {
    key: 'sector' as const,
    label: 'Sector',
    options: ['DeFi', 'NFT', 'GameFi', 'Infrastructure', 'DAO', 'L1/L2', 'Security'],
  },
  {
    key: 'backer' as const,
    label: 'VC Backer',
    options: [
      'Hashed', 'a16z', 'Paradigm', 'Kakao', 'Kakao Ventures',
      'Dunamu', 'Animoca Brands', 'SoftBank', 'Binance',
      'LINE Corporation', 'Mirae Asset', 'KB Investment', 'Wemade',
    ],
  },
  {
    key: 'techStack' as const,
    label: 'Tech',
    options: ['Solidity', 'Rust', 'TypeScript', 'Go', 'Python', 'React', 'Node.js', 'Move'],
  },
] as const

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
    <div className="mb-10 pb-6 border-b border-a24-border dark:border-a24-dark-border">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-heading uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted">
          Filter
          {activeCount > 0 && (
            <span className="ml-2 text-a24-text dark:text-a24-dark-text">{activeCount}</span>
          )}
        </h2>
        <div className="flex items-center gap-4">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-a24-accent hover:opacity-70 uppercase tracking-wider transition-opacity"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="md:hidden p-1 text-a24-muted hover:text-a24-text transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {FILTER_CONFIGS.map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted mb-1.5">
                    {label}
                  </label>
                  <select
                    value={filters[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface text-a24-text dark:text-a24-dark-text text-sm focus:ring-1 focus:ring-a24-text dark:focus:ring-a24-dark-text outline-none"
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
            {FILTER_CONFIGS.map(({ key, label }) => {
              const value = filters[key]
              if (!value) return null
              return (
                <motion.span
                  key={key}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-a24-text dark:text-a24-dark-text border border-a24-border dark:border-a24-dark-border"
                >
                  {label}: {value}
                  <button
                    onClick={() => clearFilter(key)}
                    className="hover:text-a24-accent transition-colors"
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
