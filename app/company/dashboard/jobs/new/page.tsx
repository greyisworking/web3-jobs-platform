'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']
const CATEGORIES = [
  'Engineering', 'Design', 'Product', 'Marketing', 'Operations',
  'Sales', 'Finance', 'Legal', 'HR', 'Community', 'Research', 'Other'
]
const REGIONS = ['Global', 'Korea', 'Asia', 'Americas', 'Europe']

export default function NewJobPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    location: '',
    type: 'Full-time',
    category: 'Engineering',
    region: 'Global',
    salary: '',
    description: '',
    url: '',
    tags: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id)
        .single()

      if (!company) throw new Error('Company not found')

      const { error } = await supabase.from('Job').insert({
        title: form.title,
        company: company.name,
        company_id: company.id,
        location: form.location,
        type: form.type,
        category: form.category,
        region: form.region,
        salary: form.salary || null,
        description: form.description || null,
        url: form.url || `https://neun.wtf/jobs/apply/${Date.now()}`,
        tags: form.tags ? JSON.stringify(form.tags.split(',').map(t => t.trim())) : null,
        source: 'direct',
        isActive: true,
        status: 'active',
        view_count: 0,
        apply_count: 0,
      })

      if (error) throw error

      toast.success('Job posted successfully!')
      router.push('/company/dashboard/jobs')
    } catch (error) {
      console.error('Failed to post job:', error)
      toast.error('Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/company/dashboard/jobs"
          className="inline-flex items-center gap-2 text-a24-muted hover:text-a24-text transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold text-a24-text">Post New Job</h1>
        <p className="text-a24-muted text-sm mt-1">
          Create a new job listing for your company
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-a24-surface border border-a24-border p-6 space-y-4">
          <h2 className="text-lg font-medium text-a24-text mb-4">Basic Information</h2>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Senior Smart Contract Developer"
              required
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-purple-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Remote, Seoul, San Francisco"
                required
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Region *
              </label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text focus:border-purple-500 outline-none"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Job Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text focus:border-purple-500 outline-none"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text focus:border-purple-500 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Salary Range (Optional)
            </label>
            <input
              type="text"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              placeholder="e.g., $120k - $180k, Competitive"
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-a24-surface border border-a24-border p-6 space-y-4">
          <h2 className="text-lg font-medium text-a24-text mb-4">Job Details</h2>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the role, responsibilities, requirements..."
              rows={8}
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-purple-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Application URL (Optional)
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://your-company.com/jobs/apply"
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-purple-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use default NEUN apply page
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g., Solidity, DeFi, NFT, Web3 (comma separated)"
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/company/dashboard/jobs"
            className="px-6 py-3 text-a24-muted hover:text-a24-text transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-a24-text font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  )
}
