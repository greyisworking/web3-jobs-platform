'use client'

import { useState } from 'react'

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
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-white/10 dark:text-white"
          />
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Region
          </label>
          <select
            value={filters.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-white/10 dark:text-white"
          >
            <option value="">All</option>
            <option value="Global">Global</option>
            <option value="Korea">Korea</option>
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-white/10 dark:text-white"
          >
            <option value="">All</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-white/10 dark:text-white"
          >
            <option value="">All</option>
            <option value="Remote">Remote</option>
            <option value="Seoul">Seoul</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source
          </label>
          <select
            value={filters.source}
            onChange={(e) => handleChange('source', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-white/10 dark:text-white"
          >
            <option value="">All</option>
            <option value="web3.career">web3.career</option>
            <option value="web3jobs.cc">web3jobs.cc</option>
            <option value="web3kr.jobs">web3kr.jobs</option>
            <option value="cryptojobslist.com">cryptojobslist.com</option>
            <option value="wanted.co.kr">wanted.co.kr</option>
            <option value="remote3.co">remote3.co</option>
            <option value="remoteok.com">remoteok.com</option>
            <option value="rocketpunch.com">rocketpunch.com</option>
            <option value="jobs.sui.io">sui jobs</option>
            <option value="jobs.solana.com">solana jobs</option>
            <option value="ethereum.foundation">ethereum foundation</option>
            <option value="priority:wanted">priority:wanted</option>
            <option value="priority:lever">priority:lever</option>
            <option value="priority:greenhouse">priority:greenhouse</option>
          </select>
        </div>

        {/* Badge */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Badge
          </label>
          <select
            value={filters.badge}
            onChange={(e) => handleChange('badge', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-white/10 dark:text-white"
          >
            <option value="">All Badges</option>
            {BADGE_OPTIONS.map((badge) => (
              <option key={badge} value={badge}>
                {badge}
              </option>
            ))}
          </select>
        </div>

        {/* Backer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Backer
          </label>
          <select
            value={filters.backer}
            onChange={(e) => handleChange('backer', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-white/10 dark:text-white"
          >
            <option value="">All Backers</option>
            {BACKER_OPTIONS.map((backer) => (
              <option key={backer} value={backer}>
                {backer}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.search && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            Search: {filters.search}
            <button onClick={() => handleChange('search', '')} className="ml-1 hover:text-blue-600">x</button>
          </span>
        )}
        {filters.region && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
            {filters.region}
            <button onClick={() => handleChange('region', '')} className="ml-1 hover:text-green-600">x</button>
          </span>
        )}
        {filters.type && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
            {filters.type}
            <button onClick={() => handleChange('type', '')} className="ml-1 hover:text-purple-600">x</button>
          </span>
        )}
        {filters.location && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
            {filters.location}
            <button onClick={() => handleChange('location', '')} className="ml-1 hover:text-yellow-600">x</button>
          </span>
        )}
        {filters.source && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-sm">
            {filters.source}
            <button onClick={() => handleChange('source', '')} className="ml-1 hover:text-pink-600">x</button>
          </span>
        )}
        {filters.badge && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm">
            Badge: {filters.badge}
            <button onClick={() => handleChange('badge', '')} className="ml-1 hover:text-indigo-600">x</button>
          </span>
        )}
        {filters.backer && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 rounded-full text-sm">
            Backer: {filters.backer}
            <button onClick={() => handleChange('backer', '')} className="ml-1 hover:text-violet-600">x</button>
          </span>
        )}
      </div>
    </div>
  )
}
