'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, MapPin, Briefcase, Building2 } from 'lucide-react'
import { PRIORITY_COMPANIES, type PriorityCompany } from '@/lib/priority-companies'
import GlowBadge from '../components/GlowBadge'
import Pixelbara from '../components/Pixelbara'

const SECTORS = ['All', ...Array.from(new Set(PRIORITY_COMPANIES.map(c => c.sector))).sort()]
const TIERS = ['All', 'P0', 'P1', 'P2']

function CompanyCard({ company, index }: { company: PriorityCompany; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative p-6 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border hover:-translate-y-1 transition-all duration-300"
    >
      {/* Tier badge */}
      <span className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium tracking-wider ${
        company.tier === 'P0'
          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
          : company.tier === 'P1'
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
      }`}>
        {company.tier}
      </span>

      {/* Company name */}
      <h3 className="text-lg font-semibold text-a24-text dark:text-a24-dark-text mb-2 pr-12">
        {company.name}
      </h3>

      {/* Sector */}
      <p className="text-[13px] text-a24-muted dark:text-a24-dark-muted flex items-center gap-1.5 mb-3">
        <Briefcase className="w-3.5 h-3.5" />
        {company.sector}
      </p>

      {/* Location */}
      <p className="text-[12px] text-a24-muted/70 dark:text-a24-dark-muted/70 flex items-center gap-1.5 mb-4">
        <MapPin className="w-3 h-3" />
        {company.office_location}
      </p>

      {/* VC Backers */}
      {company.backers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {company.backers.map((backer) => (
            <GlowBadge key={backer} name={backer} />
          ))}
        </div>
      )}

      {/* Token badge */}
      {company.hasToken && (
        <span className="inline-block px-2 py-0.5 text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 tracking-wider">
          HAS TOKEN
        </span>
      )}

      {/* Career link */}
      {company.careerUrl && (
        <Link
          href={company.careerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 p-2 text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}

      {/* Hover meme */}
      {hovered && (
        <span className="absolute top-1 left-4 text-[9px] text-a24-muted/40 dark:text-a24-dark-muted/40 italic">
          probably hiring ser
        </span>
      )}
    </motion.div>
  )
}

export default function CompaniesPage() {
  const [selectedSector, setSelectedSector] = useState('All')
  const [selectedTier, setSelectedTier] = useState('All')

  const filteredCompanies = useMemo(() => {
    return PRIORITY_COMPANIES.filter(company => {
      if (selectedSector !== 'All' && company.sector !== selectedSector) return false
      if (selectedTier !== 'All' && company.tier !== selectedTier) return false
      return true
    })
  }, [selectedSector, selectedTier])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-a24-text dark:text-a24-dark-text mb-3">
              Companies
            </h1>
            <p className="text-a24-muted dark:text-a24-dark-muted text-sm">
              {filteredCompanies.length} Web3 companies from Korea&apos;s top VC portfolios
            </p>
          </div>
          <Pixelbara pose="bling" size={80} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Sector filter */}
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

          {/* Tier filter */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-a24-border dark:bg-a24-dark-border">
            {filteredCompanies.map((company, index) => (
              <CompanyCard key={company.name} company={company} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Pixelbara pose="dejected" size={120} />
            <p className="mt-4 text-a24-muted dark:text-a24-dark-muted text-sm">
              no companies found... ngmi
            </p>
          </div>
        )}

        {/* Bottom meme */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider">
            ser, these companies are hiring. what are you waiting for?
          </p>
        </div>
      </main>
    </div>
  )
}
