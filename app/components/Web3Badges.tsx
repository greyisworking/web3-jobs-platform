'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { RefreshCw, Shield, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Blockies, { truncateAddress } from './Blockies'
import type { Badge, UserProfile } from '@/types/web3'
import { BADGE_INFO } from '@/types/web3'

interface Web3BadgesProps {
  address?: string
  showSync?: boolean
  compact?: boolean
}

export default function Web3Badges({ address: propAddress, showSync = false, compact = false }: Web3BadgesProps) {
  const { address: connectedAddress } = useAccount()
  const address = propAddress || connectedAddress

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!address) return

    try {
      const res = await fetch(`/api/profile/${address}`)
      const data = await res.json()
      setProfile(data.profile || null)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    fetchProfile()
  }, [address, fetchProfile])

  const handleSync = async () => {
    if (!address) return

    setSyncing(true)
    try {
      const res = await fetch(`/api/profile/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()

      if (data.profile) {
        setProfile(data.profile)
        toast(data.message || 'Profile synced!', { duration: 3000 })
      }
    } catch (error) {
      console.error('Failed to sync:', error)
      toast('Failed to sync profile', { duration: 3000 })
    } finally {
      setSyncing(false)
    }
  }

  if (!address) return null

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32" />
      </div>
    )
  }

  // Compact mode - just show badges inline
  if (compact) {
    const badges = profile?.badges || []
    if (badges.length === 0) return null

    return (
      <div className="flex items-center gap-1">
        {badges.map(badge => (
          <span
            key={badge.badge_type}
            className="px-1.5 py-0.5 text-[10px] font-medium rounded"
            style={{
              backgroundColor: `${BADGE_INFO[badge.badge_type as keyof typeof BADGE_INFO].color}20`,
              color: BADGE_INFO[badge.badge_type as keyof typeof BADGE_INFO].color,
            }}
            title={BADGE_INFO[badge.badge_type as keyof typeof BADGE_INFO].description}
          >
            {BADGE_INFO[badge.badge_type as keyof typeof BADGE_INFO].emoji}
          </span>
        ))}
      </div>
    )
  }

  // Full display
  return (
    <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Blockies address={address} size={40} />
          <div>
            <p className="text-white font-medium">
              {profile?.ens_name || profile?.display_name || truncateAddress(address)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {truncateAddress(address)}
            </p>
          </div>
        </div>

        {showSync && address === connectedAddress && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        )}
      </div>

      {/* Badges */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          On-chain Badges
        </p>

        {profile?.badges && profile.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.badges.map(badge => {
              const info = BADGE_INFO[badge.badge_type as keyof typeof BADGE_INFO]
              return (
                <div
                  key={badge.badge_type}
                  className="flex items-center gap-1.5 px-2 py-1 border"
                  style={{
                    backgroundColor: `${info.color}10`,
                    borderColor: `${info.color}40`,
                  }}
                >
                  <span>{info.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: info.color }}>
                    {info.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            {profile ? 'No badges yet. Sync to check your on-chain activity.' : 'Sync profile to earn badges.'}
          </p>
        )}
      </div>

      {/* Stats */}
      {profile && (
        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-800">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{profile.total_tx_count}</p>
            <p className="text-[10px] text-gray-500">Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{profile.nft_count}</p>
            <p className="text-[10px] text-gray-500">NFTs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{profile.dao_votes}</p>
            <p className="text-[10px] text-gray-500">DAO Votes</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-neun-success">{profile.reputation_score}</p>
            <p className="text-[10px] text-gray-500">Rep Score</p>
          </div>
        </div>
      )}

      {/* Pixelbara comment */}
      {profile?.badges && profile.badges.length > 0 && (
        <p className="text-[10px] text-gray-600 italic mt-3 text-center">
          &quot;ur history is showing ser&quot;
        </p>
      )}

      {/* Etherscan Link */}
      <a
        href={`https://etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        View on Etherscan
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

// Token gate indicator component
export function TokenGateIndicator({
  tokenGate,
  hasAccess,
}: {
  tokenGate: { name?: string; symbol?: string }
  hasAccess: boolean
}) {
  if (hasAccess) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
      <span>🔒</span>
      <span>Hold {tokenGate.symbol || tokenGate.name || 'TOKEN'} to unlock</span>
    </div>
  )
}

// Mutual connections display
export function MutualConnections({
  companyId,
  userAddress,
}: {
  companyId: string
  userAddress: string
}) {
  const [mutuals, setMutuals] = useState<{ address: string; ens?: string; platform: string }[]>([])

  useEffect(() => {
    // In production, fetch from API
    // For now, this is a placeholder
  }, [companyId, userAddress])

  if (mutuals.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span className="text-neun-success">Your mutuals work here:</span>
      <div className="flex -space-x-2">
        {mutuals.slice(0, 3).map(m => (
          <Blockies key={m.address} address={m.address} size={20} className="border border-gray-900" />
        ))}
      </div>
      {mutuals.length > 3 && (
        <span>+{mutuals.length - 3} more</span>
      )}
    </div>
  )
}
