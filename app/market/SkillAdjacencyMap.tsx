'use client'

import { useState, useEffect, useMemo } from 'react'

interface SkillInfo {
  name: string
  count: number
}

interface MatrixEntry {
  skill1: string
  skill2: string
  count: number
}

interface AdjacencyData {
  skills: SkillInfo[]
  matrix: MatrixEntry[]
  totalJobs: number
}

export default function SkillAdjacencyMap() {
  const [data, setData] = useState<AdjacencyData | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ s1: string; s2: string; count: number } | null>(null)

  useEffect(() => {
    fetch('/api/market/skill-adjacency')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
  }, [])

  const maxCount = useMemo(() => {
    if (!data?.matrix.length) return 1
    return Math.max(...data.matrix.map(m => m.count))
  }, [data])

  const getCount = (s1: string, s2: string): number => {
    if (!data) return 0
    const entry = data.matrix.find(
      m => (m.skill1 === s1 && m.skill2 === s2) || (m.skill1 === s2 && m.skill2 === s1)
    )
    return entry?.count || 0
  }

  if (!data || data.skills.length < 3) return null

  const skills = data.skills

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-a24-text dark:text-a24-dark-text">
            Skill Adjacency Map
          </h2>
          <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted mt-0.5">
            Skills that appear together in job postings — darker = more frequent pairing
          </p>
        </div>
      </div>

      {/* Insight placeholder */}
      <p className="text-[12px] leading-relaxed text-a24-muted/70 dark:text-a24-dark-muted/70 italic mb-4">
        [INSIGHT]
      </p>

      <div className="border border-a24-border dark:border-a24-dark-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-2 py-2 text-[9px] text-a24-muted dark:text-a24-dark-muted text-left bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border" />
                {skills.map(s => (
                  <th
                    key={s.name}
                    className="px-1 py-2 text-[8px] sm:text-[9px] font-medium text-a24-muted dark:text-a24-dark-muted bg-a24-surface/50 dark:bg-a24-dark-surface/50 border-b border-a24-border dark:border-a24-dark-border whitespace-nowrap"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', minWidth: 28, maxHeight: 80 }}
                  >
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((row, ri) => (
                <tr key={row.name}>
                  <td className="px-2 py-1.5 text-[9px] sm:text-[10px] font-medium text-a24-text dark:text-a24-dark-text whitespace-nowrap border-b border-a24-border/30 dark:border-a24-dark-border/30 bg-a24-surface/30 dark:bg-a24-dark-surface/30">
                    {row.name}
                    <span className="text-[8px] text-a24-muted/50 dark:text-a24-dark-muted/50 ml-1">({row.count})</span>
                  </td>
                  {skills.map((col, ci) => {
                    if (ri === ci) {
                      return (
                        <td key={col.name} className="border-b border-a24-border/30 dark:border-a24-dark-border/30">
                          <div className="w-full h-8 bg-a24-border/10 dark:bg-a24-dark-border/10" />
                        </td>
                      )
                    }
                    const count = getCount(row.name, col.name)
                    const intensity = count > 0 ? Math.max(0.15, count / maxCount) : 0
                    return (
                      <td
                        key={col.name}
                        className="border-b border-a24-border/30 dark:border-a24-dark-border/30 relative cursor-default"
                        onMouseEnter={() => count > 0 && setHoveredCell({ s1: row.name, s2: col.name, count })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className="w-full h-8 transition-colors duration-150"
                          style={{
                            backgroundColor: count > 0
                              ? `rgba(34, 197, 94, ${intensity})`
                              : 'transparent',
                          }}
                        />
                        {count > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium text-white/80">
                            {count}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hover info */}
        {hoveredCell && (
          <div className="px-4 py-2 bg-a24-surface/80 dark:bg-a24-dark-surface/80 border-t border-a24-border dark:border-a24-dark-border">
            <p className="text-[11px] text-a24-text dark:text-a24-dark-text">
              <span className="font-medium text-green-400">{hoveredCell.s1}</span>
              {' × '}
              <span className="font-medium text-green-400">{hoveredCell.s2}</span>
              {' — '}
              appear together in <span className="font-semibold">{hoveredCell.count}</span> job {hoveredCell.count === 1 ? 'posting' : 'postings'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
