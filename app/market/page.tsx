'use client'

import { useState } from 'react'
import Footer from '@/app/components/Footer'
import SkillHeatmap from './SkillHeatmap'
import SkillDetailPanel from './SkillDetailPanel'
import TrendsDashboard from './TrendsDashboard'

const REGION_OPTIONS = [
  { label: 'All', value: 'all', icon: '🌐' },
  { label: 'Korea', value: 'korea', icon: '🇰🇷' },
  { label: 'US', value: 'us', icon: '🇺🇸' },
  { label: 'Remote', value: 'remote', icon: '🌍' },
] as const

export default function MarketPage() {
  const [region, setRegion] = useState('all')
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  const handleSkillClick = (skillName: string) => {
    setSelectedSkill(prev => prev === skillName ? null : skillName)
  }

  const handleLevelClick = (level: string | null) => {
    setSelectedLevel(level)
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-10">

        {/* Page Header */}
        <section className="text-center py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-[0.25em] text-a24-text dark:text-a24-dark-text mb-3">
            Web3 Job Market Trends
          </h1>
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted font-light max-w-lg mx-auto">
            Real-time hiring data, skill demand, and market signals
          </p>
          <div className="w-12 h-px bg-neun-success mx-auto mt-6" />
        </section>

        {/* Region Filter */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {REGION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRegion(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 ${
                region === opt.value
                  ? 'bg-neun-primary/20 text-neun-primary ring-1 ring-neun-primary/30'
                  : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text hover:bg-a24-surface/50 dark:hover:bg-a24-dark-surface/50'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Skill Heatmap */}
        <SkillHeatmap
          region={region}
          selectedSkill={selectedSkill}
          selectedLevel={selectedLevel}
          onSkillClick={handleSkillClick}
          onLevelClick={handleLevelClick}
        />

        {/* Skill Detail Panel (slides open on skill click) */}
        <SkillDetailPanel
          skillName={selectedSkill}
          region={region}
          level={selectedLevel}
        />

        {/* Trends Dashboard */}
        <TrendsDashboard region={region} level={selectedLevel} />

        {/* Footer note */}
        <div className="text-center mt-6">
          <p className="text-[9px] text-a24-muted/30 dark:text-a24-dark-muted/30 uppercase tracking-[0.3em] font-light">
            Updated hourly · Based on all active listings
          </p>
        </div>

      </main>
      <Footer />
    </div>
  )
}
