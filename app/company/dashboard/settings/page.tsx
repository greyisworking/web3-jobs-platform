'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Save, Building2 } from 'lucide-react'
import { toast } from 'sonner'

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']
const INDUSTRIES = [
  'DeFi', 'NFT/Gaming', 'Infrastructure', 'DAO/Governance',
  'Security', 'Analytics', 'Exchange', 'Wallet', 'Other'
]

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    website: '',
    description: '',
    industry: '',
    size: '',
    location: '',
    founded_year: '',
    logo_url: '',
  })
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (company) {
          setForm({
            name: company.name || '',
            website: company.website || '',
            description: company.description || '',
            industry: company.industry || '',
            size: company.size || '',
            location: company.location || '',
            founded_year: company.founded_year?.toString() || '',
            logo_url: company.logo_url || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch company:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('companies')
        .update({
          name: form.name,
          website: form.website || null,
          description: form.description || null,
          industry: form.industry || null,
          size: form.size || null,
          location: form.location || null,
          founded_year: form.founded_year ? parseInt(form.founded_year) : null,
          logo_url: form.logo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-a24-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-a24-text">Company Settings</h1>
        <p className="text-a24-muted text-sm mt-1">
          Update your company profile information
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-a24-surface border border-a24-border p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neun-success/20 text-neun-success">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-medium text-a24-text">Company Profile</h2>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-neun-success outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Website
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://your-company.com"
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-neun-success outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://your-company.com/logo.png"
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-neun-success outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tell candidates about your company..."
              rows={4}
              className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-neun-success outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Industry
              </label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text focus:border-neun-success outline-none"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Company Size
              </label>
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text focus:border-neun-success outline-none"
              >
                <option value="">Select size</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., San Francisco, Remote"
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-neun-success outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Founded Year
              </label>
              <input
                type="number"
                value={form.founded_year}
                onChange={(e) => setForm({ ...form, founded_year: e.target.value })}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 bg-a24-surface border border-a24-border text-a24-text placeholder-a24-muted focus:border-neun-success outline-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-neun-success hover:bg-neun-success/90 disabled:opacity-50 text-a24-text font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
