import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ════════════════════════════════════════════════════════════════════════════
// Duplicate Action Prevention
// ════════════════════════════════════════════════════════════════════════════

/**
 * Check if a wallet has already performed an action on a target
 */
export async function hasDuplicateAction(
  actorWallet: string,
  targetId: string,
  actionType: 'vouch' | 'report' | 'vote'
): Promise<boolean> {
  const normalizedWallet = actorWallet.toLowerCase()

  if (actionType === 'vouch') {
    const { data } = await supabase
      .from('vouches')
      .select('id')
      .eq('voucher_wallet', normalizedWallet)
      .eq('vouchee_wallet', targetId.toLowerCase())
      .single()
    return !!data
  }

  if (actionType === 'report') {
    // Check recent reports (within 30 days) to same target
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_wallet', normalizedWallet)
      .eq('target_wallet', targetId.toLowerCase())
      .gte('created_at', thirtyDaysAgo)
      .single()
    return !!data
  }

  if (actionType === 'vote') {
    const { data } = await supabase
      .from('vote_records')
      .select('id')
      .eq('voter_wallet', normalizedWallet)
      .eq('vote_id', targetId)
      .single()
    return !!data
  }

  return false
}

// ════════════════════════════════════════════════════════════════════════════
// Self-Action Prevention
// ════════════════════════════════════════════════════════════════════════════

/**
 * Check if actor and target are the same wallet
 */
export function isSelfAction(actorWallet: string, targetWallet: string): boolean {
  return actorWallet.toLowerCase() === targetWallet.toLowerCase()
}

// ════════════════════════════════════════════════════════════════════════════
// Sybil Attack Prevention
// ════════════════════════════════════════════════════════════════════════════

interface SybilCheckResult {
  isSuspicious: boolean
  reason?: string
  riskScore: number
}

/**
 * Check for Sybil attack patterns
 * Returns a risk score (0-100) and suspicious indicators
 */
export async function checkSybilRisk(wallet: string): Promise<SybilCheckResult> {
  const normalizedWallet = wallet.toLowerCase()
  let riskScore = 0
  const reasons: string[] = []

  try {
    // 1. Check wallet age (new wallets are riskier)
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at, first_tx_date, tx_count')
      .eq('wallet', normalizedWallet)
      .single()

    if (profile) {
      // Account created very recently
      const accountAge = Date.now() - new Date(profile.created_at).getTime()
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)

      if (daysSinceCreation < 1) {
        riskScore += 30
        reasons.push('Account created less than 1 day ago')
      } else if (daysSinceCreation < 7) {
        riskScore += 15
        reasons.push('Account created less than 7 days ago')
      }

      // Low on-chain activity
      if (profile.tx_count !== null && profile.tx_count < 5) {
        riskScore += 20
        reasons.push('Very low on-chain transaction count')
      } else if (profile.tx_count !== null && profile.tx_count < 20) {
        riskScore += 10
        reasons.push('Low on-chain transaction count')
      }

      // No first transaction date (wallet never used on-chain)
      if (!profile.first_tx_date) {
        riskScore += 25
        reasons.push('No on-chain transaction history')
      }
    }

    // 2. Check for burst activity patterns
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Burst vouching
    const { count: recentVouches } = await supabase
      .from('vouches')
      .select('*', { count: 'exact', head: true })
      .eq('voucher_wallet', normalizedWallet)
      .gte('created_at', oneHourAgo)

    if (recentVouches && recentVouches > 10) {
      riskScore += 30
      reasons.push('Unusually high vouch activity in last hour')
    } else if (recentVouches && recentVouches > 5) {
      riskScore += 15
      reasons.push('High vouch activity in last hour')
    }

    // Burst voting
    const { count: recentVotes } = await supabase
      .from('vote_records')
      .select('*', { count: 'exact', head: true })
      .eq('voter_wallet', normalizedWallet)
      .gte('created_at', oneHourAgo)

    if (recentVotes && recentVotes > 20) {
      riskScore += 25
      reasons.push('Unusually high voting activity in last hour')
    }

    // 3. Check for coordinated wallet patterns
    // This would require more sophisticated analysis in production
    // For now, check if wallet only vouches for one other wallet
    const { data: vouchPatterns } = await supabase
      .from('vouches')
      .select('vouchee_wallet')
      .eq('voucher_wallet', normalizedWallet)

    if (vouchPatterns && vouchPatterns.length > 0) {
      const uniqueVouchees = new Set(vouchPatterns.map(v => v.vouchee_wallet))
      if (vouchPatterns.length > 3 && uniqueVouchees.size === 1) {
        riskScore += 20
        reasons.push('All vouches to single wallet (potential sock puppet)')
      }
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100)

    return {
      isSuspicious: riskScore >= 50,
      reason: reasons.length > 0 ? reasons.join('; ') : undefined,
      riskScore,
    }
  } catch (error) {
    console.error('Sybil check error:', error)
    // Return neutral on error
    return {
      isSuspicious: false,
      riskScore: 0,
    }
  }
}

