'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  MapPin,
  Briefcase,
  ExternalLink,
  ArrowRight,
  Building2,
  TrendingUp,
} from 'lucide-react'
import { PRIORITY_COMPANIES, type PriorityCompany } from '@/lib/priority-companies'
import GlowBadge from '../components/GlowBadge'
import Pixelbara from '../components/Pixelbara'
import { useJobs } from '@/hooks/useJobs'
import Footer from '../components/Footer'

// ============ Companies Tab Components ============
const SECTORS = ['All', ...Array.from(new Set(PRIORITY_COMPANIES.map(c => c.sector))).sort()]
const TIERS = ['All', 'P0', 'P1', 'P2']

interface CompanyCardProps {
  company: PriorityCompany
  index: number
  jobCount: number
}

function CompanyCard({ company, index, jobCount }: CompanyCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35, delay: (index % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative p-6 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border hover:-translate-y-1 transition-all duration-300"
    >
      <span className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium tracking-wider ${
        company.tier === 'P0'
          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
          : company.tier === 'P1'
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
      }`}>
        {company.tier}
      </span>

      <h3 className="text-lg font-semibold text-a24-text dark:text-a24-dark-text mb-2 pr-12">
        {company.name}
      </h3>

      <p className="text-[13px] text-a24-muted dark:text-a24-dark-muted flex items-center gap-1.5 mb-3">
        <Briefcase className="w-3.5 h-3.5" />
        {company.sector}
      </p>

      <p className="text-[12px] text-a24-muted/70 dark:text-a24-dark-muted/70 flex items-center gap-1.5 mb-4">
        <MapPin className="w-3 h-3" />
        {company.office_location}
      </p>

      {jobCount > 0 && (
        <Link
          href={`/jobs?company=${encodeURIComponent(company.name)}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-neun-primary/10 text-neun-primary hover:bg-neun-primary/20 transition-colors rounded mb-3"
        >
          <span className="font-medium">{jobCount}</span>
          <span>open positions</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      )}

      {company.backers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {company.backers.map((backer) => (
            <GlowBadge key={backer} name={backer} />
          ))}
        </div>
      )}

      {company.hasToken && (
        <span className="inline-block px-2 py-0.5 text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 tracking-wider">
          HAS TOKEN
        </span>
      )}

      {company.careerUrl && (
        <Link
          href={company.careerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 p-2 text-a24-muted dark:text-a24-dark-muted hover:text-neun-primary transition-colors"
          title="View careers page"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      )}

      {hovered && (
        <span className="absolute top-1 left-4 text-[9px] text-a24-muted/40 dark:text-a24-dark-muted/40 italic">
          lowkey hiring rn
        </span>
      )}
    </motion.div>
  )
}

// ============ Investors Tab Components ============
const VC_INFO: Record<string, { description: string; website?: string; tier: 'top' | 'major' | 'notable' }> = {
  'a16z': { description: 'Andreessen Horowitz - Most influential crypto VC globally', website: 'https://a16z.com', tier: 'top' },
  Paradigm: { description: 'Crypto-native, research-driven investment fund', website: 'https://paradigm.xyz', tier: 'top' },
  Hashed: { description: "Asia's largest blockchain-focused venture fund", website: 'https://hashed.com', tier: 'top' },
  Kakao: { description: 'Korean tech giant investing in blockchain innovation', website: 'https://kakao.com', tier: 'major' },
  'Kakao Ventures': { description: 'Early-stage Web3 investor from Kakao ecosystem', website: 'https://kakaoventures.com', tier: 'major' },
  Dunamu: { description: 'Upbit operator, digital asset ecosystem builder', website: 'https://dunamu.com', tier: 'major' },
  SoftBank: { description: 'Global tech investment leader with blockchain portfolio', website: 'https://softbank.com', tier: 'major' },
  'Animoca Brands': { description: 'GameFi & metaverse pioneer, 400+ portfolio companies', website: 'https://animocabrands.com', tier: 'major' },
  Binance: { description: "World's largest crypto exchange with Labs arm", website: 'https://binance.com', tier: 'major' },
  'LINE Corporation': { description: 'LINE-based blockchain services and ecosystem', website: 'https://linecorp.com', tier: 'major' },
  'Mirae Asset': { description: 'Korean financial giant with digital asset focus', website: 'https://miraeasset.com', tier: 'notable' },
  'KB Investment': { description: 'KB Financial Group blockchain fintech arm', website: 'https://kbic.co.kr', tier: 'notable' },
  'Samsung Next': { description: 'Samsung strategic investment arm for emerging tech', website: 'https://samsungnext.com', tier: 'notable' },
  Wemade: { description: 'Blockchain gaming leader with WEMIX platform', website: 'https://wemade.com', tier: 'notable' },
}

