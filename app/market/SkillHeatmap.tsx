'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SkillHeatmapProps {
  region: string
  selectedSkill: string | null
  selectedLevel: string | null
  onSkillClick: (skillName: string) => void
  onLevelClick: (level: string | null) => void
}

type SkillCategory = 'languages' | 'chains' | 'tools' | 'domains'

interface SkillsData {
  languages: { name: string; value: number }[]
  chains: { name: string; value: number }[]
  tools: { name: string; value: number }[]
  domains: { name: string; value: number }[]
  byLevel: Record<string, Record<string, number>>
  totalJobs: number
}

const SKILL_TABS: { label: string; value: SkillCategory }[] = [
  { label: '언어', value: 'languages' },
  { label: '체인', value: 'chains' },
  { label: '도구', value: 'tools' },
  { label: '도메인', value: 'domains' },
]

const LEVELS = ['entry', 'mid', 'senior', 'lead'] as const
const LEVEL_LABELS: Record<string, string> = {
  entry: 'ENTRY',
  mid: 'MID',
  senior: 'SENIOR',
  lead: 'LEAD',
}

interface HoveredCell {
  skill: string
  level: string
  count: number
}

function getCellColor(count: number, maxInColumn: number): string {
  if (count === 0 || maxInColumn === 0) return 'bg-transparent'
  const pct = (count / maxInColumn) * 100
  if (pct < 10) return 'bg-green-950/30'
  if (pct < 25) return 'bg-green-900/40'
  if (pct < 50) return 'bg-green-700/40'
  return 'bg-green-500/50'
}

export default function SkillHeatmap({
  region,
  selectedSkill,
  selectedLevel,
  onSkillClick,
  onLevelClick,
}: SkillHeatmapProps) {
  const [category, setCategory] = useState<SkillCategory>('languages')
  const [data, setData] = useState<SkillsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/market/trends/skills?period=30&region=${region}`)
      if (res.ok) {
        setData(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [region])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const skills = data?.[category] ?? []

  // Compute max count per column for color intensity
  const columnMaxes: Record<string, number> = {}
  for (const lv of LEVELS) {
    let max = 0
    for (const skill of skills) {
      const count = data?.byLevel[lv]?.[skill.name] ?? 0
      if (count > max) max = count
    }
    columnMaxes[lv] = max
  }

  const handleCellMouseMove = (
    e: React.MouseEvent,
    skill: string,
    level: string,
    count: number,
  ) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltipPos({
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 40,
      })
    }
    setHoveredCell({ skill, level, count })
  }

  const handleCellMouseLeave = () => {
    setHoveredCell(null)
  }

  const handleLevelClick = (level: string) => {
    if (selectedLevel === level) {
      onLevelClick(null)
    } else {
      onLevelClick(level)
    }
  }

  return (
    <section className="mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-a24-text dark:text-a24-dark-text">
          스킬 × 경력 히트맵
        </h2>
        {data && (
          <span className="text-[11px] text-a24-muted dark:text-a24-dark-muted">
            {data.totalJobs.toLocaleString()}개 공고 기준
          </span>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-4">
        {SKILL_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCategory(tab.value)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
              category === tab.value
                ? 'bg-neun-primary/20 text-neun-primary'
                : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-a24-dark-surface/50 rounded" />
          ))}
        </div>
      )}

      {/* Heatmap Grid */}
      {!loading && data && (
        <div ref={containerRef} className="relative overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-a24-border dark:border-a24-dark-border">
                <th className="text-left py-2 pr-3 font-medium text-a24-muted dark:text-a24-dark-muted sticky left-0 bg-a24-bg dark:bg-a24-dark-bg z-10">
                  Skill
                </th>
                {LEVELS.map((lv) => (
                  <th
                    key={lv}
                    onClick={() => handleLevelClick(lv)}
                    className={`text-center py-2 px-2 font-medium cursor-pointer transition-colors min-w-[80px] ${
                      selectedLevel === lv
                        ? 'text-green-400 font-bold'
                        : 'text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text'
                    }`}
                  >
                    {LEVEL_LABELS[lv]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const isSelectedRow = selectedSkill === skill.name
                return (
                  <tr
                    key={skill.name}
                    className={`border-b border-a24-border/30 dark:border-a24-dark-border/30 transition-all ${
                      isSelectedRow ? 'ring-1 ring-green-500/50 bg-green-500/5' : ''
                    }`}
                  >
                    <td
                      onClick={() => onSkillClick(skill.name)}
                      className="py-1.5 pr-3 text-a24-text dark:text-a24-dark-text cursor-pointer hover:text-neun-primary transition-colors sticky left-0 bg-a24-bg dark:bg-a24-dark-bg z-10 whitespace-nowrap"
                    >
                      {skill.name}
                    </td>
                    {LEVELS.map((lv) => {
                      const count = data.byLevel[lv]?.[skill.name] ?? 0
                      const colorClass = getCellColor(count, columnMaxes[lv])
                      const isSelectedCol = selectedLevel === lv
                      return (
                        <td
                          key={lv}
                          onMouseMove={(e) =>
                            handleCellMouseMove(e, skill.name, LEVEL_LABELS[lv], count)
                          }
                          onMouseLeave={handleCellMouseLeave}
                          className={`text-center py-1.5 px-2 min-w-[80px] transition-all duration-150 rounded-sm cursor-default ${colorClass} ${
                            count === 0
                              ? 'text-a24-dark-muted/30'
                              : 'text-a24-text dark:text-a24-dark-text'
                          } ${
                            isSelectedCol ? 'bg-green-500/10' : ''
                          } hover:shadow-[0_0_12px_rgba(34,197,94,0.2)] hover:scale-[1.03]`}
                        >
                          {count === 0 ? '-' : count}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {skills.length === 0 && (
                <tr>
                  <td
                    colSpan={LEVELS.length + 1}
                    className="py-6 text-center text-a24-muted dark:text-a24-dark-muted text-xs"
                  >
                    데이터가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Hover Tooltip */}
          <AnimatePresence>
            {hoveredCell && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute z-50 bg-[#1e293b] border border-green-500/30 rounded-lg px-3 py-2 shadow-lg pointer-events-none"
                style={{ left: tooltipPos.x, top: tooltipPos.y }}
              >
                <p className="text-white text-xs font-medium">
                  {hoveredCell.skill} × {hoveredCell.level}
                </p>
                <p className="text-green-400 text-sm font-bold">
                  {hoveredCell.count}건
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