/**
 * Check if wallet meets minimum requirements for trust actions
 */
export async function meetsMinimumRequirements(wallet: string): Promise<{
  eligible: boolean
  reason?: string
}> {
  const normalizedWallet = wallet.toLowerCase()

  try {
    // Check if wallet exists in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at, tx_count, is_verified')
      .eq('wallet', normalizedWallet)
      .single()

    if (!profile) {
      return {
        eligible: false,
        reason: 'Wallet not registered. Please sync your profile first.',
      }
    }

    // Check if blacklisted
    const { data: blacklisted } = await supabase
      .from('blacklist')
      .select('id')
      .eq('wallet', normalizedWallet)
      .is('lifted_at', null)
      .single()

    if (blacklisted) {
      return {
        eligible: false,
        reason: 'This wallet has been blacklisted.',
      }
    }

    // Minimum account age (e.g., 1 day)
    const accountAge = Date.now() - new Date(profile.created_at).getTime()
    const hoursSinceCreation = accountAge / (1000 * 60 * 60)

    if (hoursSinceCreation < 24) {
      return {
        eligible: false,
        reason: 'Account must be at least 24 hours old to perform this action.',
      }
    }

    return { eligible: true }
  } catch {
    return {
      eligible: false,
      reason: 'Unable to verify wallet eligibility.',
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// IP-Wallet Correlation (Basic Sybil Detection)
// ════════════════════════════════════════════════════════════════════════════

const IP_WALLET_STORE = new Map<string, Set<string>>()
const WALLET_IP_STORE = new Map<string, Set<string>>()
const MAX_WALLETS_PER_IP = 5

/**
 * Track IP-wallet association
 */
export function trackIpWallet(ip: string, wallet: string): void {
  const normalizedWallet = wallet.toLowerCase()

  // Track wallets per IP
  if (!IP_WALLET_STORE.has(ip)) {
    IP_WALLET_STORE.set(ip, new Set())
  }
  IP_WALLET_STORE.get(ip)!.add(normalizedWallet)

  // Track IPs per wallet
  if (!WALLET_IP_STORE.has(normalizedWallet)) {
    WALLET_IP_STORE.set(normalizedWallet, new Set())
  }
  WALLET_IP_STORE.get(normalizedWallet)!.add(ip)
}

/**
 * Check if IP has too many associated wallets
 */
export function checkIpWalletLimit(ip: string): {
  suspicious: boolean
  walletCount: number
} {
  const wallets = IP_WALLET_STORE.get(ip)
  const count = wallets?.size || 0

  return {
    suspicious: count >= MAX_WALLETS_PER_IP,
    walletCount: count,
  }
}

/**
 * Check if wallet uses multiple IPs (potential bot)
 */
export function checkWalletIpCount(wallet: string): {
  suspicious: boolean
  ipCount: number
} {
  const normalizedWallet = wallet.toLowerCase()
  const ips = WALLET_IP_STORE.get(normalizedWallet)
  const count = ips?.size || 0

  // Many IPs for one wallet could indicate VPN/bot usage
  return {
    suspicious: count > 10,
    ipCount: count,
  }
}
