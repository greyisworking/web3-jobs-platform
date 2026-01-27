'use client'

import { useState } from 'react'

interface FilterProps {
  onFilterChange: (filters: Filters) => void
}

export interface Filters {
  search: string
  region: string
  type: string
  location: string
  source: string
}

export default function JobFilters({ onFilterChange }: FilterProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    region: '',
    type: '',
    location: '',
    source: '',
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
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          🔍 필터
        </h2>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          초기화
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 검색 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            검색
          </label>
          <input
            type="text"
            placeholder="직무, 회사명 검색..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 지역 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            지역
          </label>
          <select
            value={filters.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">전체</option>
            <option value="Global">글로벌</option>
            <option value="Korea">국내</option>
          </select>
        </div>

        {/* 근무 방식 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            근무 방식
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">전체</option>
            <option value="Full-time">정규직 (Full-time)</option>
            <option value="Part-time">계약직 (Part-time)</option>
            <option value="Contract">프리랜서 (Contract)</option>
            <option value="Internship">인턴 (Internship)</option>
          </select>
        </div>

        {/* 위치 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            위치
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">전체</option>
            <option value="Remote">원격 (Remote)</option>
            <option value="서울">서울</option>
            <option value="부산">부산</option>
            <option value="경기">경기</option>
            <option value="인천">인천</option>
            <option value="대전">대전</option>
            <option value="대구">대구</option>
            <option value="광주">광주</option>
            <option value="울산">울산</option>
            <option value="세종">세종</option>
            <option value="Hybrid">하이브리드 (Hybrid)</option>
            <option value="On-site">온사이트 (On-site)</option>
          </select>
        </div>

        {/* 출처 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            출처 사이트
          </label>
          <select
            value={filters.source}
            onChange={(e) => handleChange('source', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">전체</option>
            <option value="web3.career">web3.career</option>
            <option value="web3jobs.cc">web3jobs.cc</option>
            <option value="web3kr.jobs">web3kr.jobs</option>
            <option value="cryptojobslist.com">cryptojobslist.com</option>
            <option value="wanted.co.kr">wanted.co.kr</option>
            <option value="remote3.co">remote3.co</option>
            <option value="remoteok.com">remoteok.com</option>
            <option value="rocketpunch.com">rocketpunch.com</option>
            <option value="jobkorea.co.kr">jobkorea.co.kr</option>
            <option value="jobs.sui.io">sui jobs</option>
            <option value="jobs.solana.com">solana jobs</option>
            <option value="ethereum.foundation">ethereum foundation</option>
          </select>
        </div>
      </div>

      {/* 활성 필터 표시 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.search && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            검색: {filters.search}
            <button
              onClick={() => handleChange('search', '')}
              className="ml-1 hover:text-blue-600"
            >
              ×
            </button>
          </span>
        )}
        {filters.region && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
            {filters.region}
            <button
              onClick={() => handleChange('region', '')}
              className="ml-1 hover:text-green-600"
            >
              ×
            </button>
          </span>
        )}
        {filters.type && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
            {filters.type}
            <button
              onClick={() => handleChange('type', '')}
              className="ml-1 hover:text-purple-600"
            >
              ×
            </button>
          </span>
        )}
        {filters.location && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
            {filters.location}
            <button
              onClick={() => handleChange('location', '')}
              className="ml-1 hover:text-yellow-600"
            >
              ×
            </button>
          </span>
        )}
        {filters.source && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-sm">
            {filters.source}
            <button
              onClick={() => handleChange('source', '')}
              className="ml-1 hover:text-pink-600"
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  )
}
