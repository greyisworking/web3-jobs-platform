'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, Vote, Flag, Ban, Users, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { PixelShield, PixelBallot } from '../components/PixelIcons'
import Pixelbara from '../components/Pixelbara'
import Footer from '../components/Footer'
import {
  getActiveVotes,
  getAllVotesHistory,
  getBlacklist,
  getRecentTrustLogs,
  type CommunityVote,
} from '@/lib/trust'

interface BlacklistEntry {
  wallet: string
  reason: string
  blacklistedAt: string
}

interface TrustLog {
  wallet: string
  action: string
  reason?: string
  createdAt: string
}

export default function TransparencyPage() {
  const [activeVotes, setActiveVotes] = useState<CommunityVote[]>([])
  const [voteHistory, setVoteHistory] = useState<CommunityVote[]>([])
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([])
  const [logs, setLogs] = useState<TrustLog[]>([])
  const [activeTab, setActiveTab] = useState<'votes' | 'blacklist' | 'logs'>('votes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [votes, history, bl, trustLogs] = await Promise.all([
          getActiveVotes(),
          getAllVotesHistory(),
          getBlacklist(),
          getRecentTrustLogs(100),
        ])
        setActiveVotes(votes)
        setVoteHistory(history)
        setBlacklist(bl)
        setLogs(trustLogs)
      } catch (error) {
        console.error('Failed to fetch transparency data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }

  const getActionIcon = (action: string) => {
    if (action.includes('vouch')) return <Users className="w-4 h-4 text-emerald-500" />
    if (action.includes('report')) return <Flag className="w-4 h-4 text-orange-500" />
    if (action.includes('vote')) return <Vote className="w-4 h-4 text-blue-500" />
    if (action.includes('blacklist')) return <Ban className="w-4 h-4 text-red-500" />
    return <Shield className="w-4 h-4 text-gray-500" />
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      vouch_given: 'Vouched for user',
      vouch_received: 'Received vouch',
      vouch_removed: 'Vouch removed',
      report_filed: 'Filed report',
      report_received: 'Received report',
      vote_started: 'Vote started',
      vote_cast: 'Cast vote',
      vote_guilty: 'Vote result: Guilty',
      vote_not_guilty: 'Vote result: Not Guilty',
      blacklisted: 'Added to blacklist',
      unblacklisted: 'Removed from blacklist',
      score_increased: 'Trust score increased',
      score_decreased: 'Trust score decreased',
    }
    return labels[action] || action
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg page-transition">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 section-spacing">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-500/10 rounded-2xl">
              <PixelShield size={48} className="text-emerald-500" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-a24-text dark:text-a24-dark-text mb-4">
            Transparency Report
          </h1>
          <p className="text-base md:text-lg text-a24-muted dark:text-a24-dark-muted max-w-2xl mx-auto leading-relaxed text-balance">
            All moderation actions are public. Every report, vote, and decision is recorded on-chain for full accountability.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border rounded-lg p-4 md:p-6 text-center card-hover-lift"
          >
            <Vote className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-a24-text dark:text-a24-dark-text">
              {activeVotes.length}
            </p>
            <p className="text-xs md:text-sm text-a24-muted dark:text-a24-dark-muted">Active Votes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border rounded-lg p-4 md:p-6 text-center card-hover-lift"
          >
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-a24-text dark:text-a24-dark-text">
              {voteHistory.filter(v => v.result).length}
            </p>
            <p className="text-xs md:text-sm text-a24-muted dark:text-a24-dark-muted">Completed Votes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border rounded-lg p-4 md:p-6 text-center card-hover-lift"
          >
            <Ban className="w-6 h-6 md:w-8 md:h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-a24-text dark:text-a24-dark-text">
              {blacklist.length}
            </p>
            <p className="text-xs md:text-sm text-a24-muted dark:text-a24-dark-muted">Blacklisted</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border rounded-lg p-4 md:p-6 text-center card-hover-lift"
          >
            <Clock className="w-6 h-6 md:w-8 md:h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-a24-text dark:text-a24-dark-text">
              {logs.length}
            </p>
            <p className="text-xs md:text-sm text-a24-muted dark:text-a24-dark-muted">Total Actions</p>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-wrap gap-2 border-b border-a24-border dark:border-a24-dark-border">
          {[
            { id: 'votes', label: 'Community Votes', icon: Vote },
            { id: 'blacklist', label: 'Blacklist', icon: Ban },
            { id: 'logs', label: 'Activity Log', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors touch-target ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 section-spacing-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Pixelbara pose="loading" size={100} />
            <p className="mt-4 text-sm text-a24-muted dark:text-a24-dark-muted">
              Loading transparency data...
            </p>
          </div>
        ) : (
          <>
            {/* Votes Tab */}
            {activeTab === 'votes' && (
              <div className="space-y-6">
                {/* Active Votes */}
                {activeVotes.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-a24-text dark:text-a24-dark-text mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Active Votes ({activeVotes.length})
                    </h2>
                    <div className="grid gap-4">
                      {activeVotes.map((vote) => (
                        <VoteRow key={vote.id} vote={vote} formatWallet={formatWallet} formatDate={formatDate} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Vote History */}
                <div>
                  <h2 className="text-lg font-bold text-a24-text dark:text-a24-dark-text mb-4">
                    Vote History ({voteHistory.length})
                  </h2>
                  {voteHistory.length === 0 ? (
                    <EmptyState message="No votes yet" />
                  ) : (
                    <div className="grid gap-4">
                      {voteHistory.map((vote) => (
                        <VoteRow key={vote.id} vote={vote} formatWallet={formatWallet} formatDate={formatDate} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Blacklist Tab */}
            {activeTab === 'blacklist' && (
              <div>
                <h2 className="text-lg font-bold text-a24-text dark:text-a24-dark-text mb-4">
                  Blacklisted Addresses ({blacklist.length})
                </h2>
                {blacklist.length === 0 ? (
                  <EmptyState message="No blacklisted addresses" />
                ) : (
                  <div className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-a24-bg dark:bg-a24-dark-bg/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                              Address
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                              Reason
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-a24-border dark:divide-a24-dark-border">
                          {blacklist.map((entry, i) => (
                            <tr key={i} className="hover:bg-a24-bg dark:hover:bg-a24-dark-bg/50">
                              <td className="px-4 py-3">
                                <code className="text-xs sm:text-sm font-mono text-red-600 dark:text-red-400">
                                  <span className="hidden sm:inline">{entry.wallet}</span>
                                  <span className="sm:hidden">{formatWallet(entry.wallet)}</span>
                                </code>
                              </td>
                              <td className="px-4 py-3 text-sm text-a24-text dark:text-a24-dark-text">
                                {entry.reason}
                              </td>
                              <td className="px-4 py-3 text-sm text-a24-muted dark:text-a24-dark-muted whitespace-nowrap">
                                {formatDate(entry.blacklistedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === 'logs' && (
              <div>
                <h2 className="text-lg font-bold text-a24-text dark:text-a24-dark-text mb-4">
                  Recent Activity ({logs.length})
                </h2>
                {logs.length === 0 ? (
                  <EmptyState message="No activity yet" />
                ) : (
                  <div className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border rounded-lg divide-y divide-a24-border dark:divide-a24-dark-border">
                    {logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-3 p-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-a24-text dark:text-a24-dark-text">
                            <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                              {formatWallet(log.wallet)}
                            </code>
                            {' '}
                            <span className="text-a24-muted dark:text-a24-dark-muted">
                              {getActionLabel(log.action)}
                            </span>
                          </p>
                          {log.reason && (
                            <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-1 truncate">
                              {log.reason}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-a24-muted dark:text-a24-dark-muted whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Helper Components
// ════════════════════════════════════════════════════════════════════════════

function VoteRow({
  vote,
  formatWallet,
  formatDate,
}: {
  vote: CommunityVote
  formatWallet: (w: string) => string
  formatDate: (d: string) => string
}) {
  const totalVotes = vote.votesGuilty + vote.votesNotGuilty + vote.votesAbstain
  const guiltyPercent = totalVotes > 0 ? Math.round((vote.votesGuilty / totalVotes) * 100) : 0
  const notGuiltyPercent = totalVotes > 0 ? Math.round((vote.votesNotGuilty / totalVotes) * 100) : 0

  return (
    <div className="bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-a24-text dark:text-a24-dark-text">
            {vote.title}
          </h3>
          <code className="text-xs font-mono text-a24-muted dark:text-a24-dark-muted">
            {formatWallet(vote.targetWallet)}
          </code>
        </div>
        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
          vote.result
            ? vote.result === 'guilty'
              ? 'bg-red-500/10 text-red-500'
              : 'bg-emerald-500/10 text-emerald-500'
            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
        }`}>
          {vote.result
            ? vote.result === 'guilty' ? 'Guilty' : 'Not Guilty'
            : 'Voting'
          }
        </span>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden bg-a24-border dark:bg-a24-dark-border mb-2">
        <div className="bg-red-500" style={{ width: `${guiltyPercent}%` }} />
        <div className="bg-emerald-500" style={{ width: `${notGuiltyPercent}%` }} />
      </div>

      <div className="flex flex-wrap justify-between text-xs text-a24-muted dark:text-a24-dark-muted gap-2">
        <span>Guilty: {vote.votesGuilty} ({guiltyPercent}%)</span>
        <span>Not Guilty: {vote.votesNotGuilty} ({notGuiltyPercent}%)</span>
        <span>Total: {totalVotes} votes</span>
      </div>

      <div className="mt-3 pt-3 border-t border-a24-border dark:border-a24-dark-border text-xs text-a24-muted dark:text-a24-dark-muted">
        {vote.result
          ? `Ended: ${formatDate(vote.resultFinalizedAt || vote.votingEndsAt)}`
          : `Ends: ${formatDate(vote.votingEndsAt)}`
        }
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Pixelbara pose="sparkle" size={80} />
      <p className="mt-4 text-sm text-a24-muted dark:text-a24-dark-muted">
        {message}
      </p>
    </div>
  )
}