interface VCData {
  name: string
  description: string
  website?: string
  tier: 'top' | 'major' | 'notable'
  portfolioCount: number
  companies: string[]
}

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
        <span className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium tracking-wider ${
          vc.tier === 'top'
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            : vc.tier === 'major'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {vc.tier === 'top' ? 'TOP TIER' : vc.tier === 'major' ? 'MAJOR' : 'NOTABLE'}
        </span>

        <h3 className="text-xl font-semibold text-a24-text dark:text-a24-dark-text mb-2 pr-20 group-hover:underline decoration-1 underline-offset-4">
          {vc.name}
        </h3>

        <p className="text-[13px] text-a24-muted dark:text-a24-dark-muted mb-4 line-clamp-2">
          {vc.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-a24-muted/60 dark:text-a24-dark-muted/60" />
          <span className="text-[12px] text-a24-muted dark:text-a24-dark-muted">
            <strong className="text-a24-text dark:text-a24-dark-text">{vc.portfolioCount}</strong> companies hiring
          </span>
        </div>

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

        <span className="inline-flex items-center gap-1.5 text-[11px] text-a24-muted dark:text-a24-dark-muted group-hover:text-a24-text dark:group-hover:text-a24-dark-text transition-colors">
          View portfolio
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
        </span>

        {hovered && (
          <span className="absolute top-1 left-4 text-[9px] text-a24-muted/40 dark:text-a24-dark-muted/40 italic">
            smart money bestie
          </span>
        )}
      </motion.div>
    </Link>
  )
}

