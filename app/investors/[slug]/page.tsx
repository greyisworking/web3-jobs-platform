'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams, notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ExternalLink, Building2, Briefcase, Globe, TrendingUp } from 'lucide-react'
import { PRIORITY_COMPANIES, type PriorityCompany } from '@/lib/priority-companies'
import type { Job } from '@/types/job'
import Pixelbara from '../../components/Pixelbara'
import JobCard from '../../components/JobCard'
import { JobCardSkeletonGrid } from '../../components/JobCardSkeleton'

// VC Info database
const VC_INFO: Record<string, {
  description: string
  longDescription?: string
  website?: string
  twitter?: string
  tier: 'top' | 'major' | 'notable'
  founded?: string
  headquarters?: string
  aum?: string
  focusAreas?: string[]
}> = {
  'a16z': {
    description: 'Andreessen Horowitz - Most influential crypto VC globally',
    longDescription: 'a16z crypto is a dedicated fund investing in crypto networks and the companies building on them. Led by crypto veterans with deep technical expertise.',
    website: 'https://a16z.com/crypto',
    twitter: 'https://twitter.com/a16zcrypto',
    tier: 'top',
    founded: '2018',
    headquarters: 'Menlo Park, CA',
    aum: '$7.6B',
    focusAreas: ['DeFi', 'Infrastructure', 'Web3 Social', 'Gaming'],
  },
  'paradigm': {
    description: 'Crypto-native, research-driven investment fund',
    longDescription: 'Paradigm is a research-driven technology investment firm focused on crypto/Web3. Founded by Coinbase co-founder Fred Ehrsam and former Sequoia partner Matt Huang.',
    website: 'https://paradigm.xyz',
    twitter: 'https://twitter.com/paradigm',
    tier: 'top',
    founded: '2018',
    headquarters: 'San Francisco, CA',
    aum: '$10B+',
    focusAreas: ['DeFi', 'Infrastructure', 'MEV Research', 'Protocols'],
  },
  'hashed': {
    description: "Asia's largest blockchain-focused venture fund",
    longDescription: 'Hashed is Asia\u0027s leading blockchain-focused venture fund, investing in early-stage startups that are building the future of Web3. Based in Seoul with global reach.',
    website: 'https://hashed.com',
    twitter: 'https://twitter.com/haborkim',
    tier: 'top',
    founded: '2017',
    headquarters: 'Seoul, Korea',
    aum: '$500M+',
    focusAreas: ['Korean Web3', 'Gaming', 'Infrastructure', 'DeFi'],
  },
  'kakao': {
    description: 'Korean tech giant investing in blockchain innovation',
    longDescription: 'Kakao Corporation is Korea\u0027s largest tech company, building blockchain services through Kakao\u0027s Ground X and Klaytn ecosystem.',
    website: 'https://kakao.com',
    tier: 'major',
    headquarters: 'Jeju, Korea',
    focusAreas: ['Klaytn Ecosystem', 'NFT', 'Payment'],
  },
  'kakao-ventures': {
    description: 'Early-stage Web3 investor from Kakao ecosystem',
    website: 'https://kakaoventures.com',
    tier: 'major',
    headquarters: 'Seoul, Korea',
  },
  'dunamu': {
    description: 'Upbit operator, digital asset ecosystem builder',
    longDescription: 'Dunamu operates Upbit, one of the largest crypto exchanges in Korea. Actively invests in blockchain infrastructure and services.',
    website: 'https://dunamu.com',
    tier: 'major',
    headquarters: 'Seoul, Korea',
    focusAreas: ['Exchange', 'NFT', 'Infrastructure'],
  },
  'softbank': {
    description: 'Global tech investment leader with blockchain portfolio',
    website: 'https://softbank.com',
    tier: 'major',
    headquarters: 'Tokyo, Japan',
    aum: '$100B+',
  },
  'animoca-brands': {
    description: 'GameFi & metaverse pioneer, 400+ portfolio companies',
    longDescription: 'Animoca Brands is a leader in digital entertainment, blockchain, and gamification. Invested in over 400 Web3 companies.',
    website: 'https://animocabrands.com',
    tier: 'major',
    headquarters: 'Hong Kong',
    focusAreas: ['Gaming', 'Metaverse', 'NFT'],
  },
  'binance': {
    description: "World's largest crypto exchange with Labs arm",
    website: 'https://binance.com',
    tier: 'major',
    headquarters: 'Global',
    focusAreas: ['DeFi', 'Infrastructure', 'BNB Chain'],
  },
  'line-corporation': {
    description: 'LINE-based blockchain services and ecosystem',
    website: 'https://linecorp.com',
    tier: 'major',
    headquarters: 'Tokyo, Japan',
    focusAreas: ['Messaging', 'NFT', 'Finschia'],
  },
  'mirae-asset': {
    description: 'Korean financial giant with digital asset focus',
    website: 'https://miraeasset.com',
    tier: 'notable',
    headquarters: 'Seoul, Korea',
  },
  'kb-investment': {
    description: 'KB Financial Group blockchain fintech arm',
    website: 'https://kbic.co.kr',
    tier: 'notable',
    headquarters: 'Seoul, Korea',
  },
  'samsung-next': {
    description: 'Samsung strategic investment arm for emerging tech',
    website: 'https://samsungnext.com',
    tier: 'notable',
    headquarters: 'San Francisco, CA',
  },
  'wemade': {
    description: 'Blockchain gaming leader with WEMIX platform',
    website: 'https://wemade.com',
    tier: 'notable',
    headquarters: 'Seoul, Korea',
    focusAreas: ['Gaming', 'WEMIX'],
  },
}

