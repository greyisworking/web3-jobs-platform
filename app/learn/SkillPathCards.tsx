'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { IntelligenceData } from '@/lib/intelligence-data'

interface SkillPathCardsProps {
  data: IntelligenceData
}

const PATHS = [
  {
    roleKey: 'engineering',
    title: 'Become a Smart Contract Developer',
    description: 'Solidity, Rust, and protocol engineering. The backbone of web3.',
    href: '/jobs?role=engineering',
    color: 'border-blue-500/30 hover:border-blue-500',
    accent: 'text-blue-400',
    bg: 'bg-blue-500/5',
  },
  {
    roleKey: 'marketing',
    title: 'Break into Web3 Marketing',
    description: 'Community, growth, content, and brand. Shape the narrative.',
    href: '/jobs?role=marketing',
    color: 'border-pink-500/30 hover:border-pink-500',
    accent: 'text-pink-400',
    bg: 'bg-pink-500/5',
  },
  {
    roleKey: 'bd',
    title: 'Web3 Business Development',
    description: 'Partnerships, sales, and ecosystem growth. Connect the dots.',
    href: '/jobs?role=bd',
    color: 'border-amber-500/30 hover:border-amber-500',
    accent: 'text-amber-400',
    bg: 'bg-amber-500/5',
  },
  {
    roleKey: 'ops',
    title: 'Web3 Operations & Compliance',
    description: 'Legal, finance, HR, and risk management. Keep things running.',
    href: '/jobs?role=ops',
    color: 'border-cyan-500/30 hover:border-cyan-500',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/5',
  },
] as const

function formatSalary(min: number, max: number): string {
  if (!min && !max) return 'N/A'
  const fmtK = (v: number) => `$${Math.round(v / 1000)}k`
  return `${fmtK(min)} - ${fmtK(max)}`
}

export default function SkillPathCards({ data }: SkillPathCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PATHS.map((path) => {
        const role = data.roles[path.roleKey]
        if (!role) return null

        const topSkills = role.hotSkills.slice(0, 3).map(s => s.skill)

        return (
          <Link
            key={path.roleKey}
            href={path.href}
            className={`group block p-5 sm:p-6 border transition-all duration-300 ${path.color} ${path.bg} hover:bg-opacity-10`}
          >
            <h3 className="text-sm sm:text-base font-medium text-a24-text dark:text-a24-dark-text group-hover:text-neun-success transition-colors mb-2">
              {path.title}
            </h3>
            <p className="text-xs text-a24-muted dark:text-a24-dark-muted mb-4 leading-relaxed">
              {path.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs mb-4">
              <span className="text-a24-text dark:text-a24-dark-text">
                <span className={`font-medium ${path.accent}`}>{role.jobCount}</span> jobs
              </span>
              {(role.avgSalaryMin > 0 || role.avgSalaryMax > 0) && (
                <span className="text-a24-muted dark:text-a24-dark-muted">
                  {formatSalary(role.avgSalaryMin, role.avgSalaryMax)} avg
                </span>
              )}
              <span className="text-a24-muted dark:text-a24-dark-muted">
                {role.remotePercent}% remote
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] px-2 py-0.5 bg-a24-surface dark:bg-a24-dark-surface text-a24-muted dark:text-a24-dark-muted border border-a24-border/50 dark:border-a24-dark-border/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <ArrowRight className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted group-hover:text-neun-success transition-colors flex-shrink-0" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
