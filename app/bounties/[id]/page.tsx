'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Users, Zap, ExternalLink, CheckCircle, XCircle,
  Send, Trophy, AlertCircle, Link as LinkIcon
} from 'lucide-react'
import SubpageHeader from '../../components/SubpageHeader'
import Footer from '../../components/Footer'
import Pixelbara from '../../components/Pixelbara'
import Blockies, { truncateAddress } from '../../components/Blockies'
import { WalletConnect } from '../../components/WalletConnect'
import { toast } from 'sonner'
import type { Bounty } from '@/types/web3'

interface Submission {
  id: string
  hunter_address: string
  hunter_ens?: string
  submission_url?: string
  description?: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}

export default function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  const [submitForm, setSubmitForm] = useState({
    submission_url: '',
    description: '',
  })

  const fetchBounty = useCallback(async () => {
    try {
      const res = await fetch(`/api/bounties/${id}`)
      const data = await res.json()

      if (data.bounty) {
        setBounty(data.bounty)
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Failed to fetch bounty:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBounty()
  }, [fetchBounty])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast.error('Connect wallet first')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/bounties/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hunter_address: address,
          ...submitForm,
        }),
      })

      const data = await res.json()

      if (data.submission) {
        toast.success('Submission received! 🎯')
        setShowSubmitForm(false)
        setSubmitForm({ submission_url: '', description: '' })
        fetchBounty()
      } else {
        throw new Error(data.error || 'Failed to submit')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const getTimeLeft = (deadline: string | null) => {
    if (!deadline) return 'No deadline'
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days} days left`
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `${hours} hours left`
  }

  const isPoster = bounty && address?.toLowerCase() === bounty.poster_address.toLowerCase()
  const hasSubmitted = submissions.some(s => s.hunter_address.toLowerCase() === address?.toLowerCase())
  const canSubmit = bounty?.status === 'open' || bounty?.status === 'in_progress'

  if (loading) {
    return (
      <div className="min-h-screen bg-a24-bg">
        <div className="max-w-6xl mx-auto px-6">
          <SubpageHeader title="B O U N T Y" />
        </div>
        <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
          <div className="text-center">
            <Pixelbara pose="loading" size={100} className="mx-auto mb-4" />
            <p className="text-a24-muted">Loading bounty...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-a24-bg">
        <div className="max-w-6xl mx-auto px-6">
          <SubpageHeader title="B O U N T Y" />
        </div>
        <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
          <div className="text-center">
            <Pixelbara pose="question" size={120} className="mx-auto mb-4" />
            <p className="text-lg text-a24-text mb-2">Bounty not found</p>
            <p className="text-sm text-a24-muted mb-6">ngmi. this bounty does not exist</p>
            <Link
              href="/bounties"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-a24-text hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bounties
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg">
      <div className="max-w-6xl mx-auto px-6">
        <SubpageHeader title="B O U N T Y" />
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        {/* Back Link */}
        <Link
          href="/bounties"
          className="inline-flex items-center gap-2 text-a24-muted hover:text-a24-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bounties
        </Link>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-a24-surface border border-a24-border p-6">
              <div className="flex items-center gap-2 mb-3">
                {bounty.category && (
                  <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs uppercase tracking-wider">
                    {bounty.category}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs uppercase tracking-wider ${
                  bounty.status === 'open'
                    ? 'bg-green-500/20 text-green-400'
                    : bounty.status === 'in_progress'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : bounty.status === 'completed'
                        ? 'bg-gray-500/20 text-a24-muted'
                        : 'bg-red-500/20 text-red-400'
                }`}>
                  {bounty.status.replace('_', ' ')}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-a24-text mb-4">{bounty.title}</h1>

              <div className="flex items-center gap-4 text-sm text-a24-muted">
                <span className="flex items-center gap-1">
                  <Blockies address={bounty.poster_address} size={16} />
                  Posted by {bounty.poster_ens || truncateAddress(bounty.poster_address)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getTimeLeft(bounty.deadline)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {bounty.submissions_count} submissions
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-a24-surface border border-a24-border p-6">
              <h2 className="text-sm uppercase tracking-wider text-a24-muted mb-4">Description</h2>
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{bounty.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {bounty.requirements && (
              <div className="bg-a24-surface border border-a24-border p-6">
                <h2 className="text-sm uppercase tracking-wider text-a24-muted mb-4">Requirements</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{bounty.requirements}</p>
              </div>
            )}

            {/* Submission Requirements */}
            {bounty.submission_requirements && (
              <div className="bg-a24-surface border border-a24-border p-6">
                <h2 className="text-sm uppercase tracking-wider text-a24-muted mb-4">What to Submit</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{bounty.submission_requirements}</p>
              </div>
            )}

            {/* Skills */}
            {bounty.skills && bounty.skills.length > 0 && (
              <div className="bg-a24-surface border border-a24-border p-6">
                <h2 className="text-sm uppercase tracking-wider text-a24-muted mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {bounty.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-gray-800 text-gray-300 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submissions (for poster only) */}
            {isPoster && submissions.length > 0 && (
              <div className="bg-a24-surface border border-a24-border p-6">
                <h2 className="text-sm uppercase tracking-wider text-a24-muted mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Submissions ({submissions.length})
                </h2>
                <div className="space-y-4">
                  {submissions.map(sub => (
                    <div
                      key={sub.id}
                      className="p-4 bg-gray-800/50 border border-a24-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Blockies address={sub.hunter_address} size={24} />
                          <span className="text-a24-text font-medium">
                            {sub.hunter_ens || truncateAddress(sub.hunter_address)}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs ${
                          sub.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : sub.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-a24-muted'
                        }`}>
                          {sub.status}
                        </span>
                      </div>

                      {sub.description && (
                        <p className="text-sm text-a24-muted mb-2">{sub.description}</p>
                      )}

                      {sub.submission_url && (
                        <a
                          href={sub.submission_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                        >
                          <LinkIcon className="w-3 h-3" />
                          View Submission
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {sub.status === 'pending' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-a24-border">
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-a24-text text-xs"
                            onClick={() => toast.info('Approval coming soon')}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-a24-text text-xs"
                            onClick={() => toast.info('Rejection coming soon')}
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Reward Card */}
            <div className="bg-a24-surface border border-a24-border p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold text-green-400 mb-2">
                  <Zap className="w-6 h-6" />
                  {bounty.reward_amount} {bounty.reward_token}
                </div>
                <p className="text-xs text-a24-muted uppercase tracking-wider">Bounty Reward</p>
              </div>

              {!isConnected ? (
                <div className="text-center">
                  <p className="text-sm text-a24-muted mb-4">Connect wallet to submit</p>
                  <WalletConnect />
                </div>
              ) : isPoster ? (
                <div className="text-center">
                  <p className="text-sm text-a24-muted mb-2">This is your bounty</p>
                  <p className="text-xs text-a24-muted">Review submissions above</p>
                </div>
              ) : hasSubmitted ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Submitted!</span>
                  </div>
                  <p className="text-xs text-a24-muted">Your submission is being reviewed</p>
                </div>
              ) : canSubmit ? (
                showSubmitForm ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs text-a24-muted mb-1">Submission URL</label>
                      <input
                        type="url"
                        value={submitForm.submission_url}
                        onChange={e => setSubmitForm(f => ({ ...f, submission_url: e.target.value }))}
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-2 bg-gray-800 border border-a24-border text-a24-text text-sm focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-a24-muted mb-1">Description</label>
                      <textarea
                        value={submitForm.description}
                        onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe your submission..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800 border border-a24-border text-a24-text text-sm focus:border-green-500 focus:outline-none resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSubmitForm(false)}
                        className="flex-1 py-2 bg-gray-800 text-a24-muted text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2 bg-green-500 text-black font-medium text-sm hover:bg-green-600 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <motion.button
                    onClick={() => setShowSubmitForm(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-black font-bold flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Work
                  </motion.button>
                )
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-a24-muted mx-auto mb-2" />
                  <p className="text-sm text-a24-muted">
                    This bounty is {bounty.status === 'completed' ? 'completed' : 'closed'}
                  </p>
                </div>
              )}
            </div>

            {/* External Link */}
            {bounty.external_url && (
              <a
                href={bounty.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-4 bg-a24-surface border border-a24-border text-a24-muted hover:text-a24-text hover:border-a24-border transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View External Resource
              </a>
            )}

            {/* Pixelbara */}
            <div className="text-center">
              <Pixelbara pose="diamondHands" size={100} className="mx-auto" />
              <p className="text-xs text-gray-600 italic mt-2">
                &quot;get that bread ser&quot;
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
