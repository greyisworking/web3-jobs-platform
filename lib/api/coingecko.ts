/**
 * CoinGecko API Client (Free tier)
 * Fetches token information including price, market cap, and 24h change
 */

const BASE_URL = 'https://api.coingecko.com/api/v3'

export interface TokenInfo {
  id: string
  symbol: string
  name: string
  currentPrice: number
  priceChange24h: number
  marketCap: number
  image?: string
}

interface CoinGeckoSearchResult {
  coins: {
    id: string
    name: string
    symbol: string
    thumb: string
  }[]
}

interface CoinGeckoMarketData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  price_change_percentage_24h: number
}

// Token ID mapping for known companies
const TOKEN_MAPPING: Record<string, string> = {
  // Korean projects
  'Klaytn': 'klay-token',
  'Kaia': 'klay-token',
  'WEMIX': 'wemix-token',
  'Wemade': 'wemix-token',
  'ICON': 'icon',
  'ICONLOOP': 'icon',
  'Somesing': 'somesing',
  'Bora': 'bora',
  'Kakao Games': 'bora',
  'Planetarium': 'nine-chronicles-gold',
  // Global projects
  'Uniswap': 'uniswap',
  'Aave': 'aave',
  'Compound': 'compound-governance-token',
  'MakerDAO': 'maker',
  'Lido': 'lido-dao',
  'Arbitrum': 'arbitrum',
  'Optimism': 'optimism',
  'Polygon': 'matic-network',
}

/**
 * Search for a token by company name
 */
export async function searchToken(companyName: string): Promise<string | null> {
  // Check mapping first
  const mappedId = TOKEN_MAPPING[companyName]
  if (mappedId) return mappedId

  try {
    const res = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(companyName)}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!res.ok) return null

    const data: CoinGeckoSearchResult = await res.json()
    if (data.coins && data.coins.length > 0) {
      // Return first matching coin
      return data.coins[0].id
    }
  } catch {
    console.error(`CoinGecko search failed for ${companyName}`)
  }

  return null
}

/**
 * Get token info by CoinGecko ID
 */
export async function getTokenInfo(tokenId: string): Promise<TokenInfo | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&ids=${tokenId}&sparkline=false`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    if (!res.ok) return null

    const data: CoinGeckoMarketData[] = await res.json()
    if (!data || data.length === 0) return null

    const coin = data[0]
    return {
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      currentPrice: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      image: coin.image,
    }
  } catch {
    console.error(`CoinGecko fetch failed for ${tokenId}`)
  }

  return null
}

/**
 * Get token info by company name (convenience function)
 */
export async function getTokenInfoByCompany(companyName: string): Promise<TokenInfo | null> {
  const tokenId = await searchToken(companyName)
  if (!tokenId) return null
  return getTokenInfo(tokenId)
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}K`
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`
  }
  if (price >= 0.01) {
    return `$${price.toFixed(4)}`
  }
  return `$${price.toFixed(6)}`
}

/**
 * Format market cap for display
 */
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(1)}T`
  }
  if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(1)}B`
  }
  if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(1)}M`
  }
  return `$${(marketCap / 1e3).toFixed(1)}K`
}
