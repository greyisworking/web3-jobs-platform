// On-chain Badge Types
export type BadgeType =
  | 'og_degen'      // 3+ years on-chain activity
  | 'nft_collector' // Holds NFTs
  | 'dao_contributor' // Governance participation
  | 'defi_native'   // DeFi protocol usage
  | 'builder'       // Deployed contracts

export interface Badge {
  id: string
  wallet_address: string
  badge_type: BadgeType
  badge_data: Record<string, unknown>
  earned_at: string
  verified_at: string | null
}

export const BADGE_INFO: Record<BadgeType, {
  label: string
  description: string
  emoji: string
  color: string
}> = {
  og_degen: {
    label: 'OG Degen',
    description: '3+ years of on-chain activity',
    emoji: '🦍',
    color: '#FFD700'
  },
  nft_collector: {
    label: 'NFT Collector',
    description: 'Active NFT holder',
    emoji: '🖼️',
    color: '#9945FF'
  },
  dao_contributor: {
    label: 'DAO Contributor',
    description: 'Governance participation',
    emoji: '🏛️',
    color: '#00D395'
  },
  defi_native: {
    label: 'DeFi Native',
    description: 'DeFi protocol experience',
    emoji: '🌊',
    color: '#627EEA'
  },
  builder: {
    label: 'Builder',
    description: 'Deployed smart contracts',
    emoji: '🔨',
    color: '#FF6B6B'
  }
}

// User Profile
export interface UserProfile {
  id: string
  wallet_address: string
  ens_name: string | null
  farcaster_username: string | null
  farcaster_fid: number | null
  lens_handle: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  twitter_handle: string | null
  github_username: string | null
  first_tx_date: string | null
  total_tx_count: number
  nft_count: number
  dao_votes: number
  defi_protocols_used: number
  contracts_deployed: number
  reputation_score: number
  last_synced_at: string | null
  created_at: string
  badges?: Badge[]
}

// Token Gating
export interface TokenGate {
  type: 'erc20' | 'erc721' | 'erc1155'
  contract: string
  chainId: number
  minBalance?: number
  tokenId?: string // For ERC1155
  name?: string
  symbol?: string
}

// Bounty
export interface Bounty {
  id: string
  title: string
  description: string | null
  requirements: string | null
  submission_requirements: string | null
  external_url: string | null
  reward_amount: number
  reward_token: string
  reward_chain_id: number
  poster_address: string
  poster_ens: string | null
  escrow_tx_hash: string | null
  escrow_contract: string | null
  status: 'open' | 'in_progress' | 'submitted' | 'completed' | 'cancelled'
  category: string | null
  skills: string[] | null
  deadline: string | null
  submissions_count: number
  winner_address: string | null
  payout_tx_hash: string | null
  created_at: string
  updated_at: string
}

export interface BountySubmission {
  id: string
  bounty_id: string
  hunter_address: string
  hunter_ens: string | null
  submission_url: string | null
  description: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
}

export interface BountyHunter {
  id: string
  wallet_address: string
  ens_name: string | null
  bounties_completed: number
  total_earned: number
  success_rate: number
  rank: number | null
  created_at: string
}

// Credentials / POAPs
export interface Credential {
  id: string
  wallet_address: string
  credential_type: 'poap' | 'neun_badge'
  credential_id: string | null
  title: string
  description: string | null
  image_url: string | null
  metadata: Record<string, unknown>
  issued_at: string
}

export const NEUN_BADGES = {
  first_application: {
    id: 'first_application',
    title: 'First Steps',
    description: 'Applied to your first job on NEUN',
    image: '/badges/first-application.png'
  },
  applied_10: {
    id: 'applied_10',
    title: 'Job Hunter',
    description: 'Applied to 10 jobs',
    image: '/badges/applied-10.png'
  },
  applied_50: {
    id: 'applied_50',
    title: 'Persistent Hunter',
    description: 'Applied to 50 jobs',
    image: '/badges/applied-50.png'
  },
  interview_attended: {
    id: 'interview_attended',
    title: 'Interview Pro',
    description: 'Attended an interview',
    image: '/badges/interview.png'
  },
  bounty_hunter: {
    id: 'bounty_hunter',
    title: 'Bounty Hunter',
    description: 'Completed your first bounty',
    image: '/badges/bounty.png'
  }
}

// Social Connections
export interface SocialConnection {
  id: string
  wallet_address: string
  platform: 'farcaster' | 'lens'
  profile_id: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  followers_count: number
  following_count: number
  verified: boolean
  connected_at: string
}

export interface MutualConnection {
  id: string
  user_address: string
  company_id: string
  mutual_address: string
  mutual_ens: string | null
  platform: 'farcaster' | 'lens'
  relationship: 'follows' | 'followed_by' | 'mutual'
}

// DAO Job extras
export interface DAOJobInfo {
  is_dao_job: boolean
  dao_name: string | null
  dao_logo: string | null
  snapshot_space: string | null
  min_votes_required: number | null
  min_proposals_required: number | null
}
