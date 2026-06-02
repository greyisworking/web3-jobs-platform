'use client'

import { useState } from 'react'
import Footer from '@/app/components/Footer'
import SkillHeatmap from './SkillHeatmap'
import SkillDetailPanel from './SkillDetailPanel'
import TrendsDashboard from './TrendsDashboard'
import SkillAdjacencyMap from './SkillAdjacencyMap'

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
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-xl sm:text-2xl font-semibold text-a24-text dark:text-a24-dark-text tracking-tight mb-2">
            Market Intelligence
          </h1>
          <p className="text-sm text-a24-muted/60 dark:text-a24-dark-muted/60">
            Real-time hiring data, skill demand, and market signals
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-1.5 mb-8">
          {REGION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRegion(opt.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-md transition-all duration-200 ${
                region === opt.value
                  ? 'bg-neun-success/15 text-neun-success'
                  : 'text-a24-muted/60 dark:text-a24-dark-muted/60 hover:text-a24-text dark:hover:text-a24-dark-text'
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

        {/* Skill Detail Panel */}
        <SkillDetailPanel
          skillName={selectedSkill}
          region={region}
          level={selectedLevel}
        />

        {/* Trends Dashboard */}
        <TrendsDashboard region={region} level={selectedLevel} />

        {/* Skill Adjacency Map */}
        <SkillAdjacencyMap />

        {/* Footer note */}
        <p className="text-center mt-8 text-[10px] text-a24-muted/30 dark:text-a24-dark-muted/30">
          Updated hourly · Based on all active listings
        </p>

      </main>
      <Footer />
    </div>
  )
}
