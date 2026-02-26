'use client'

import { useState } from 'react'
import NSelect from './NSelect'

const BADGE_OPTIONS = ['Verified', 'Web3 Perks', 'Pre-IPO', 'Remote', 'Active', 'English'] as const
const BACKER_OPTIONS = ['Hashed', 'a16z', 'Paradigm', 'Kakao', 'Kakao Ventures', 'Dunamu', 'Animoca Brands', 'SoftBank', 'Binance', 'LINE Corporation', 'Mirae Asset', 'KB Investment', 'Wemade'] as const

interface FilterProps {
  onFilterChange: (filters: Filters) => void
}

export interface Filters {
  search: string
  region: string
  type: string
  location: string
  source: string
  badge: string
  backer: string
}

export default function JobFilters({ onFilterChange }: FilterProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    region: '',
    type: '',
    location: '',
    source: '',
    badge: '',
    backer: '',
  })

  const handleChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters: Filters = {
      search: '',
      region: '',
      type: '',
      location: '',
      source: '',
      badge: '',
      backer: '',
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <div className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Filter Jobs
        </h2>
        <button
          onClick={handleReset}
          className="text-sm text-neun-primary hover:text-neun-primary-hover"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Job title or company..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-neun-primary dark:bg-white/10 dark:text-white"
          />
        </div>

        {/* Region */}
        <div>
          <NSelect
            value={filters.region}
            onChange={(v) => handleChange('region', v)}
            label="Region"
            options={[
              { value: '', label: 'All' },
              { value: 'Global', label: 'Global' },
              { value: 'Korea', label: 'Korea' },
            ]}
          />
        </div>

        {/* Job Type */}
        <div>
          <NSelect
            value={filters.type}
            onChange={(v) => handleChange('type', v)}
            label="Job Type"
            options={[
              { value: '', label: 'All' },
              { value: 'Full-time', label: 'Full-time' },
              { value: 'Part-time', label: 'Part-time' },
              { value: 'Contract', label: 'Contract' },
              { value: 'Internship', label: 'Internship' },
            ]}
          />
        </div>

        {/* Location */}
        <div>
          <NSelect
            value={filters.location}
            onChange={(v) => handleChange('location', v)}
            label="Location"
            options={[
              { value: '', label: 'All' },
              { value: 'Remote', label: 'Remote' },
              { value: 'Seoul', label: 'Seoul' },
              { value: 'Hybrid', label: 'Hybrid' },
              { value: 'On-site', label: 'On-site' },
            ]}
          />
        </div>

        {/* Source */}
        <div>
          <NSelect
            value={filters.source}
            onChange={(v) => handleChange('source', v)}
            label="Source"
            options={[
              { value: '', label: 'All' },
              { value: 'web3.career', label: 'web3.career' },
              { value: 'web3jobs.cc', label: 'web3jobs.cc' },
              { value: 'web3kr.jobs', label: 'web3kr.jobs' },
              { value: 'cryptojobslist.com', label: 'cryptojobslist.com' },
              { value: 'wanted.co.kr', label: 'wanted.co.kr' },
              { value: 'remote3.co', label: 'remote3.co' },
              { value: 'remoteok.com', label: 'remoteok.com' },
              { value: 'rocketpunch.com', label: 'rocketpunch.com' },
              { value: 'jobs.sui.io', label: 'sui jobs' },
              { value: 'jobs.solana.com', label: 'solana jobs' },
              { value: 'ethereum.foundation', label: 'ethereum foundation' },
              { value: 'priority:wanted', label: 'priority:wanted' },
              { value: 'priority:lever', label: 'priority:lever' },
              { value: 'priority:greenhouse', label: 'priority:greenhouse' },
            ]}
          />
        </div>

        {/* Badge */}
        <div>
          <NSelect
            value={filters.badge}
            onChange={(v) => handleChange('badge', v)}
            label="Badge"
            placeholder="All Badges"
            options={[
              { value: '', label: 'All Badges' },
              ...BADGE_OPTIONS.map((b) => ({ value: b, label: b })),
            ]}
          />
        </div>

        {/* Backer */}
        <div>
          <NSelect
            value={filters.backer}
            onChange={(v) => handleChange('backer', v)}
            label="Backer"
            placeholder="All Backers"
            options={[
              { value: '', label: 'All Backers' },
              ...BACKER_OPTIONS.map((b) => ({ value: b, label: b })),
            ]}
          />
        </div>
      </div>

      {/* Active filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.search && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neun-primary/10 text-neun-primary rounded-full text-sm">
            Search: {filters.search}
            <button onClick={() => handleChange('search', '')} className="ml-1 hover:opacity-70" aria-label="Clear search filter">×</button>
          </span>
        )}
        {filters.region && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neun-primary/10 text-neun-primary rounded-full text-sm">
            {filters.region}
            <button onClick={() => handleChange('region', '')} className="ml-1 hover:opacity-70" aria-label="Clear region filter">×</button>
          </span>
        )}
        {filters.type && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neun-primary/10 text-neun-primary rounded-full text-sm">
            {filters.type}
            <button onClick={() => handleChange('type', '')} className="ml-1 hover:opacity-70" aria-label="Clear type filter">×</button>
          </span>
        )}
        {filters.location && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neun-primary/10 text-neun-primary rounded-full text-sm">
            {filters.location}
            <button onClick={() => handleChange('location', '')} className="ml-1 hover:opacity-70" aria-label="Clear location filter">×</button>
          </span>
        )}
        {filters.source && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neun-primary/10 text-neun-primary rounded-full text-sm">
            {filters.source}
            <button onClick={() => handleChange('source', '')} className="ml-1 hover:opacity-70" aria-label="Clear source filter">×</button>
          </span>
        )}
        {filters.badge && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neun-primary/10 text-neun-primary rounded-full text-sm">
            Badge: {filters.badge}
            <button onClick={() => handleChange('badge', '')} className="ml-1 hover:opacity-70" aria-label="Clear badge filter">×</button>
          </span>
        )}
        {filters.backer && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neun-primary/10 text-neun-primary rounded-full text-sm">
            Backer: {filters.backer}
            <button onClick={() => handleChange('backer', '')} className="ml-1 hover:opacity-70" aria-label="Clear backer filter">×</button>
          </span>
        )}
      </div>
    </div>
  )
}