// Convert slug to VC name
function slugToVCName(slug: string): string | null {
  // Direct match in VC_INFO
  if (VC_INFO[slug]) {
    return slug
  }

  // Try to find in priority companies backers
  for (const company of PRIORITY_COMPANIES) {
    for (const backer of company.backers) {
      const backerSlug = backer.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      if (backerSlug === slug) {
        return backer
      }
    }
  }

  return null
}

// Get all companies backed by this VC
function getPortfolioCompanies(vcName: string): PriorityCompany[] {
  return PRIORITY_COMPANIES.filter((company) =>
    company.backers.some((b) => b.toLowerCase() === vcName.toLowerCase())
  )
}

export default function InvestorDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  // Find VC info
  const vcKey = slugToVCName(slug)
  const vcInfo = vcKey ? VC_INFO[vcKey.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')] : null
  const vcName = vcKey || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Get portfolio companies
  const portfolioCompanies = useMemo(() => {
    if (!vcKey) return []
    return getPortfolioCompanies(vcKey)
  }, [vcKey])

  // Fetch jobs for portfolio companies
  useEffect(() => {
    if (portfolioCompanies.length === 0) {
      setLoading(false)
      return
    }

    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        const companyNames = portfolioCompanies.map((c) => c.name.toLowerCase())
        const aliases = portfolioCompanies.flatMap((c) => c.aliases.map((a) => a.toLowerCase()))
        const allNames = [...companyNames, ...aliases]

        const filteredJobs = (data.jobs || []).filter((job: Job) =>
          allNames.some((name) => job.company.toLowerCase().includes(name) || name.includes(job.company.toLowerCase()))
        )
        setJobs(filteredJobs.slice(0, 12))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [portfolioCompanies])

  // 404 for unknown VCs with no portfolio
  if (!vcInfo && portfolioCompanies.length === 0) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Back link */}
        <Link
          href="/ecosystem?tab=investors"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          All Investors
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12"
        >
          <div className="flex-1">
            {/* Tier badge */}
            {vcInfo && (
              <span className={`inline-block px-2 py-0.5 text-[10px] font-medium tracking-wider mb-3 ${
                vcInfo.tier === 'top'
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : vcInfo.tier === 'major'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {vcInfo.tier === 'top' ? 'TOP TIER VC' : vcInfo.tier === 'major' ? 'MAJOR VC' : 'NOTABLE VC'}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-a24-text dark:text-a24-dark-text mb-4">
              {vcName}
            </h1>

            <p className="text-a24-muted dark:text-a24-dark-muted text-base mb-6">
              {vcInfo?.longDescription || vcInfo?.description || 'Web3 Investor'}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mb-6">
              {portfolioCompanies.length > 0 && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-a24-muted/60" />
                  <span className="text-sm text-a24-text dark:text-a24-dark-text font-medium">
                    {portfolioCompanies.length} portfolio companies
                  </span>
                </div>
              )}
              {vcInfo?.aum && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-a24-muted/60" />
                  <span className="text-sm text-a24-muted dark:text-a24-dark-muted">
                    {vcInfo.aum} AUM
                  </span>
                </div>
              )}
              {vcInfo?.headquarters && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-a24-muted/60" />
                  <span className="text-sm text-a24-muted dark:text-a24-dark-muted">
                    {vcInfo.headquarters}
                  </span>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-3">
              {vcInfo?.website && (
                <a
                  href={vcInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-wider border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Website
                </a>
              )}
              {vcInfo?.twitter && (
                <a
                  href={vcInfo.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-wider border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
                >
                  Twitter
                </a>
              )}
            </div>
          </div>

          {/* Pixelbara */}
          <Pixelbara pose="investors" size={140} clickable />
        </motion.div>

        {/* Focus areas */}
        {vcInfo?.focusAreas && vcInfo.focusAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-3">
              Investment Focus
            </h2>
            <div className="flex flex-wrap gap-2">
              {vcInfo.focusAreas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1.5 text-[12px] bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text"
                >
                  {area}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Portfolio companies */}
        {portfolioCompanies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-lg font-semibold text-a24-text dark:text-a24-dark-text mb-4">
              Portfolio Companies
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {portfolioCompanies.map((company) => (
                <Link
                  key={company.name}
                  href={`/jobs?company=${encodeURIComponent(company.name)}`}
                  className="group p-4 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text transition-all"
                >
                  <h3 className="font-medium text-a24-text dark:text-a24-dark-text group-hover:underline">
                    {company.name}
                  </h3>
                  <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted mt-1">
                    {company.sector}
                  </p>
                  <span className={`inline-block mt-2 px-1.5 py-0.5 text-[9px] ${
                    company.tier === 'P0'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : company.tier === 'P1'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {company.tier}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Jobs from portfolio */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-a24-text dark:text-a24-dark-text flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Open Positions
            </h2>
            {jobs.length > 0 && (
              <Link
                href={`/jobs?vc=${encodeURIComponent(vcName)}`}
                className="text-[11px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {loading ? (
            <JobCardSkeletonGrid count={6} />
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center border border-a24-border dark:border-a24-dark-border">
              <Pixelbara pose="empty" size={100} className="mx-auto mb-4" />
              <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
                no open positions rn... check back later bestie
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-a24-border dark:bg-a24-dark-border">
              {jobs.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider mb-4">
            backed by {vcName}. probably gonna make it.
          </p>
          <Link
            href="/jobs"
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
