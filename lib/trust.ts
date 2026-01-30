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

export function getTrustColor(level: TrustLevel): string {
  switch (level) {
    case 'verified': return 'emerald'
    case 'trusted': return 'green'
    case 'neutral': return 'gray'
    case 'caution': return 'yellow'
    case 'warning': return 'orange'
    case 'blacklisted': return 'red'
    default: return 'gray'
  }
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

export async function getTrustScore(wallet: string): Promise<TrustScore | null> {
  const { data, error } = await supabase
    .from('trust_scores')
    .select('*')
    .eq('wallet', wallet.toLowerCase())
    .single()

  if (error || !data) {
    // Return default score for new users
    return {
      wallet: wallet.toLowerCase(),
      score: 50,
      level: 'neutral',
      vouchCount: 0,
      vouchedByCount: 0,
      reportsAgainst: 0,
      isVerified: false,
      isBlacklisted: false,
    }
  }

  return {
    wallet: data.wallet,
    score: data.score,
    level: getTrustLevel(data.score, data.is_blacklisted),
    vouchCount: data.vouch_count,
    vouchedByCount: data.vouched_by_count,
    reportsAgainst: data.reports_against,
    isVerified: data.is_verified,
    isBlacklisted: data.is_blacklisted,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Vouch Functions
// ════════════════════════════════════════════════════════════════════════════

export async function createVouch(
  voucherWallet: string,
  voucheeWallet: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  if (voucherWallet.toLowerCase() === voucheeWallet.toLowerCase()) {
    return { success: false, error: "You can't vouch for yourself" }
  }

  const { error } = await supabase
    .from('vouches')
    .insert({
      voucher_wallet: voucherWallet.toLowerCase(),
      vouchee_wallet: voucheeWallet.toLowerCase(),
      message,
    })

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { success: false, error: 'You have already vouched for this user' }
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function removeVouch(
  voucherWallet: string,
  voucheeWallet: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('vouches')
    .delete()
    .eq('voucher_wallet', voucherWallet.toLowerCase())
    .eq('vouchee_wallet', voucheeWallet.toLowerCase())

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getVouchesFor(wallet: string): Promise<Vouch[]> {
  const { data, error } = await supabase
    .from('vouches')
    .select('*')
    .eq('vouchee_wallet', wallet.toLowerCase())
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(v => ({
    id: v.id,
    voucherWallet: v.voucher_wallet,
    voucheeWallet: v.vouchee_wallet,
    message: v.message,
    createdAt: v.created_at,
  }))
}

export async function getVouchesBy(wallet: string): Promise<Vouch[]> {
  const { data, error } = await supabase
    .from('vouches')
    .select('*')
    .eq('voucher_wallet', wallet.toLowerCase())
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(v => ({
    id: v.id,
    voucherWallet: v.voucher_wallet,
    voucheeWallet: v.vouchee_wallet,
    message: v.message,
    createdAt: v.created_at,
  }))
}

export async function hasVouched(voucherWallet: string, voucheeWallet: string): Promise<boolean> {
  const { data } = await supabase
    .from('vouches')
    .select('id')
    .eq('voucher_wallet', voucherWallet.toLowerCase())
    .eq('vouchee_wallet', voucheeWallet.toLowerCase())
    .single()

  return !!data
}

// ════════════════════════════════════════════════════════════════════════════
// Report Functions
// ════════════════════════════════════════════════════════════════════════════

export async function createReport(
  reporterWallet: string,
  targetWallet: string,
  targetType: string,
  category: string,
  reason: string,
  evidenceUrls?: string[]
): Promise<{ success: boolean; error?: string }> {
  if (reporterWallet.toLowerCase() === targetWallet.toLowerCase()) {
    return { success: false, error: "You can't report yourself" }
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_wallet: reporterWallet.toLowerCase(),
      target_wallet: targetWallet.toLowerCase(),
      target_type: targetType,
      category,
      reason,
      evidence_urls: evidenceUrls || [],
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getReportsAgainst(wallet: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('target_wallet', wallet.toLowerCase())
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(r => ({
    id: r.id,
    reporterWallet: r.reporter_wallet,
    targetWallet: r.target_wallet,
    targetType: r.target_type,
    category: r.category,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
  }))
}

export async function getReportCount(wallet: string): Promise<number> {
  const { count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('target_wallet', wallet.toLowerCase())
    .in('status', ['pending', 'under_review', 'voting'])

  return count || 0
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

export async function castVote(
  voteId: string,
  voterWallet: string,
  decision: 'guilty' | 'not_guilty' | 'abstain',
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('vote_records')
    .insert({
      vote_id: voteId,
      voter_wallet: voterWallet.toLowerCase(),
      decision,
      comment,
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'You have already voted' }
    }
    return { success: false, error: error.message }
  }

  // Update vote counts
  const field = decision === 'guilty' ? 'votes_guilty'
    : decision === 'not_guilty' ? 'votes_not_guilty'
    : 'votes_abstain'

  await supabase.rpc('increment_vote_count', {
    p_vote_id: voteId,
    p_field: field,
  })

  return { success: true }
}

export async function hasVoted(voteId: string, voterWallet: string): Promise<boolean> {
  const { data } = await supabase
    .from('vote_records')
    .select('id')
    .eq('vote_id', voteId)
    .eq('voter_wallet', voterWallet.toLowerCase())
    .single()

  return !!data
}

export async function getVoteRecords(voteId: string): Promise<VoteRecord[]> {
  const { data, error } = await supabase
    .from('vote_records')
    .select('*')
    .eq('vote_id', voteId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(r => ({
    id: r.id,
    voteId: r.vote_id,
    voterWallet: r.voter_wallet,
    decision: r.decision,
    comment: r.comment,
    createdAt: r.created_at,
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
