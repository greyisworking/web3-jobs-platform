'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import {
  Plus, Eye, Users, Edit, Trash2, ToggleLeft, ToggleRight, Search
} from 'lucide-react'
import Pixelbara from '@/app/components/Pixelbara'
import { toast } from 'sonner'

interface Job {
  id: string
  title: string
  location: string
  type: string
  category: string
  salary: string | null
  view_count: number
  apply_count: number
  isActive: boolean
  created_at: string
}

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const supabase = createSupabaseBrowserClient()

  const fetchJobs = async () => {
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

      let query = supabase
        .from('Job')
        .select('id, title, location, type, category, salary, view_count, apply_count, isActive, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (filter === 'active') {
        query = query.eq('isActive', true)
      } else if (filter === 'inactive') {
        query = query.eq('isActive', false)
      }

      const { data } = await query
      setJobs(data || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [filter])

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('Job')
        .update({ isActive: !currentStatus })
        .eq('id', jobId)

      setJobs(jobs.map(j =>
        j.id === jobId ? { ...j, isActive: !currentStatus } : j
      ))

      toast.success(currentStatus ? 'Job deactivated' : 'Job activated')
    } catch {
      toast.error('Failed to update job status')
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await supabase.from('Job').delete().eq('id', jobId)
      setJobs(jobs.filter(j => j.id !== jobId))
      toast.success('Job deleted')
    } catch {
      toast.error('Failed to delete job')
    }
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Jobs</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your job postings
          </p>
        </div>
        <Link
          href="/company/dashboard/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-white truncate">{job.title}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium ${
                      job.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>{job.location}</span>
                  <span>{job.type}</span>
                  {job.salary && <span>{job.salary}</span>}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {job.view_count || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {job.apply_count || 0} applies
                  </span>
                  <span>
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => toggleJobStatus(job.id, job.isActive)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title={job.isActive ? 'Deactivate' : 'Activate'}
                >
                  {job.isActive ? (
                    <ToggleRight className="w-5 h-5 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>
                <Link
                  href={`/company/dashboard/jobs/${job.id}/edit`}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Pixelbara pose="search" size={100} />
          <h3 className="text-lg font-medium text-white mt-4">No jobs found</h3>
          <p className="text-gray-400 mt-1">
            {search ? 'Try a different search term' : 'Post your first job to get started'}
          </p>
          {!search && (
            <Link
              href="/company/dashboard/jobs/new"
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
            >
              Post New Job
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