// ============ Main Component ============
function EcosystemContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'companies' | 'investors'>(
    tabParam === 'investors' ? 'investors' : 'companies'
  )

  // Companies state
  const [selectedSector, setSelectedSector] = useState('All')
  const [selectedTier, setSelectedTier] = useState('All')
  const { jobs } = useJobs()

  // Investors state
  const [selectedVCTier, setSelectedVCTier] = useState<'all' | 'top' | 'major' | 'notable'>('all')

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === 'investors' && activeTab !== 'investors') {
      setActiveTab('investors')
    } else if (tabParam === 'companies' && activeTab !== 'companies') {
      setActiveTab('companies')
    } else if (!tabParam && activeTab !== 'companies') {
      setActiveTab('companies')
    }
  }, [tabParam, activeTab])

  const handleTabChange = (tab: 'companies' | 'investors') => {
    setActiveTab(tab)
    router.push(`/ecosystem?tab=${tab}`, { scroll: false })
  }

  // Companies data
  const jobCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const job of jobs) {
      const companyName = job.company?.toLowerCase() || ''
      for (const company of PRIORITY_COMPANIES) {
        const names = [company.name.toLowerCase(), ...company.aliases.map(a => a.toLowerCase())]
        if (names.some(name => companyName.includes(name) || name.includes(companyName))) {
          counts[company.name] = (counts[company.name] || 0) + 1
          break
        }
      }
    }
    return counts
  }, [jobs])

  const filteredCompanies = useMemo(() => {
    return PRIORITY_COMPANIES.filter(company => {
      if (selectedSector !== 'All' && company.sector !== selectedSector) return false
      if (selectedTier !== 'All' && company.tier !== selectedTier) return false
      return true
    }).sort((a, b) => {
      const countA = jobCounts[a.name] || 0
      const countB = jobCounts[b.name] || 0
      if (countB !== countA) return countB - countA
      return a.name.localeCompare(b.name)
    })
  }, [selectedSector, selectedTier, jobCounts])

  const companiesWithJobs = useMemo(() => {
    return filteredCompanies.filter(c => (jobCounts[c.name] || 0) > 0).length
  }, [filteredCompanies, jobCounts])

  // Investors data
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

    const tierOrder = { top: 0, major: 1, notable: 2 }
    result.sort((a, b) => {
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier]
      if (tierDiff !== 0) return tierDiff
      return b.portfolioCount - a.portfolioCount
    })

    return result
  }, [])

  const filteredVCs = useMemo(() => {
    if (selectedVCTier === 'all') return vcData
    return vcData.filter((vc) => vc.tier === selectedVCTier)
  }, [vcData, selectedVCTier])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-a24-text dark:text-a24-dark-text mb-3">
              Ecosystem
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
              {activeTab === 'companies'
                ? `${filteredCompanies.length} Web3 companies${companiesWithJobs > 0 ? ` · ${companiesWithJobs} actively hiring` : ''}`
                : `${vcData.length} VCs backing ${PRIORITY_COMPANIES.length}+ Web3 companies`}
            </p>
          </div>
          <Pixelbara pose={activeTab === 'companies' ? 'companies' : 'investors'} size={100} clickable />
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-0 mb-8 border-b border-a24-border dark:border-a24-dark-border">
          <button
            onClick={() => handleTabChange('companies')}
            className={`relative px-6 py-3 text-[11px] uppercase tracking-wider font-medium transition-colors ${
              activeTab === 'companies'
                ? 'text-neun-success'
                : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
            }`}
          >
            Companies
            {activeTab === 'companies' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neun-success" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('investors')}
            className={`relative px-6 py-3 text-[11px] uppercase tracking-wider font-medium transition-colors ${
              activeTab === 'investors'
                ? 'text-neun-success'
                : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
            }`}
          >
            Investors
            {activeTab === 'investors' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neun-success" />
            )}
          </button>
        </div>

        {/* Companies Tab Content */}
        {activeTab === 'companies' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex flex-wrap gap-2">
                {SECTORS.slice(0, 8).map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={`px-3 py-1.5 text-[11px] uppercase tracking-wider transition-all ${
                      selectedSector === sector
                        ? 'bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg'
                        : 'bg-a24-surface dark:bg-a24-dark-surface text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 ml-auto">
                {TIERS.map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-3 py-1.5 text-[11px] uppercase tracking-wider transition-all ${
                      selectedTier === tier
                        ? 'bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg'
                        : 'bg-a24-surface dark:bg-a24-dark-surface text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border hover:border-a24-text dark:hover:border-a24-dark-text'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Companies grid */}
            {filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.map((company, index) => (
                  <CompanyCard
                    key={company.name}
                    company={company}
                    index={index}
                    jobCount={jobCounts[company.name] || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Pixelbara pose="success" size={120} className="mb-4" />
                <p className="text-sm text-a24-muted dark:text-a24-dark-muted">
                  No matching companies found
                </p>
              </div>
            )}

            <div className="mt-12 text-center">
              <p className="text-[11px] text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider">
                these companies are literally hiring. apply bestie.
              </p>
            </div>
          </>
        )}

        {/* Investors Tab Content */}
        {activeTab === 'investors' && (
          <>
            {/* Tier filters */}
            <div className="flex gap-2 mb-8">
              {(['all', 'top', 'major', 'notable'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedVCTier(tier)}
                  className={`px-4 py-2 text-[11px] uppercase tracking-wider transition-all ${
                    selectedVCTier === tier
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredVCs.map((vc, index) => (
                  <InvestorCard key={vc.name} vc={vc} index={index} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Pixelbara pose="building" size={120} className="mb-4" />
                <p className="text-sm text-a24-muted dark:text-a24-dark-muted">
                  no VCs found... few understand
                </p>
              </div>
            )}

            <div className="mt-12 text-center">
              <p className="text-[11px] text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider mb-4">
                backed by the best. building the future.
              </p>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-wider bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg hover:opacity-80 transition-opacity"
              >
                Browse all jobs
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function EcosystemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center">
        <div className="w-6 h-6 border border-a24-muted border-t-a24-text rounded-full animate-spin" />
      </div>
    }>
      <EcosystemContent />
    </Suspense>
  )
}
