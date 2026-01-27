'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import JobFilters, { Filters } from './components/JobFilters'
import { BADGE_CONFIG, type BadgeValue } from '@/lib/badges'

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
  backers?: string[] | null
  sector?: string | null
  office_location?: string | null
  badges?: string[] | null
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

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower)
      )
    }

    if (filters.region) {
      filtered = filtered.filter((job) => job.region === filters.region)
    }

    if (filters.type) {
      filtered = filtered.filter((job) => job.type.includes(filters.type))
    }

    if (filters.location) {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    if (filters.source) {
      filtered = filtered.filter((job) => job.source === filters.source)
    }

    if (filters.badge) {
      filtered = filtered.filter((job) => job.badges?.includes(filters.badge))
    }

    if (filters.backer) {
      filtered = filtered.filter((job) => job.backers?.includes(filters.backer))
    }

    setFilteredJobs(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
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
            Web3 Jobs Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Find Web3 jobs from global and Korean sources
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
              Total Jobs
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {stats.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Global
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.global}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Korea
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {stats.korea}
            </p>
          </div>
        </div>

        {/* Source Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Jobs by Source
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
                Latest Jobs
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredJobs.length} jobs
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {jobs.length === 0 ? (
                  <>
                    No jobs found yet. <br />
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-2 inline-block">
                      npm run crawl
                    </code>{' '}
                    to collect job data.
                  </>
                ) : (
                  'No jobs match your filters. Try adjusting your search criteria.'
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        {job.company}
                      </p>
                      {job.backers && job.backers.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                          Backed by {job.backers.join(', ')}
                        </p>
                      )}
                      {/* Badges */}
                      {job.badges && job.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {job.badges.map((b) => {
                            const config = BADGE_CONFIG[b as BadgeValue]
                            return (
                              <span
                                key={b}
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${config?.bg ?? 'bg-gray-100 dark:bg-gray-700'} ${config?.text ?? 'text-gray-800 dark:text-gray-200'}`}
                              >
                                {b}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                          {job.location}
                        </span>
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
                          {job.type}
                        </span>
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full">
                          {job.region}
                        </span>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full">
                          {job.source}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      Apply
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
          <p>Aggregating jobs from 40+ sources | Updated every 3 hours</p>
        </div>
      </footer>
    </div>
  )
}
