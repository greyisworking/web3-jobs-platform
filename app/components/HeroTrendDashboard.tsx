'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { HeroData } from '@/lib/hero-data'
import Pixelbara from './Pixelbara'

interface HeroTrendDashboardProps {
  data: HeroData
}

export default function HeroTrendDashboard({ data }: HeroTrendDashboardProps) {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Hero — one focus, generous space */}
      <div className="pt-20 sm:pt-28 md:pt-32 pb-6 sm:pb-8">
        <p className="text-[13px] text-a24-muted/50 dark:text-a24-dark-muted/50 tracking-wider mb-4">
          Right now, Web3 is hiring for
        </p>

        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-8">
          {data.hotSkills.map((skill) => (
            <span
              key={skill.name}
              className="text-5xl sm:text-6xl md:text-7xl font-bold text-a24-text dark:text-a24-dark-text tracking-tighter"
            >
              {skill.name}
            </span>
          ))}
        </div>

        <p className="text-base sm:text-lg text-a24-muted/70 dark:text-a24-dark-muted/70 font-light max-w-xl leading-relaxed mb-10">
          Real jobs from VC-backed companies. 40+ sources, updated every 3 hours.
          No scams, no rugs.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/jobs"
            className="group inline-flex items-center justify-center gap-2 text-sm font-medium bg-neun-success text-white px-6 py-3 rounded-md hover:bg-neun-success/90 transition-colors duration-200"
          >
            Browse Jobs
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://t.me/neunwtf_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 text-sm font-medium border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text px-6 py-3 rounded-md hover:border-neun-success/50 hover:text-neun-success transition-all duration-200"
          >
            Search on Telegram
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>

      {/* Pixelbara accent */}
      <div className="flex justify-end pr-4 -mt-4 mb-4">
        <Pixelbara pose="heroLaptop" size={80} clickable suppressHover />
      </div>
    </section>
  )
}
