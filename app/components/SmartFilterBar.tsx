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
  tier1VCOnly: boolean
  daoJobsOnly: boolean
  tokenGatedOnly: boolean
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
  tier1VCOnly: false,
  daoJobsOnly: false,
  tokenGatedOnly: false,
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
    tier1VCOnly: searchParams.get('tier1vc') === 'true',
    daoJobsOnly: searchParams.get('dao') === 'true',
    tokenGatedOnly: searchParams.get('tokengate') === 'true',
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
        if (key === 'tier1VCOnly') {
          if (value) params.set('tier1vc', 'true')
        } else if (key === 'daoJobsOnly') {
          if (value) params.set('dao', 'true')
        } else if (key === 'tokenGatedOnly') {
          if (value) params.set('tokengate', 'true')
        } else if (value) {
          params.set(key, value as string)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : '/careers', { scroll: false })
    },
    [router]
  )

  const handleChange = (key: keyof Omit<SmartFilters, 'tier1VCOnly'>, value: string) => {
    const next = { ...filters, [key]: filters[key] === value ? '' : value }
    setFilters(next)
    syncToURL(next)
    onFilterChange(next)
    trackEvent('filter_use', { filter_key: key, filter_value: next[key] || '(cleared)' })
  }

  const handleTier1Toggle = () => {
    const next = { ...filters, tier1VCOnly: !filters.tier1VCOnly }
    setFilters(next)
    syncToURL(next)
    onFilterChange(next)
    trackEvent('filter_use', { filter_key: 'tier1VCOnly', filter_value: String(next.tier1VCOnly) })
  }

  const clearFilter = (key: keyof SmartFilters) => {
    const next = { ...filters, [key]: key === 'tier1VCOnly' ? false : '' }
    setFilters(next as SmartFilters)
    syncToURL(next as SmartFilters)
    onFilterChange(next as SmartFilters)
  }

  const clearAll = () => {
    setFilters(emptyFilters)
    syncToURL(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'tier1VCOnly' || k === 'daoJobsOnly' || k === 'tokenGatedOnly') return v === true
    return Boolean(v)
  }).length

  return (
    <div className="mb-8 pb-4 border-b border-a24-border dark:border-a24-dark-border">
      {/* Web3 Filter Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        {/* VC Verified Toggle */}
        <div className="flex items-center justify-between py-3 px-4 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <span className="text-[11px]">🏆</span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400">
              VC Verified
            </span>
            <span className="text-[10px] text-amber-400/60">
              only
            </span>
          </div>
          <button
            onClick={handleTier1Toggle}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              filters.tier1VCOnly
                ? 'bg-amber-500'
                : 'bg-a24-border dark:bg-a24-dark-border'
            }`}
            aria-label="Toggle VC Verified filter"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-a24-dark-bg transition-transform duration-200 ${
                filters.tier1VCOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* DAO Jobs Toggle */}
        <div className="flex items-center justify-between py-3 px-4 border border-purple-500/30 bg-purple-500/5">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-purple-400">
              DAO Jobs
            </span>
            <span className="ml-2 text-[10px] text-purple-400/60">
              governance roles
            </span>
          </div>
          <button
            onClick={() => {
              const next = { ...filters, daoJobsOnly: !filters.daoJobsOnly }
              setFilters(next)
              syncToURL(next)
              onFilterChange(next)
              trackEvent('filter_use', { filter_key: 'daoJobsOnly', filter_value: String(next.daoJobsOnly) })
            }}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              filters.daoJobsOnly
                ? 'bg-purple-500'
                : 'bg-a24-border dark:bg-a24-dark-border'
            }`}
            aria-label="Toggle DAO Jobs filter"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-a24-dark-bg transition-transform duration-200 ${
                filters.daoJobsOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Token Gated Toggle */}
        <div className="flex items-center justify-between py-3 px-4 border border-yellow-500/30 bg-yellow-500/5">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-yellow-400">
              Token Gate
            </span>
            <span className="ml-2 text-[10px] text-yellow-400/60">
              holders only
            </span>
          </div>
          <button
            onClick={() => {
              const next = { ...filters, tokenGatedOnly: !filters.tokenGatedOnly }
              setFilters(next)
              syncToURL(next)
              onFilterChange(next)
              trackEvent('filter_use', { filter_key: 'tokenGatedOnly', filter_value: String(next.tokenGatedOnly) })
            }}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              filters.tokenGatedOnly
                ? 'bg-yellow-500'
                : 'bg-a24-border dark:bg-a24-dark-border'
            }`}
            aria-label="Toggle Token Gated filter"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-a24-dark-bg transition-transform duration-200 ${
                filters.tokenGatedOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {FILTER_CONFIGS.map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted mb-1">
                    {label}
                  </label>
                  <select
                    value={filters[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-2 py-1.5 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface text-a24-text dark:text-a24-dark-text text-sm focus:ring-1 focus:ring-a24-text dark:focus:ring-a24-dark-text outline-none"
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
            className="mt-3 flex flex-wrap gap-2"
          >
            {filters.tier1VCOnly && (
              <motion.span
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-amber-400 border border-amber-500/30"
              >
                🏆 VC Verified Only
                <button
                  onClick={() => clearFilter('tier1VCOnly')}
                  className="hover:text-amber-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            )}
            {filters.daoJobsOnly && (
              <motion.span
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-purple-400 border border-purple-500/30"
              >
                DAO Jobs
                <button
                  onClick={() => clearFilter('daoJobsOnly')}
                  className="hover:text-purple-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            )}
            {filters.tokenGatedOnly && (
              <motion.span
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-yellow-400 border border-yellow-500/30"
              >
                Token Gated
                <button
                  onClick={() => clearFilter('tokenGatedOnly')}
                  className="hover:text-yellow-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            )}
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
