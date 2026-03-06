'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'
import NSelect from './NSelect'

export interface SmartFilters {
  region: string
  type: string
  sector: string
  backer: string
  role: string
  tier1VCOnly: boolean
  daoJobsOnly: boolean
  tokenGatedOnly: boolean
  remoteOnly: boolean
  salaryRange: string
}

const SALARY_RANGES = [
  { value: '', label: 'Any Salary' },
  { value: '50k-100k', label: '$50K - $100K' },
  { value: '100k-150k', label: '$100K - $150K' },
  { value: '150k-200k', label: '$150K - $200K' },
  { value: '200k+', label: '$200K+' },
] as const

const VC_BRANDS = [
  'Hashed', 'Samsung Next', 'a16z', 'Paradigm', 'Kakao', 'Kakao Ventures',
  'KB Investment', 'Dunamu', 'SoftBank', 'Animoca Brands', 'Binance',
  'LINE Corporation', 'Mirae Asset', 'Wemade',
]

const COLLAPSED_FILTER_CONFIGS = [
  {
    key: 'type' as const,
    label: 'Type',
    options: ['Full-time', 'Contractor', 'Ambassador'],
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
] as const

interface SmartFilterBarProps {
  onFilterChange: (filters: SmartFilters) => void
  vcCounts?: Record<string, number>
  selectedVC?: string
  onSelectVC?: (vc: string) => void
}

const emptyFilters: SmartFilters = {
  region: '',
  type: '',
  sector: '',
  backer: '',
  role: '',
  tier1VCOnly: false,
  daoJobsOnly: false,
  tokenGatedOnly: false,
  remoteOnly: false,
  salaryRange: '',
}

function Toggle({
  label,
  active,
  onToggle,
  color = 'cyan',
}: {
  label: string
  active: boolean
  onToggle: () => void
  color?: 'amber' | 'green' | 'yellow' | 'cyan'
}) {
  const colorMap = {
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-500', text: 'text-amber-400', chip: 'text-amber-400 border-amber-500/30' },
    green: { border: 'border-neun-success/30', bg: 'bg-neun-success', text: 'text-neun-success', chip: 'text-neun-success border-neun-success/30' },
    yellow: { border: 'border-yellow-500/30', bg: 'bg-yellow-500', text: 'text-yellow-400', chip: 'text-yellow-400 border-yellow-500/30' },
    cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-500', text: 'text-cyan-400', chip: 'text-cyan-400 border-cyan-500/30' },
  }
  const c = colorMap[color]

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 px-3 py-2 border transition-colors text-xs',
        active ? `${c.border} ${c.text}` : 'border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
      )}
    >
      <span className="uppercase tracking-[0.15em] font-medium whitespace-nowrap">{label}</span>
      <span
        className={cn(
          'relative w-8 h-4 rounded-full transition-colors flex-shrink-0',
          active ? c.bg : 'bg-a24-border dark:bg-a24-dark-border'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white dark:bg-a24-dark-bg transition-transform',
            active ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  )
}

