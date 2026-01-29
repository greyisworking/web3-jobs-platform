'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import {
  Eye, Users, TrendingUp, TrendingDown, BarChart3, Calendar
} from 'lucide-react'
import Pixelbara from '@/app/components/Pixelbara'

interface JobStats {
  id: string
  title: string
  view_count: number
  apply_count: number
  conversion: number
  isActive: boolean
  created_at: string
}

interface OverallStats {
  totalViews: number
  totalApplies: number
  avgConversion: number
  viewsTrend: number
  appliesTrend: number
}

export default function CompanyAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [jobStats, setJobStats] = useState<JobStats[]>([])
  const [overall, setOverall] = useState<OverallStats>({
    totalViews: 0,
    totalApplies: 0,
    avgConversion: 0,
    viewsTrend: 0,
    appliesTrend: 0,
  })
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d')
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!company) return

        const { data: jobs } = await supabase
          .from('Job')
          .select('id, title, view_count, apply_count, isActive, created_at')
          .eq('company_id', company.id)
          .order('view_count', { ascending: false })

        if (jobs) {
          const stats: JobStats[] = jobs.map(job => ({
            ...job,
            view_count: job.view_count || 0,
            apply_count: job.apply_count || 0,
            conversion: job.view_count > 0
              ? (job.apply_count / job.view_count) * 100
              : 0,
          }))

          setJobStats(stats)

          const totalViews = stats.reduce((sum, j) => sum + j.view_count, 0)
          const totalApplies = stats.reduce((sum, j) => sum + j.apply_count, 0)

          setOverall({
            totalViews,
            totalApplies,
            avgConversion: totalViews > 0 ? (totalApplies / totalViews) * 100 : 0,
            viewsTrend: 12.5, // Mock data - would need historical data
            appliesTrend: 8.3,
          })
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track your job posting performance
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 text-blue-400">
              <Eye className="w-5 h-5" />
            </div>
            {overall.viewsTrend > 0 && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                +{overall.viewsTrend}%
              </div>
            )}
          </div>
          <p className="text-3xl font-bold text-white">{overall.totalViews.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Views</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            {overall.appliesTrend > 0 && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                +{overall.appliesTrend}%
              </div>
            )}
          </div>
          <p className="text-3xl font-bold text-white">{overall.totalApplies.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Applications</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 text-green-400">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{overall.avgConversion.toFixed(1)}%</p>
          <p className="text-sm text-gray-400 mt-1">Avg. Conversion Rate</p>
        </div>
      </div>

      {/* Job Performance Table */}
      <div className="bg-gray-900/50 border border-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Job Performance</h2>

        {jobStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-800">
                  <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Job Title
                  </th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium text-right">
                    Views
                  </th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium text-right">
                    Applications
                  </th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium text-right">
                    Conversion
                  </th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {jobStats.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-800/30">
                    <td className="py-4">
                      <p className="text-white font-medium">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 text-right text-white">
                      {job.view_count.toLocaleString()}
                    </td>
                    <td className="py-4 text-right text-white">
                      {job.apply_count.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`${
                          job.conversion >= 5
                            ? 'text-green-400'
                            : job.conversion >= 2
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                        }`}
                      >
                        {job.conversion.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`px-2 py-1 text-xs font-medium ${
                          job.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Pixelbara pose="question" size={80} />
            <p className="text-gray-400 mt-4">No job data available yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Post jobs to start tracking analytics
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-purple-600/10 border border-purple-600/20 p-6">
        <h3 className="text-lg font-medium text-purple-400 mb-3">
          Tips to improve performance
        </h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>Use clear, specific job titles that candidates search for</li>
          <li>Include salary range to attract more qualified applicants</li>
          <li>Add relevant tags to improve job visibility</li>
          <li>Keep job descriptions concise but informative</li>
          <li>Update inactive listings to keep them fresh</li>
        </ul>
      </div>
    </div>
  )
}
