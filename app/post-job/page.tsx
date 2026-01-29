'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Building2, Briefcase, MapPin, DollarSign, Code, Wallet, CheckCircle } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { toast } from 'sonner'
import Pixelbara from '../components/Pixelbara'
import { PRIORITY_COMPANIES } from '@/lib/priority-companies'
import { truncateAddress } from '../components/WalletConnect'

const SECTORS = [
  'DeFi',
  'Infrastructure',
  'Gaming / Metaverse',
  'NFT / Digital Art',
  'Layer 1',
  'Layer 2',
  'Exchange',
  'Analytics / Data',
  'VC / Investment',
  'DAO / Governance',
  'Other',
]

const REGIONS = [
  'Seoul, Korea',
  'Pangyo, Korea',
  'Remote',
  'Remote (Korea only)',
  'Singapore',
  'Global',
  'Other',
]

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']

// Connector info for display
const CONNECTOR_INFO: Record<string, { icon: string; label: string }> = {
  'injected': { icon: '🦊', label: 'MetaMask' },
  'metaMask': { icon: '🦊', label: 'MetaMask' },
  'walletConnect': { icon: '🔗', label: 'WalletConnect' },
  'coinbaseWalletSDK': { icon: '🔵', label: 'Coinbase' },
}

interface JobPostForm {
  companyName: string
  companyWebsite: string
  sector: string
  contactEmail: string
  jobTitle: string
  jobType: string
  location: string
  salaryRange: string
  description: string
  requirements: string
  techStack: string
  applyUrl: string
}

