'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import JobFilters, { Filters } from './components/JobFilters'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  category: string
  url: string
  salary: string | null
  source: string
  region: string
  postedDate: Date | null
}

interface Stats {
  total: number
  global: number
  korea: number
  sources: { source: string; _count: number }[]
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    global: 0,
    korea: 0,
    sources: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const data = await response.json()
      setJobs(data.jobs)
      setFilteredJobs(data.jobs)
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filters: Filters) => {
    let filtered = [...jobs]

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower)
      )
    }

    // 지역 필터
    if (filters.region) {
      filtered = filtered.filter((job) => job.region === filters.region)
    }

    // 근무 방식 필터
    if (filters.type) {
      filtered = filtered.filter((job) => job.type.includes(filters.type))
    }

    // 위치 필터
    if (filters.location) {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // 출처 필터
    if (filters.source) {
      filtered = filtered.filter((job) => job.source === filters.source)
    }

    setFilteredJobs(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            🌐 Web3 Jobs Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            글로벌 & 국내 Web3 채용 공고를 한곳에서
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <JobFilters onFilterChange={handleFilterChange} />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              전체 공고
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {stats.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              글로벌
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.global}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              국내
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {stats.korea}
            </p>
          </div>
        </div>

        {/* Source Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            📊 사이트별 통계
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.sources.map((source) => (
              <div key={source.source} className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {source.source}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {source._count}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                💼 최신 채용 공고
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredJobs.length}개의 공고
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {jobs.length === 0 ? (
                  <>
                    아직 크롤링된 채용 공고가 없습니다. <br />
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-2 inline-block">
                      npm run crawl
                    </code>{' '}
                    명령어로 데이터를 수집하세요.
                  </>
                ) : (
                  '선택한 필터에 맞는 채용 공고가 없습니다.'
                )}
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        🏢 {job.company}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                          📍 {job.location}
                        </span>
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
                          💼 {job.type}
                        </span>
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full">
                          🌐 {job.region}
                        </span>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full">
                          📡 {job.source}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      지원하기 →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>40+ 사이트에서 자동 수집 | 매일 업데이트</p>
        </div>
      </footer>
    </div>
  )
}