export default function SmartFilterBar({ onFilterChange, vcCounts = {}, selectedVC = '', onSelectVC }: SmartFilterBarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  const [filters, setFilters] = useState<SmartFilters>(() => ({
    region: searchParams.get('region') ?? '',
    type: searchParams.get('type') ?? '',
    sector: searchParams.get('sector') ?? '',
    backer: searchParams.get('backer') ?? '',
    role: searchParams.get('role') ?? '',
    tier1VCOnly: searchParams.get('tier1vc') === 'true',
    daoJobsOnly: searchParams.get('dao') === 'true',
    tokenGatedOnly: searchParams.get('tokengate') === 'true',
    remoteOnly: searchParams.get('remote') === 'true',
    salaryRange: searchParams.get('salary') ?? '',
  }))

  useEffect(() => {
    const hasParams = Object.values(filters).some((v) => v)
    if (hasParams) {
      onFilterChange(filters)
      // Auto-expand if filters are active from URL
      const hasAdvanced = filters.type || filters.sector || filters.backer ||
        filters.tier1VCOnly || filters.daoJobsOnly || filters.tokenGatedOnly || filters.salaryRange
      if (hasAdvanced) setExpanded(true)
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
        } else if (key === 'remoteOnly') {
          if (value) params.set('remote', 'true')
        } else if (key === 'salaryRange') {
          if (value) params.set('salary', value as string)
        } else if (value) {
          params.set(key, value as string)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : '/jobs', { scroll: false })
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

  const handleBoolToggle = (key: 'tier1VCOnly' | 'daoJobsOnly' | 'tokenGatedOnly' | 'remoteOnly') => {
    const next = { ...filters, [key]: !filters[key] }
    setFilters(next)
    syncToURL(next)
    onFilterChange(next)
    trackEvent('filter_use', { filter_key: key, filter_value: String(next[key]) })
  }

  const clearFilter = (key: keyof SmartFilters) => {
    const booleanKeys = ['tier1VCOnly', 'daoJobsOnly', 'tokenGatedOnly', 'remoteOnly']
    const next = { ...filters, [key]: booleanKeys.includes(key) ? false : '' }
    setFilters(next as SmartFilters)
    syncToURL(next as SmartFilters)
    onFilterChange(next as SmartFilters)
  }

  const clearAll = () => {
    setFilters(emptyFilters)
    syncToURL(emptyFilters)
    onFilterChange(emptyFilters)
    if (onSelectVC) onSelectVC('')
  }

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'tier1VCOnly' || k === 'daoJobsOnly' || k === 'tokenGatedOnly' || k === 'remoteOnly') return v === true
    return Boolean(v)
  }).length + (selectedVC ? 1 : 0)

  const handleVCClick = (name: string) => {
    if (!onSelectVC) return
    trackEvent('vc_click', { vc_name: name, action: selectedVC === name ? 'deselect' : 'select' })
    onSelectVC(selectedVC === name ? '' : name)
  }

  return (
    <div className="mb-8">
      {/* Main filters - always visible */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Role */}
          <div className="w-36">
            <NSelect
              label=""
              value={filters.role}
              onChange={(v) => handleChange('role', v)}
              placeholder="Role"
              options={[
                { value: '', label: 'All Roles' },
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Product', label: 'Product' },
                { value: 'Design', label: 'Design' },
                { value: 'Marketing/Growth', label: 'Marketing' },
                { value: 'Business Development', label: 'Biz Dev' },
                { value: 'Operations/HR', label: 'Ops / HR' },
                { value: 'Community/Support', label: 'Community' },
              ]}
            />
          </div>

          {/* Region */}
          <div className="w-32">
            <NSelect
              label=""
              value={filters.region}
              onChange={(v) => handleChange('region', v)}
              placeholder="Region"
              options={[
                { value: '', label: 'All Regions' },
                { value: 'Global', label: 'Global' },
                { value: 'Korea', label: 'Korea' },
              ]}
            />
          </div>

          {/* Remote toggle */}
          <Toggle
            label="Remote"
            active={filters.remoteOnly}
            onToggle={() => handleBoolToggle('remoteOnly')}
            color="cyan"
          />
        </div>

        {/* Filters expand button + reset */}
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-[11px] text-a24-accent hover:opacity-70 uppercase tracking-wider transition-opacity"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] px-3 py-2 border transition-colors',
              expanded
                ? 'border-a24-text dark:border-a24-dark-text text-a24-text dark:text-a24-dark-text'
                : 'border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text'
            )}
          >
            Filters
            {activeCount > 0 && (
              <span className="text-[10px] text-a24-accent">{activeCount}</span>
            )}
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible advanced filters */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-4 border-t border-a24-border dark:border-a24-dark-border">
              {/* Dropdowns row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {COLLAPSED_FILTER_CONFIGS.map(({ key, label, options }) => (
                  <NSelect
                    key={key}
                    label={label}
                    value={filters[key]}
                    onChange={(v) => handleChange(key, v)}
                    placeholder="All"
                    options={[
                      { value: '', label: 'All' },
                      ...options.map(opt => ({ value: opt, label: opt })),
                    ]}
                  />
                ))}
                <NSelect
                  label="Salary"
                  value={filters.salaryRange}
                  onChange={(v) => handleChange('salaryRange', v)}
                  placeholder="Any Salary"
                  options={SALARY_RANGES.map(({ value, label }) => ({ value, label }))}
                />
              </div>

              {/* Web3 toggles row */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Toggle label="VC Verified" active={filters.tier1VCOnly} onToggle={() => handleBoolToggle('tier1VCOnly')} color="amber" />
                <Toggle label="DAO Jobs" active={filters.daoJobsOnly} onToggle={() => handleBoolToggle('daoJobsOnly')} color="green" />
                <Toggle label="Token Gate" active={filters.tokenGatedOnly} onToggle={() => handleBoolToggle('tokenGatedOnly')} color="yellow" />
              </div>

              {/* VC Backers */}
              {onSelectVC && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-light uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted">
                      VC Backers
                    </span>
                    {selectedVC && (
                      <button
                        onClick={() => onSelectVC('')}
                        className="text-[11px] text-a24-accent hover:opacity-70 transition-opacity uppercase tracking-wider"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VC_BRANDS.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleVCClick(name)}
                        className={cn(
                          'px-2.5 py-1 text-[11px] transition-colors border whitespace-nowrap',
                          selectedVC === name
                            ? 'border-a24-text dark:border-a24-dark-text text-a24-text dark:text-a24-dark-text'
                            : 'border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text'
                        )}
                      >
                        {name}
                        {(vcCounts[name] ?? 0) > 0 && (
                          <span className="ml-1 text-[9px] opacity-50">{vcCounts[name]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
            className="flex flex-wrap gap-1.5 mt-2"
          >
            {filters.remoteOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-cyan-400 border border-cyan-500/30">
                Remote
                <button onClick={() => clearFilter('remoteOnly')} className="hover:text-cyan-300"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.tier1VCOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-amber-400 border border-amber-500/30">
                VC Verified
                <button onClick={() => clearFilter('tier1VCOnly')} className="hover:text-amber-300"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.daoJobsOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-neun-success border border-neun-success/30">
                DAO
                <button onClick={() => clearFilter('daoJobsOnly')} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.tokenGatedOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-yellow-400 border border-yellow-500/30">
                Token Gate
                <button onClick={() => clearFilter('tokenGatedOnly')} className="hover:text-yellow-300"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.salaryRange && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-green-400 border border-green-500/30">
                {SALARY_RANGES.find(r => r.value === filters.salaryRange)?.label}
                <button onClick={() => clearFilter('salaryRange')} className="hover:text-green-300"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedVC && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-a24-text dark:text-a24-dark-text border border-a24-border dark:border-a24-dark-border">
                VC: {selectedVC}
                <button onClick={() => onSelectVC?.('')} className="hover:text-a24-accent"><X className="w-3 h-3" /></button>
              </span>
            )}
            {(['role', 'region', 'type', 'sector', 'backer'] as const).map((key) => {
              const value = filters[key]
              if (!value) return null
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-a24-text dark:text-a24-dark-text border border-a24-border dark:border-a24-dark-border"
                >
                  {value}
                  <button onClick={() => clearFilter(key)} className="hover:text-a24-accent"><X className="w-3 h-3" /></button>
                </span>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
