import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export type TrustLevel = 'verified' | 'trusted' | 'neutral' | 'caution' | 'warning' | 'blacklisted'

export interface TrustScore {
  wallet: string
  score: number
  level: TrustLevel
  vouchCount: number
  vouchedByCount: number
  reportsAgainst: number
  isVerified: boolean
  isBlacklisted: boolean
}

export interface Vouch {
  id: string
  voucherWallet: string
  voucheeWallet: string
  message?: string
  createdAt: string
}

export interface Report {
  id: string
  reporterWallet: string
  targetWallet: string
  targetType: string
  category: string
  reason: string
  status: string
  createdAt: string
}

export interface CommunityVote {
  id: string
  targetWallet: string
  title: string
  description?: string
  votingStartsAt: string
  votingEndsAt: string
  votesGuilty: number
  votesNotGuilty: number
  votesAbstain: number
  totalVoters: number
  result?: string
  resultFinalizedAt?: string
}

export interface VoteRecord {
  id: string
  voteId: string
  voterWallet: string
  decision: 'guilty' | 'not_guilty' | 'abstain'
  comment?: string
  createdAt: string
}

// ════════════════════════════════════════════════════════════════════════════
// Trust Score Functions
// ════════════════════════════════════════════════════════════════════════════

export function getTrustLevel(score: number, isBlacklisted: boolean): TrustLevel {
  if (isBlacklisted) return 'blacklisted'
  if (score >= 80) return 'verified'
  if (score >= 65) return 'trusted'
  if (score >= 45) return 'neutral'
  if (score >= 25) return 'caution'
  return 'warning'
}

export function getTrustLabel(level: TrustLevel): string {
  switch (level) {
    case 'verified': return 'Verified'
    case 'trusted': return 'Trusted'
    case 'neutral': return 'Neutral'
    case 'caution': return 'Caution'
    case 'warning': return 'Warning'
    case 'blacklisted': return 'Blacklisted'
    default: return 'Unknown'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Vote Functions
// ════════════════════════════════════════════════════════════════════════════

export async function getActiveVotes(): Promise<CommunityVote[]> {
  const { data, error } = await supabase
    .from('community_votes')
    .select('*')
    .is('result', null)
    .gt('voting_ends_at', new Date().toISOString())
    .order('voting_ends_at', { ascending: true })

  if (error || !data) return []

  return data.map(v => ({
    id: v.id,
    targetWallet: v.target_wallet,
    title: v.title,
    description: v.description,
    votingStartsAt: v.voting_starts_at,
    votingEndsAt: v.voting_ends_at,
    votesGuilty: v.votes_guilty,
    votesNotGuilty: v.votes_not_guilty,
    votesAbstain: v.votes_abstain,
    totalVoters: v.total_voters,
    result: v.result,
    resultFinalizedAt: v.result_finalized_at,
  }))
}

// ════════════════════════════════════════════════════════════════════════════
// Blacklist Functions
// ════════════════════════════════════════════════════════════════════════════

export async function isBlacklisted(wallet: string): Promise<boolean> {
  const { data } = await supabase
    .from('blacklist')
    .select('id')
    .eq('wallet', wallet.toLowerCase())
    .is('lifted_at', null)
    .single()

  return !!data
}

export async function getBlacklist(): Promise<{
  wallet: string
  reason: string
  blacklistedAt: string
}[]> {
  const { data, error } = await supabase
    .from('blacklist')
    .select('*')
    .is('lifted_at', null)
    .order('blacklisted_at', { ascending: false })

  if (error || !data) return []

  return data.map(b => ({
    wallet: b.wallet,
    reason: b.reason,
    blacklistedAt: b.blacklisted_at,
  }))
}

// ════════════════════════════════════════════════════════════════════════════
// Transparency Functions
// ════════════════════════════════════════════════════════════════════════════

export async function getRecentTrustLogs(limit = 50): Promise<{
  wallet: string
  action: string
  reason?: string
  createdAt: string
}[]> {
  const { data, error } = await supabase
    .from('trust_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map(l => ({
    wallet: l.wallet,
    action: l.action,
    reason: l.reason,
    createdAt: l.created_at,
  }))
}

export async function getAllVotesHistory(): Promise<CommunityVote[]> {
  const { data, error } = await supabase
    .from('community_votes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(v => ({
    id: v.id,
    targetWallet: v.target_wallet,
    title: v.title,
    description: v.description,
    votingStartsAt: v.voting_starts_at,
    votingEndsAt: v.voting_ends_at,
    votesGuilty: v.votes_guilty,
    votesNotGuilty: v.votes_not_guilty,
    votesAbstain: v.votes_abstain,
    totalVoters: v.total_voters,
    result: v.result,
    resultFinalizedAt: v.result_finalized_at,
  }))
}
