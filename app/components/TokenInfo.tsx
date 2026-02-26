'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { type TokenInfo, formatPrice, formatMarketCap } from '@/lib/api/coingecko'
import { type ProtocolTVL, formatTVL } from '@/lib/api/defillama'
import { PixelToken, PixelChart, PixelTrendUp, PixelTrendDown } from './PixelIcons'

// ══════════════════════════════════════════════════════════
// Mini Token Display (for cards)
// ══════════════════════════════════════════════════════════

interface MiniTokenProps {
  symbol?: string
  price?: number
  priceChange24h?: number
  className?: string
}

export function MiniToken({ symbol, price, priceChange24h, className }: MiniTokenProps) {
  if (!symbol) return null

  const isPositive = (priceChange24h ?? 0) >= 0

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-[10px]',
      'text-a24-muted dark:text-a24-dark-muted',
      className
    )}>
      <PixelToken size={10} className="text-neun-success dark:text-neun-success" />
      <span className="font-medium">${symbol}</span>
      {price !== undefined && (
        <span>{formatPrice(price)}</span>
      )}
      {priceChange24h !== undefined && (
        <span className={cn(
          'flex items-center gap-0.5',
          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        )}>
          {isPositive ? <PixelTrendUp size={8} /> : <PixelTrendDown size={8} />}
          {Math.abs(priceChange24h).toFixed(1)}%
        </span>
      )}
    </span>
  )
}

// ══════════════════════════════════════════════════════════
// Mini TVL Display (for cards)
// ══════════════════════════════════════════════════════════

interface MiniTVLProps {
  tvl?: number
  change24h?: number
  className?: string
}

export function MiniTVL({ tvl, change24h, className }: MiniTVLProps) {
  if (!tvl) return null

  const isPositive = (change24h ?? 0) >= 0

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-[10px]',
      'text-a24-muted dark:text-a24-dark-muted',
      className
    )}>
      <PixelChart size={10} className="text-blue-500 dark:text-blue-400" />
      <span className="font-medium">TVL</span>
      <span>{formatTVL(tvl)}</span>
      {change24h !== undefined && (
        <span className={cn(
          'flex items-center gap-0.5',
          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        )}>
          {isPositive ? '+' : ''}{change24h.toFixed(1)}%
        </span>
      )}
    </span>
  )
}

// ══════════════════════════════════════════════════════════
// Full Token Info Section (for detail pages)
// ══════════════════════════════════════════════════════════

interface TokenInfoSectionProps {
  tokenInfo?: TokenInfo | null
  tvlInfo?: ProtocolTVL | null
  className?: string
}

export function TokenInfoSection({ tokenInfo, tvlInfo, className }: TokenInfoSectionProps) {
  if (!tokenInfo && !tvlInfo) return null

  return (
    <div className={cn(
      'p-4 bg-a24-surface dark:bg-a24-dark-surface',
      'border border-a24-border dark:border-a24-dark-border',
      className
    )}>
      <h3 className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
        Market Data
      </h3>

      <div className="space-y-3">
        {/* Token info */}
        {tokenInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PixelToken size={14} className="text-neun-success dark:text-neun-success" />
              <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
                ${tokenInfo.symbol}
              </span>
              <span className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
                {tokenInfo.name}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {/* Price */}
              <div>
                <p className="text-a24-muted/60 dark:text-a24-dark-muted/60 mb-0.5">Price</p>
                <p className="text-a24-text dark:text-a24-dark-text font-medium">
                  {formatPrice(tokenInfo.currentPrice)}
                </p>
              </div>

              {/* Market Cap */}
              <div>
                <p className="text-a24-muted/60 dark:text-a24-dark-muted/60 mb-0.5">Market Cap</p>
                <p className="text-a24-text dark:text-a24-dark-text font-medium">
                  {formatMarketCap(tokenInfo.marketCap)}
                </p>
              </div>

              {/* 24h Change */}
              <div>
                <p className="text-a24-muted/60 dark:text-a24-dark-muted/60 mb-0.5">24h</p>
                <p className={cn(
                  'font-medium flex items-center gap-1',
                  tokenInfo.priceChange24h >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {tokenInfo.priceChange24h >= 0 ? (
                    <PixelTrendUp size={10} />
                  ) : (
                    <PixelTrendDown size={10} />
                  )}
                  {tokenInfo.priceChange24h >= 0 ? '+' : ''}
                  {tokenInfo.priceChange24h.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TVL info */}
        {tvlInfo && (
          <div className={cn(
            'space-y-2',
            tokenInfo && 'pt-3 border-t border-a24-border dark:border-a24-dark-border'
          )}>
            <div className="flex items-center gap-2">
              <PixelChart size={14} className="text-blue-500 dark:text-blue-400" />
              <span className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
                DeFi Protocol
              </span>
              <span className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
                {tvlInfo.category}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {/* TVL */}
              <div>
                <p className="text-a24-muted/60 dark:text-a24-dark-muted/60 mb-0.5">TVL</p>
                <p className="text-a24-text dark:text-a24-dark-text font-medium">
                  {formatTVL(tvlInfo.tvl)}
                </p>
              </div>

              {/* 24h Change */}
              <div>
                <p className="text-a24-muted/60 dark:text-a24-dark-muted/60 mb-0.5">24h</p>
                <p className={cn(
                  'font-medium',
                  tvlInfo.change_1d >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {tvlInfo.change_1d >= 0 ? '+' : ''}{tvlInfo.change_1d.toFixed(2)}%
                </p>
              </div>

              {/* 7d Change */}
              <div>
                <p className="text-a24-muted/60 dark:text-a24-dark-muted/60 mb-0.5">7d</p>
                <p className={cn(
                  'font-medium',
                  tvlInfo.change_7d >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {tvlInfo.change_7d >= 0 ? '+' : ''}{tvlInfo.change_7d.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Chain */}
            <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
              Chain: {tvlInfo.chain}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Data Fetching Hook
// ══════════════════════════════════════════════════════════

interface UseTokenDataOptions {
  company: string
  hasToken?: boolean
  sector?: string
}

interface TokenData {
  tokenInfo: TokenInfo | null
  tvlInfo: ProtocolTVL | null
  loading: boolean
}

export function useTokenData({ company, hasToken, sector }: UseTokenDataOptions): TokenData {
  const [data, setData] = useState<TokenData>({
    tokenInfo: null,
    tvlInfo: null,
    loading: true,
  })

  useEffect(() => {
    async function fetchData() {
      setData((prev) => ({ ...prev, loading: true }))

      try {
        const results: TokenData = {
          tokenInfo: null,
          tvlInfo: null,
          loading: false,
        }

        // Fetch token info if company has token
        if (hasToken) {
          const res = await fetch(`/api/token?company=${encodeURIComponent(company)}`)
          if (res.ok) {
            const tokenData = await res.json()
            if (tokenData.token) {
              results.tokenInfo = tokenData.token
            }
          }
        }

        // Fetch TVL if DeFi sector
        if (sector?.toLowerCase().includes('defi')) {
          const res = await fetch(`/api/tvl?company=${encodeURIComponent(company)}`)
          if (res.ok) {
            const tvlData = await res.json()
            if (tvlData.tvl) {
              results.tvlInfo = tvlData.tvl
            }
          }
        }

        setData(results)
      } catch {
        setData({ tokenInfo: null, tvlInfo: null, loading: false })
      }
    }

    fetchData()
  }, [company, hasToken, sector])

  return data
}

export default TokenInfoSection
