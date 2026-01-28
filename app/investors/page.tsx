'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, TrendingUp } from 'lucide-react'
import { PRIORITY_COMPANIES } from '@/lib/priority-companies'
import Pixelbara from '../components/Pixelbara'

// Extract unique VCs with descriptions
const VC_INFO: Record<string, { description: string; website?: string; tier: 'top' | 'major' | 'notable' }> = {
  'a16z': {
    description: 'Andreessen Horowitz - Most influential crypto VC globally',
    website: 'https://a16z.com',
    tier: 'top',
  },
  Paradigm: {
    description: 'Crypto-native, research-driven investment fund',
    website: 'https://paradigm.xyz',
    tier: 'top',
  },
  Hashed: {
    description: "Asia's largest blockchain-focused venture fund",
    website: 'https://hashed.com',
    tier: 'top',
  },
  Kakao: {
    description: 'Korean tech giant investing in blockchain innovation',
    website: 'https://kakao.com',
    tier: 'major',
  },
  'Kakao Ventures': {
    description: 'Early-stage Web3 investor from Kakao ecosystem',
    website: 'https://kakaoventures.com',
    tier: 'major',
  },
  Dunamu: {
    description: 'Upbit operator, digital asset ecosystem builder',
    website: 'https://dunamu.com',
    tier: 'major',
  },
  SoftBank: {
    description: 'Global tech investment leader with blockchain portfolio',
    website: 'https://softbank.com',
    tier: 'major',
  },
  'Animoca Brands': {
    description: 'GameFi & metaverse pioneer, 400+ portfolio companies',
    website: 'https://animocabrands.com',
    tier: 'major',
  },
  Binance: {
    description: "World's largest crypto exchange with Labs arm",
    website: 'https://binance.com',
    tier: 'major',
  },
  'LINE Corporation': {
    description: 'LINE-based blockchain services and ecosystem',
    website: 'https://linecorp.com',
    tier: 'major',
  },
  'Mirae Asset': {
    description: 'Korean financial giant with digital asset focus',
    website: 'https://miraeasset.com',
    tier: 'notable',
  },
  'KB Investment': {
    description: 'KB Financial Group blockchain fintech arm',
    website: 'https://kbic.co.kr',
    tier: 'notable',
  },
  'Samsung Next': {
    description: 'Samsung strategic investment arm for emerging tech',
    website: 'https://samsungnext.com',
    tier: 'notable',
  },
  Wemade: {
    description: 'Blockchain gaming leader with WEMIX platform',
    website: 'https://wemade.com',
    tier: 'notable',
  },
}

interface VCData {
  name: string
  description: string
  website?: string
  tier: 'top' | 'major' | 'notable'
  portfolioCount: number
  companies: string[]
}

