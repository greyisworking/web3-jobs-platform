// On-chain data fetching utilities
// Using public APIs: Etherscan, DeBank, Alchemy, etc.

import type { BadgeType, UserProfile } from '@/types/web3'

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || ''

// Fetch first transaction date from Etherscan
export async function getFirstTxDate(address: string): Promise<Date | null> {
  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    )
    const data = await res.json()

    if (data.status === '1' && data.result?.length > 0) {
      const timestamp = parseInt(data.result[0].timeStamp) * 1000
      return new Date(timestamp)
    }
    return null
  } catch (error) {
    console.error('Error fetching first tx:', error)
    return null
  }
}

// Fetch total transaction count
export async function getTxCount(address: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    )
    const data = await res.json()

    if (data.result) {
      return parseInt(data.result, 16)
    }
    return 0
  } catch (error) {
    console.error('Error fetching tx count:', error)
    return 0
  }
}

// Check if address has deployed contracts
export async function getContractsDeployed(address: string): Promise<number> {
  try {
    // Check internal transactions for contract creation
    const res = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    )
    const data = await res.json()

    if (data.status === '1' && data.result) {
      // Count contract creations (type: 'create')
      const creations = data.result.filter((tx: { type: string }) => tx.type === 'create')
      return creations.length
    }
    return 0
  } catch (error) {
    console.error('Error fetching contracts deployed:', error)
    return 0
  }
}

// Fetch NFT holdings count (simplified - using Alchemy)
export async function getNFTCount(address: string): Promise<number> {
  try {
    if (!ALCHEMY_API_KEY) return 0

    const res = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${address}&withMetadata=false&pageSize=100`
    )
    const data = await res.json()

    return data.totalCount || 0
  } catch (error) {
    console.error('Error fetching NFT count:', error)
    return 0
  }
}

// Check DAO participation via Snapshot
export async function getSnapshotVotes(address: string): Promise<number> {
  try {
    const query = `
      query {
        votes(first: 1000, where: { voter: "${address.toLowerCase()}" }) {
          id
        }
      }
    `

    const res = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    const data = await res.json()

    return data.data?.votes?.length || 0
  } catch (error) {
    console.error('Error fetching Snapshot votes:', error)
    return 0
  }
}

// Get DeFi protocol interactions (simplified check)
export async function getDeFiProtocolCount(address: string): Promise<number> {
  // This would ideally use DeBank API or similar
  // For now, check interactions with known DeFi contracts
  const DEFI_CONTRACTS = [
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
    '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
    '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap Router
    '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Aave V2 Pool
    '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', // Aave V3 Pool
    '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', // Compound Comptroller
    '0xBA12222222228d8Ba445958a75a0704d566BF2C8', // Balancer Vault
    '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', // 0x Exchange
  ]

  try {
    let count = 0

    for (const contract of DEFI_CONTRACTS.slice(0, 3)) { // Limit API calls
      const res = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`
      )
      const data = await res.json()

      if (data.status === '1' && data.result) {
        const hasInteraction = data.result.some(
          (tx: { to: string }) => tx.to?.toLowerCase() === contract.toLowerCase()
        )
        if (hasInteraction) count++
      }
    }

    return count
  } catch (error) {
    console.error('Error checking DeFi protocols:', error)
    return 0
  }
}

// Calculate badges based on on-chain data
export function calculateBadges(profile: Partial<UserProfile>): BadgeType[] {
  const badges: BadgeType[] = []

  // OG Degen: 3+ years on-chain
  if (profile.first_tx_date) {
    const yearsActive = (Date.now() - new Date(profile.first_tx_date).getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (yearsActive >= 3) {
      badges.push('og_degen')
    }
  }

  // NFT Collector: Has NFTs
  if (profile.nft_count && profile.nft_count >= 5) {
    badges.push('nft_collector')
  }

  // DAO Contributor: Has voted in DAOs
  if (profile.dao_votes && profile.dao_votes >= 5) {
    badges.push('dao_contributor')
  }

  // DeFi Native: Used DeFi protocols
  if (profile.defi_protocols_used && profile.defi_protocols_used >= 2) {
    badges.push('defi_native')
  }

  // Builder: Deployed contracts
  if (profile.contracts_deployed && profile.contracts_deployed >= 1) {
    badges.push('builder')
  }

  return badges
}

// Full profile sync
export async function syncOnChainProfile(address: string): Promise<Partial<UserProfile>> {
  const [firstTxDate, txCount, nftCount, daoVotes, defiProtocols, contractsDeployed] = await Promise.all([
    getFirstTxDate(address),
    getTxCount(address),
    getNFTCount(address),
    getSnapshotVotes(address),
    getDeFiProtocolCount(address),
    getContractsDeployed(address),
  ])

  return {
    wallet_address: address,
    first_tx_date: firstTxDate?.toISOString() || null,
    total_tx_count: txCount,
    nft_count: nftCount,
    dao_votes: daoVotes,
    defi_protocols_used: defiProtocols,
    contracts_deployed: contractsDeployed,
    reputation_score: calculateReputationScore({
      total_tx_count: txCount,
      nft_count: nftCount,
      dao_votes: daoVotes,
      defi_protocols_used: defiProtocols,
      contracts_deployed: contractsDeployed,
    }),
    last_synced_at: new Date().toISOString(),
  }
}

// Calculate reputation score
function calculateReputationScore(data: Partial<UserProfile>): number {
  let score = 0

  score += Math.min((data.total_tx_count || 0) / 10, 20) // Max 20 from tx count
  score += Math.min((data.nft_count || 0) * 2, 20) // Max 20 from NFTs
  score += Math.min((data.dao_votes || 0) * 3, 30) // Max 30 from DAO
  score += Math.min((data.defi_protocols_used || 0) * 5, 15) // Max 15 from DeFi
  score += Math.min((data.contracts_deployed || 0) * 10, 15) // Max 15 from building

  return Math.round(score)
}

// Check token balance for gating
export async function checkTokenBalance(
  address: string,
  contractAddress: string,
  type: 'erc20' | 'erc721' | 'erc1155',
  minBalance: number = 1,
  tokenId?: string
): Promise<boolean> {
  try {
    if (type === 'erc20') {
      const res = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
      )
      const data = await res.json()
      const balance = parseInt(data.result || '0')
      return balance >= minBalance
    }

    if (type === 'erc721') {
      // Use Alchemy for NFT balance
      if (!ALCHEMY_API_KEY) return false

      const res = await fetch(
        `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/isHolderOfContract?wallet=${address}&contractAddress=${contractAddress}`
      )
      const data = await res.json()
      return data.isHolderOfContract === true
    }

    if (type === 'erc1155' && tokenId) {
      // Would need specific ERC1155 balance check
      return false
    }

    return false
  } catch (error) {
    console.error('Error checking token balance:', error)
    return false
  }
}
