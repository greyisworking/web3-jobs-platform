'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ThumbsUp, ThumbsDown, AlertTriangle, Check, X, Users, Flag, Vote } from 'lucide-react'
import { PixelShield, PixelThumbsUp, PixelCheck, PixelX } from './PixelIcons'
import type { TrustLevel, TrustScore, Vouch, CommunityVote } from '@/lib/trust'
import { getTrustLabel, getTrustColor } from '@/lib/trust'

// ════════════════════════════════════════════════════════════════════════════
// Trust Score Badge
// ════════════════════════════════════════════════════════════════════════════

interface TrustBadgeProps {
  score: number
  level: TrustLevel
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
  className?: string
}

export function TrustBadge({ score, level, size = 'md', showScore = true, className = '' }: TrustBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }

  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20,
  }

  const colorClasses = {
    verified: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    trusted: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    neutral: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    caution: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    warning: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    blacklisted: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  }

  return (
    <div
      className={`inline-flex items-center border rounded-sm font-medium ${sizeClasses[size]} ${colorClasses[level]} ${className}`}
    >
      <PixelShield size={iconSize[size]} />
      <span>{getTrustLabel(level)}</span>
      {showScore && (
        <span className="opacity-70">({score})</span>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Vouch Button
// ════════════════════════════════════════════════════════════════════════════

interface VouchButtonProps {
  targetWallet: string
  hasVouched: boolean
  vouchCount: number
  onVouch: () => Promise<void>
  onUnvouch: () => Promise<void>
  disabled?: boolean
  className?: string
}

export function VouchButton({
  targetWallet,
  hasVouched,
  vouchCount,
  onVouch,
  onUnvouch,
  disabled = false,
  className = '',
}: VouchButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      if (hasVouched) {
        await onUnvouch()
      } else {
        await onVouch()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-sm font-medium text-sm
        transition-all duration-200 touch-target
        ${hasVouched
          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-gray-700'
        }
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <PixelThumbsUp size={16} />
      )}
      <span>{hasVouched ? 'Vouched' : 'Vouch'}</span>
      <span className="opacity-70">({vouchCount})</span>
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Report Button
// ════════════════════════════════════════════════════════════════════════════

interface ReportButtonProps {
  onReport: () => void
  className?: string
}

export function ReportButton({ onReport, className = '' }: ReportButtonProps) {
  return (
    <button
      onClick={onReport}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-sm font-medium text-xs
        text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400
        hover:bg-red-500/10 transition-colors touch-target
        ${className}
      `}
    >
      <Flag className="w-3.5 h-3.5" />
      <span>Report</span>
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Report Modal
// ════════════════════════════════════════════════════════════════════════════

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetWallet: string
  onSubmit: (category: string, reason: string) => Promise<void>
}

export function ReportModal({ isOpen, onClose, targetWallet, onSubmit }: ReportModalProps) {
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const categories = [
    { value: 'scam', label: 'Scam / Fraud' },
    { value: 'fake_job', label: 'Fake Job Posting' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'other', label: 'Other' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !reason) return

    setLoading(true)
    try {
      await onSubmit(category, reason)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Flag className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Report User
            </h3>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Reporting: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {targetWallet.slice(0, 6)}...{targetWallet.slice(-4)}
            </code>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Describe what happened..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !category || !reason}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Vouch List
// ════════════════════════════════════════════════════════════════════════════

interface VouchListProps {
  vouches: Vouch[]
  title?: string
  emptyMessage?: string
  className?: string
}

export function VouchList({ vouches, title = 'Vouches', emptyMessage = 'No vouches yet', className = '' }: VouchListProps) {
  return (
    <div className={className}>
      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        {title} ({vouches.length})
      </h4>

      {vouches.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {vouches.slice(0, 10).map((vouch) => (
            <div
              key={vouch.id}
              className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <PixelThumbsUp size={14} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                  {vouch.voucherWallet.slice(0, 6)}...{vouch.voucherWallet.slice(-4)}
                </p>
                {vouch.message && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    &ldquo;{vouch.message}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
          {vouches.length > 10 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              +{vouches.length - 10} more
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Community Vote Card
// ════════════════════════════════════════════════════════════════════════════

interface VoteCardProps {
  vote: CommunityVote
  userVote?: 'guilty' | 'not_guilty' | 'abstain'
  onVote: (decision: 'guilty' | 'not_guilty' | 'abstain') => Promise<void>
  disabled?: boolean
  className?: string
}

export function VoteCard({ vote, userVote, onVote, disabled = false, className = '' }: VoteCardProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const totalVotes = vote.votesGuilty + vote.votesNotGuilty + vote.votesAbstain
  const guiltyPercent = totalVotes > 0 ? (vote.votesGuilty / totalVotes) * 100 : 0
  const notGuiltyPercent = totalVotes > 0 ? (vote.votesNotGuilty / totalVotes) * 100 : 0

  const endDate = new Date(vote.votingEndsAt)
  const now = new Date()
  const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60)))

  const handleVote = async (decision: 'guilty' | 'not_guilty' | 'abstain') => {
    setLoading(decision)
    try {
      await onVote(decision)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Vote className="w-4 h-4 text-emerald-500" />
            {vote.title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
            {vote.targetWallet.slice(0, 6)}...{vote.targetWallet.slice(-4)}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            vote.result
              ? vote.result === 'guilty'
                ? 'bg-red-500/10 text-red-500'
                : 'bg-emerald-500/10 text-emerald-500'
              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
          }`}>
            {vote.result
              ? vote.result === 'guilty' ? 'Guilty' : 'Not Guilty'
              : `${hoursLeft}h left`
            }
          </span>
        </div>
      </div>

      {/* Vote progress */}
      <div className="mb-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${guiltyPercent}%` }}
          />
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${notGuiltyPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Guilty: {vote.votesGuilty}</span>
          <span>Total: {totalVotes}</span>
          <span>Not Guilty: {vote.votesNotGuilty}</span>
        </div>
      </div>

      {/* Vote buttons */}
      {!vote.result && !userVote && (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote('guilty')}
            disabled={disabled || loading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg font-medium text-sm hover:bg-red-500/20 disabled:opacity-50 transition-colors touch-target"
          >
            {loading === 'guilty' ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <PixelX size={14} />
            )}
            Guilty
          </button>
          <button
            onClick={() => handleVote('not_guilty')}
            disabled={disabled || loading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-medium text-sm hover:bg-emerald-500/20 disabled:opacity-50 transition-colors touch-target"
          >
            {loading === 'not_guilty' ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <PixelCheck size={14} />
            )}
            Not Guilty
          </button>
        </div>
      )}

      {userVote && (
        <div className={`text-center text-sm font-medium py-2 rounded-lg ${
          userVote === 'guilty'
            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        }`}>
          You voted: {userVote === 'guilty' ? 'Guilty' : 'Not Guilty'}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Trust Profile Section
// ════════════════════════════════════════════════════════════════════════════

interface TrustProfileProps {
  trustScore: TrustScore
  vouches: Vouch[]
  isOwnProfile?: boolean
  onVouch?: () => Promise<void>
  onUnvouch?: () => Promise<void>
  onReport?: () => void
  hasVouched?: boolean
  className?: string
}

export function TrustProfile({
  trustScore,
  vouches,
  isOwnProfile = false,
  onVouch,
  onUnvouch,
  onReport,
  hasVouched = false,
  className = '',
}: TrustProfileProps) {
  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 md:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Trust Score
          </h3>
          <TrustBadge score={trustScore.score} level={trustScore.level} size="lg" />
        </div>

        {!isOwnProfile && (
          <div className="flex flex-wrap gap-2">
            {onVouch && onUnvouch && (
              <VouchButton
                targetWallet={trustScore.wallet}
                hasVouched={hasVouched}
                vouchCount={trustScore.vouchedByCount}
                onVouch={onVouch}
                onUnvouch={onUnvouch}
              />
            )}
            {onReport && (
              <ReportButton onReport={onReport} />
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold text-emerald-500">{trustScore.vouchedByCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vouches Received</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold text-blue-500">{trustScore.vouchCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vouches Given</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{trustScore.reportsAgainst}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Reports Against</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold text-purple-500">{trustScore.score}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Trust Score</p>
        </div>
      </div>

      {/* Vouch list */}
      <VouchList vouches={vouches} />
    </div>
  )
}