export default function PostJobPage() {
  const [form, setForm] = useState<JobPostForm>({
    companyName: '',
    companyWebsite: '',
    sector: '',
    contactEmail: '',
    jobTitle: '',
    jobType: 'Full-time',
    location: '',
    salaryRange: '',
    description: '',
    requirements: '',
    techStack: '',
    applyUrl: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Wallet hooks
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  // Check if company is in priority list
  const isPriorityCompany = PRIORITY_COMPANIES.some(
    (c) =>
      c.name.toLowerCase() === form.companyName.toLowerCase() ||
      c.aliases.some((a) => a.toLowerCase() === form.companyName.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/jobs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          walletAddress: address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit job')
      }

      setSubmitted(true)
      toast.success('Job posted successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to submit job. Please try again.')
      toast.error(err.message || 'Failed to submit job')
    } finally {
      setSubmitting(false)
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-2xl mx-auto px-6 pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Pixelbara pose="success" size={160} className="mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-a24-text dark:text-a24-dark-text mb-4">
              Job Posted!
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted mb-2">
              Your job is now live on NEUN Jobs
            </p>
            <p className="text-sm text-a24-muted/70 dark:text-a24-dark-muted/70 mb-2">
              Posted by: {truncateAddress(address!)}
            </p>
            {isPriorityCompany && (
              <p className="text-sm text-neun-success mb-4">
                VC-backed company - featured placement
              </p>
            )}
            <div className="flex gap-4 justify-center mt-8">
              <Link
                href="/careers"
                className="px-6 py-3 text-[11px] uppercase tracking-wider bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg"
              >
                Browse Jobs
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setForm({
                    companyName: '',
                    companyWebsite: '',
                    sector: '',
                    contactEmail: '',
                    jobTitle: '',
                    jobType: 'Full-time',
                    location: '',
                    salaryRange: '',
                    description: '',
                    requirements: '',
                    techStack: '',
                    applyUrl: '',
                  })
                }}
                className="px-6 py-3 text-[11px] uppercase tracking-wider border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text"
              >
                Post Another
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Not connected - show wallet connection prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-2xl mx-auto px-6 pt-24 pb-12">
          {/* Back link */}
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text mb-8 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Jobs
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Pixelbara pose="building" size={140} className="mx-auto mb-8" />

            <h1 className="text-2xl md:text-3xl font-bold text-a24-text dark:text-a24-dark-text mb-4">
              Connect Wallet to Post Job
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted mb-2">
              Wallet connection is required to post jobs
            </p>
            <p className="text-sm text-a24-muted/70 dark:text-a24-dark-muted/70 mb-8">
              Your wallet address will be displayed on the job posting
            </p>

            <div className="max-w-sm mx-auto space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-4">
                Select Wallet
              </p>
              {connectors.map((c) => {
                const info = CONNECTOR_INFO[c.id] || { icon: '🔗', label: c.name }
                return (
                  <button
                    key={c.uid}
                    onClick={() => connect({ connector: c })}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text transition-colors disabled:opacity-50"
                  >
                    <span className="text-xl">{info.icon}</span>
                    <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
                      {info.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-12 p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface/50 dark:bg-a24-dark-surface/50 max-w-md mx-auto">
              <h3 className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
                Why Wallet Required?
              </h3>
              <ul className="text-sm text-a24-muted dark:text-a24-dark-muted space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-neun-success mt-0.5 flex-shrink-0" />
                  <span>Instant posting - no admin approval needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-neun-success mt-0.5 flex-shrink-0" />
                  <span>Transparent - your wallet is shown on the job</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-neun-success mt-0.5 flex-shrink-0" />
                  <span>Accountability - reduces spam and scams</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-neun-success mt-0.5 flex-shrink-0" />
                  <span>Free for VC-backed companies</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Connected - show job form
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-12">
        {/* Back link */}
        <Link
          href="/careers"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Jobs
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-a24-text dark:text-a24-dark-text mb-2">
              Post a Job
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
              Reach the best web3 talent in Korea
            </p>
          </div>
          <Pixelbara pose="building" size={80} />
        </div>

        {/* Connected wallet info */}
        <div className="mb-6 p-4 bg-neun-success/10 border border-neun-success/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-neun-success" />
            <div>
              <p className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
                {truncateAddress(address!)}
              </p>
              <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
                Jobs will be posted from this wallet
              </p>
            </div>
          </div>
          <button
            onClick={() => disconnect()}
            className="text-[10px] uppercase tracking-wider text-a24-muted hover:text-red-500 transition-colors"
          >
            Disconnect
          </button>
        </div>

        {/* Priority company notice */}
        {isPriorityCompany && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
          >
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {form.companyName} is a VC-backed company - your job will be featured!
            </p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Info */}
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g., DSRV Labs"
                  className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={form.companyWebsite}
                    onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                    Sector *
                  </label>
                  <select
                    required
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                  >
                    <option value="">Select sector</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                  Contact Email (optional)
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="hr@company.com"
                  className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                />
              </div>
            </div>
          </section>

          {/* Job Details */}
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Job Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="e.g., Senior Blockchain Engineer"
                  className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                    Job Type *
                  </label>
                  <select
                    required
                    value={form.jobType}
                    onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                    className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location *
                  </label>
                  <select
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                  >
                    <option value="">Select location</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Salary Range (optional)
                </label>
                <input
                  type="text"
                  value={form.salaryRange}
                  onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                  placeholder="e.g., $80k-120k or negotiable"
                  className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-4">
              Job Description
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the role and responsibilities..."
                  className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                  Requirements *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="List the required skills and experience..."
                  className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2 flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  Tech Stack (optional)
                </label>
                <input
                  type="text"
                  value={form.techStack}
                  onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                  placeholder="e.g., Solidity, Rust, TypeScript, React"
                  className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
                />
              </div>
            </div>
          </section>

          {/* Apply URL */}
          <section>
            <div>
              <label className="block text-sm text-a24-text dark:text-a24-dark-text mb-2">
                Application URL (optional)
              </label>
              <input
                type="url"
                value={form.applyUrl}
                onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
                placeholder="https://yourcompany.com/careers/apply"
                className="w-full px-4 py-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border focus:border-a24-text dark:focus:border-a24-dark-text outline-none transition-colors text-a24-text dark:text-a24-dark-text"
              />
              <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted mt-2">
                If provided, candidates will be redirected to this URL to apply.
              </p>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-[12px] uppercase tracking-wider font-bold bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {submitting ? (
              'Posting...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Job Now
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-a24-muted/60 dark:text-a24-dark-muted/60">
            By posting, you agree to our guidelines.
            <br />
            Your job will be posted immediately from {truncateAddress(address!)}
            <br />
            Free for VC-backed companies. Others: $99/posting.
          </p>
        </form>
      </main>
    </div>
  )
}
