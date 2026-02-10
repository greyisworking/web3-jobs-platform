'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Clock, Users, Trophy, ArrowRight, Filter, Plus, Zap, ChevronDown,
  Code2, Palette, FileText, FlaskConical, MoreHorizontal
} from 'lucide-react'
import SubpageHeader from '../components/SubpageHeader'
import Footer from '../components/Footer'
import Pixelbara from '../components/Pixelbara'
import Blockies, { truncateAddress } from '../components/Blockies'
import type { Bounty, BountyHunter } from '@/types/web3'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: MoreHorizontal },
  { id: 'development', label: 'Dev', icon: Code2 },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'research', label: 'Research', icon: FlaskConical },
]

const STATUS_FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
]

export default function BountiesPage() {
  const { isConnected } = useAccount()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [leaderboard, setLeaderboard] = useState<BountyHunter[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('open')
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [bountiesRes, leaderboardRes] = await Promise.all([
          fetch(`/api/bounties?status=${status}&category=${category === 'all' ? '' : category}`),
          fetch('/api/bounties/leaderboard?limit=10'),
        ])

        const bountiesData = await bountiesRes.json()
        const leaderboardData = await leaderboardRes.json()

        setBounties(bountiesData.bounties || [])
        setLeaderboard(leaderboardData.hunters || [])
      } catch (error) {
        console.error('Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [category, status])

  const formatReward = (amount: number, token: string) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k ${token}`
    }
    return `${amount} ${token}`
  }

  const getTimeLeft = (deadline: string | null) => {
    if (!deadline) return 'No deadline'
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days}d left`
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `${hours}h left`
  }

  return (
    <div className="min-h-screen bg-a24-bg">
      <div className="max-w-6xl mx-auto px-6">
        <SubpageHeader title="B O U N T I E S" />
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {/* Hero */}
        <div className="py-12 border-b border-a24-border mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-green-400 mb-2">
                Get Paid in Crypto
              </p>
              <h2 className="text-3xl font-bold text-a24-text mb-2">
                Bounty Hunting Szn
              </h2>
              <p className="text-a24-muted max-w-md">
                Complete tasks, earn crypto. On-chain escrow ensures you get paid.
              </p>
            </div>
            <div className="relative">
              <Pixelbara pose="diamondHands" size={120} />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 text-[10px] text-a24-muted whitespace-nowrap">
                get that bread
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-6">
            {isConnected ? (
              <Link
                href="/bounties/create"
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-black font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Post Bounty
              </Link>
            ) : (
              <div className="text-sm text-a24-muted">
                Connect wallet to post bounties
              </div>
            )}
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-a24-text font-medium transition-colors"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              Leaderboard
              <ChevronDown className={`w-4 h-4 transition-transform ${showLeaderboard ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Leaderboard (Collapsible) */}
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 bg-a24-surface border border-a24-border p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-a24-text">Top Bounty Hunters</h3>
            </div>

            {leaderboard.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {leaderboard.slice(0, 5).map((hunter, idx) => (
                  <div
                    key={hunter.id}
                    className={`p-4 border ${idx === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-a24-border'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-lg font-bold ${
                        idx === 0 ? 'text-yellow-400' :
                        idx === 1 ? 'text-gray-300' :
                        idx === 2 ? 'text-orange-400' : 'text-a24-muted'
                      }`}>
                        #{idx + 1}
                      </span>
                      <Blockies address={hunter.wallet_address} size={24} />
                    </div>
                    <p className="text-sm text-a24-text font-medium truncate">
                      {hunter.ens_name || truncateAddress(hunter.wallet_address)}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-a24-muted">
                      <span>{hunter.bounties_completed} done</span>
                      <span className="text-green-400">{hunter.total_earned} ETH</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-a24-muted text-sm">No hunters yet. Be the first!</p>
            )}
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-a24-muted" />
          </div>

          <div className="flex gap-1">
            {STATUS_FILTERS.map(s => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === s.id
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-800 text-a24-muted hover:text-a24-text'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-800" />

          <div className="flex gap-1">
            {CATEGORIES.map(c => {
              const Icon = c.icon
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === c.id
                      ? 'bg-purple-600 text-a24-text'
                      : 'bg-gray-800 text-a24-muted hover:text-a24-text'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bounties List */}
        {loading ? (
          <div className="py-20 text-center">
            <Pixelbara pose="loading" size={100} className="mx-auto mb-4" />
            <p className="text-a24-muted">Loading bounties...</p>
          </div>
        ) : bounties.length === 0 ? (
          <div className="py-20 text-center border border-a24-border">
            <Pixelbara pose="question" size={120} className="mx-auto mb-4" />
            <p className="text-lg text-a24-text mb-2">No bounties found</p>
            <p className="text-sm text-a24-muted">
              {isConnected ? 'Be the first to post a bounty!' : 'Check back later for opportunities'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty, idx) => (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  href={`/bounties/${bounty.id}`}
                  className="block p-6 bg-a24-surface border border-a24-border hover:border-green-500/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Category & Status */}
                      <div className="flex items-center gap-2 mb-2">
                        {bounty.category && (
                          <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-[10px] uppercase tracking-wider">
                            {bounty.category}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider ${
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

                      <h3 className="text-lg font-bold text-a24-text group-hover:text-green-400 transition-colors mb-2 line-clamp-2">
                        {bounty.title}
                      </h3>

                      {bounty.description && (
                        <p className="text-sm text-a24-muted line-clamp-2 mb-3">
                          {bounty.description}
                        </p>
                      )}

                      {/* Skills */}
                      {bounty.skills && bounty.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {bounty.skills.slice(0, 4).map(skill => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-gray-800 text-a24-muted text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-a24-muted">
                        <span className="flex items-center gap-1">
                          <Blockies address={bounty.poster_address} size={14} />
                          {bounty.poster_ens || truncateAddress(bounty.poster_address)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {bounty.submissions_count} submissions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeLeft(bounty.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Reward */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-2xl font-bold text-green-400">
                        <Zap className="w-5 h-5" />
                        {formatReward(bounty.reward_amount, bounty.reward_token)}
                      </div>
                      <p className="text-xs text-a24-muted mt-1">Reward</p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors flex-shrink-0 mt-2" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Banner */}
        <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 bg-a24-surface/50 border border-a24-border">
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-a24-text">{bounties.length}</p>
            <p className="text-[10px] sm:text-xs text-a24-muted uppercase tracking-wider">Active Bounties</p>
          </div>
          <div className="text-center border-x border-a24-border">
            <p className="text-lg sm:text-2xl font-bold text-green-400">
              {bounties.reduce((sum, b) => sum + b.reward_amount, 0)} ETH
            </p>
            <p className="text-[10px] sm:text-xs text-a24-muted uppercase tracking-wider">Total Rewards</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-a24-text">{leaderboard.length}</p>
            <p className="text-[10px] sm:text-xs text-a24-muted uppercase tracking-wider">Active Hunters</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