// Generate URL-safe slug from VC name
function vcToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function InvestorCard({ vc, index }: { vc: VCData; index: number }) {
  const [hovered, setHovered] = useState(false)
  const slug = vcToSlug(vc.name)

  return (
    <Link href={`/investors/${slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative p-6 h-full bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      >
        {/* Tier badge */}
        <span className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium tracking-wider ${
          vc.tier === 'top'
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            : vc.tier === 'major'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {vc.tier === 'top' ? 'TOP TIER' : vc.tier === 'major' ? 'MAJOR' : 'NOTABLE'}
        </span>

        {/* VC name */}
        <h3 className="text-xl font-semibold text-a24-text dark:text-a24-dark-text mb-2 pr-20 group-hover:underline decoration-1 underline-offset-4">
          {vc.name}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-a24-muted dark:text-a24-dark-muted mb-4 line-clamp-2">
          {vc.description}
        </p>

        {/* Portfolio count */}
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-a24-muted/60 dark:text-a24-dark-muted/60" />
          <span className="text-[12px] text-a24-muted dark:text-a24-dark-muted">
            <strong className="text-a24-text dark:text-a24-dark-text">{vc.portfolioCount}</strong> companies hiring
          </span>
        </div>

        {/* Portfolio companies preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {vc.companies.slice(0, 3).map((company) => (
            <span
              key={company}
              className="px-2 py-0.5 text-[10px] bg-a24-bg dark:bg-a24-dark-bg text-a24-muted dark:text-a24-dark-muted border border-a24-border/50 dark:border-a24-dark-border/50"
            >
              {company}
            </span>
          ))}
          {vc.companies.length > 3 && (
            <span className="px-2 py-0.5 text-[10px] text-a24-muted/60 dark:text-a24-dark-muted/60">
              +{vc.companies.length - 3} more
            </span>
          )}
        </div>

        {/* View profile link */}
        <span className="inline-flex items-center gap-1.5 text-[11px] text-a24-muted dark:text-a24-dark-muted group-hover:text-a24-text dark:group-hover:text-a24-dark-text transition-colors">
          View portfolio
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
        </span>

        {/* Hover meme */}
        {hovered && (
          <span className="absolute top-1 left-4 text-[9px] text-a24-muted/40 dark:text-a24-dark-muted/40 italic">
            smart money bestie
          </span>
        )}
      </motion.div>
    </Link>
  )
}

export default function InvestorsPage() {
  const [selectedTier, setSelectedTier] = useState<'all' | 'top' | 'major' | 'notable'>('all')

  // Build VC data from priority companies
  const vcData = useMemo(() => {
    const vcMap = new Map<string, { companies: Set<string> }>()

    PRIORITY_COMPANIES.forEach((company) => {
      company.backers.forEach((backer) => {
        if (!vcMap.has(backer)) {
          vcMap.set(backer, { companies: new Set() })
        }
        vcMap.get(backer)!.companies.add(company.name)
      })
    })

    const result: VCData[] = []

    vcMap.forEach((data, name) => {
      const info = VC_INFO[name]
      if (info) {
        result.push({
          name,
          description: info.description,
          website: info.website,
          tier: info.tier,
          portfolioCount: data.companies.size,
          companies: Array.from(data.companies),
        })
      } else {
        result.push({
          name,
          description: 'Web3 investor',
          tier: 'notable',
          portfolioCount: data.companies.size,
          companies: Array.from(data.companies),
        })
      }
    })

    // Sort by tier then by portfolio count
    const tierOrder = { top: 0, major: 1, notable: 2 }
    result.sort((a, b) => {
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier]
      if (tierDiff !== 0) return tierDiff
      return b.portfolioCount - a.portfolioCount
    })

    return result
  }, [])

  const filteredVCs = useMemo(() => {
    if (selectedTier === 'all') return vcData
    return vcData.filter((vc) => vc.tier === selectedTier)
  }, [vcData, selectedTier])

  const totalPortfolio = vcData.reduce((sum, vc) => sum + vc.portfolioCount, 0)

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-a24-text dark:text-a24-dark-text mb-3">
              Investors
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {vcData.length} VCs backing {totalPortfolio}+ Web3 companies
            </p>
          </div>
          <Pixelbara pose="investors" size={100} clickable />
        </div>

        {/* Tier filters */}
        <div className="flex gap-2 mb-8">
          {(['all', 'top', 'major', 'notable'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 text-[11px] uppercase tracking-wider transition-all ${
                selectedTier === tier
                  ? 'bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg'
                  : 'bg-a24-surface dark:bg-a24-dark-surface text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text'
              }`}
            >
              {tier === 'all' ? 'All VCs' : tier}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-center">
            <p className="text-2xl font-semibold text-a24-text dark:text-a24-dark-text">
              {vcData.filter((v) => v.tier === 'top').length}
            </p>
            <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider">
              Top Tier VCs
            </p>
          </div>
          <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-center">
            <p className="text-2xl font-semibold text-a24-text dark:text-a24-dark-text">
              {vcData.filter((v) => v.tier === 'major').length}
            </p>
            <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider">
              Major VCs
            </p>
          </div>
          <div className="p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-center">
            <p className="text-2xl font-semibold text-a24-text dark:text-a24-dark-text">
              {PRIORITY_COMPANIES.length}
            </p>
            <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider">
              Portfolio Cos
            </p>
          </div>
        </div>

        {/* VCs grid */}
        {filteredVCs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-a24-border dark:bg-a24-dark-border">
            {filteredVCs.map((vc, index) => (
              <InvestorCard key={vc.name} vc={vc} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Pixelbara pose="dejected" size={120} />
            <p className="mt-4 text-a24-muted dark:text-a24-dark-muted text-sm">
              no VCs found... few understand
            </p>
          </div>
        )}

        {/* Bottom section */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider mb-4">
            backed by the best. building the future.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-wider bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg hover:opacity-80 transition-opacity"
          >
            Browse all jobs
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </main>
    </div>
  )
}
