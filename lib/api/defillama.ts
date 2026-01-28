/**
 * DefiLlama API Client (Free, no auth required)
 * Fetches TVL data for DeFi protocols
 */

const BASE_URL = 'https://api.llama.fi'

export interface ProtocolTVL {
  id: string
  name: string
  symbol: string
  tvl: number
  change_1d: number
  change_7d: number
  chain: string
  category: string
}

interface DefiLlamaProtocol {
  id: string
  name: string
  symbol: string
  tvl: number
  change_1d: number | null
  change_7d: number | null
  chains: string[]
  category: string
  slug: string
}

// Protocol slug mapping for known companies
const PROTOCOL_MAPPING: Record<string, string> = {
  // Korean DeFi
  'Ozys': 'klayswap',
  'KLAYswap': 'klayswap',
  // Global DeFi
  'Uniswap': 'uniswap',
  'Aave': 'aave',
  'Compound': 'compound',
  'MakerDAO': 'makerdao',
  'Lido': 'lido',
  'Curve': 'curve',
  'Convex': 'convex-finance',
  'Yearn': 'yearn-finance',
  'SushiSwap': 'sushiswap',
  'PancakeSwap': 'pancakeswap',
  'GMX': 'gmx',
  'dYdX': 'dydx',
}

/**
 * Get all protocols (cached)
 */
let protocolsCache: DefiLlamaProtocol[] | null = null
let protocolsCacheTime = 0

async function getAllProtocols(): Promise<DefiLlamaProtocol[]> {
  const now = Date.now()
  // Cache for 1 hour
  if (protocolsCache && now - protocolsCacheTime < 3600000) {
    return protocolsCache
  }

  try {
    const res = await fetch(`${BASE_URL}/protocols`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return []

    const data: DefiLlamaProtocol[] = await res.json()
    protocolsCache = data
    protocolsCacheTime = now
    return data
  } catch {
    console.error('DefiLlama protocols fetch failed')
    return protocolsCache || []
  }
}

/**
 * Search for a protocol by company/project name
 */
export async function searchProtocol(name: string): Promise<string | null> {
  // Check mapping first
  const mappedSlug = PROTOCOL_MAPPING[name]
  if (mappedSlug) return mappedSlug

  const protocols = await getAllProtocols()
  const lower = name.toLowerCase()

  // Try exact match first
  const exact = protocols.find(
    (p) => p.name.toLowerCase() === lower || p.slug.toLowerCase() === lower
  )
  if (exact) return exact.slug

  // Try partial match
  const partial = protocols.find(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      lower.includes(p.name.toLowerCase())
  )
  if (partial) return partial.slug

  return null
}

/**
 * Get TVL data for a protocol
 */
export async function getProtocolTVL(slug: string): Promise<ProtocolTVL | null> {
  try {
    const res = await fetch(`${BASE_URL}/protocol/${slug}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data || !data.tvl) return null

    // Get current TVL from the tvl array
    const tvlData = Array.isArray(data.tvl)
      ? data.tvl[data.tvl.length - 1]?.totalLiquidityUSD
      : data.tvl

    return {
      id: data.id || slug,
      name: data.name || slug,
      symbol: data.symbol || '',
      tvl: tvlData || 0,
      change_1d: data.change_1d || 0,
      change_7d: data.change_7d || 0,
      chain: data.chains?.[0] || 'Multi-chain',
      category: data.category || 'DeFi',
    }
  } catch {
    console.error(`DefiLlama fetch failed for ${slug}`)
  }

  return null
}

/**
 * Get TVL by company name (convenience function)
 */
export async function getTVLByCompany(companyName: string): Promise<ProtocolTVL | null> {
  const slug = await searchProtocol(companyName)
  if (!slug) return null
  return getProtocolTVL(slug)
}

/**
 * Format TVL for display
 */
export function formatTVL(tvl: number): string {
  if (tvl >= 1e12) {
    return `$${(tvl / 1e12).toFixed(2)}T`
  }
  if (tvl >= 1e9) {
    return `$${(tvl / 1e9).toFixed(2)}B`
  }
  if (tvl >= 1e6) {
    return `$${(tvl / 1e6).toFixed(2)}M`
  }
  if (tvl >= 1e3) {
    return `$${(tvl / 1e3).toFixed(2)}K`
  }
  return `$${tvl.toFixed(2)}`
}

/**
 * Check if TVL is above threshold (for trust scoring)
 */
export function isTVLHealthy(tvl: number): boolean {
  return tvl >= 10_000_000 // $10M threshold
}
