import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Footer from '@/app/components/Footer'
import { getIntelligenceData } from '@/lib/intelligence-data'
import IntelligenceReport from './IntelligenceReport'
import SkillPathCards from './SkillPathCards'

export const revalidate = 3600

export default async function LearnPage() {
  const data = await getIntelligenceData()

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-10">

        {/* Page Header */}
        <section className="text-center py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-[0.25em] text-a24-text dark:text-a24-dark-text mb-3">
            Data-Driven Career Guide
          </h1>
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted font-light max-w-lg mx-auto">
            What the job market tells you about your next move
          </p>
          <div className="w-12 h-px bg-neun-success mx-auto mt-6" />
        </section>

        {/* Section 1: Career Intelligence (Heatmap + Salary + Market Maturity) */}
        <IntelligenceReport data={data} />

        {/* Section 2: Skill Paths */}
        <section className="mt-8 sm:mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-bold">
              Skill Paths
            </h2>
            <Link
              href="/learn/career"
              className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-neun-success hover:text-neun-success/80 transition-colors flex items-center gap-1"
            >
              all career paths <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <SkillPathCards data={data} />
        </section>

        {/* Section 3: Resource Library link */}
        <section className="mt-8 sm:mt-10 text-center py-8 border border-a24-border dark:border-a24-dark-border">
          <h2 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-bold mb-3">
            Resource Library
          </h2>
          <p className="text-xs text-a24-muted dark:text-a24-dark-muted mb-4">
            6 domains, 95+ curated resources. pick a topic and dive in.
          </p>
          <Link
            href="/learn/library"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neun-success text-white text-sm font-medium hover:bg-neun-success/90 transition-colors"
          >
            explore resources
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Footer note */}
        <div className="text-center mt-6">
          <p className="text-[9px] text-a24-muted/30 dark:text-a24-dark-muted/30 uppercase tracking-[0.3em] font-light">
            90-day rolling window · updated hourly · skills from actual job descriptions
          </p>
        </div>

      </main>
      <Footer />
    </div>
  )
}
