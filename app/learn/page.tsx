import Footer from '@/app/components/Footer'
import Pixelbara from '@/app/components/Pixelbara'
import { getIntelligenceData } from '@/lib/intelligence-data'
import IntelligenceReport from './IntelligenceReport'
import LearnCountUp from './LearnCountUp'

export const revalidate = 3600

export default async function LearnPage() {
  const data = await getIntelligenceData()

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-10">

        {/* Header */}
        <header className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-light uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text">
                Intelligence
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-neun-success animate-pulse" />
                <span className="text-[9px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-widest font-light">
                  live
                </span>
              </div>
            </div>
            <p className="text-[10px] text-a24-muted/60 dark:text-a24-dark-muted/60 font-light tracking-wide">
              Skills extracted from{' '}
              <span className="text-a24-text dark:text-a24-dark-text font-medium">{data.totalJobs.toLocaleString()}+</span>{' '}
              real JDs ·{' '}
              <span className="text-a24-text dark:text-a24-dark-text font-medium">{data.totalCompanies}</span>{' '}
              companies · VC-backed weighted 2x
            </p>
          </div>
          <div className="hidden md:block">
            <Pixelbara pose="coding" size={48} />
          </div>
        </header>

        {/* Top stats */}
        <section className="mb-5 grid grid-cols-3 gap-3">
          <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1">Active Jobs</p>
            <LearnCountUp value={data.totalJobs} className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text" />
          </div>
          <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1">Companies</p>
            <LearnCountUp value={data.totalCompanies} className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text" />
          </div>
          <div className="px-3 py-2.5 border border-a24-border dark:border-a24-dark-border rounded">
            <p className="text-[9px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted font-light mb-1">VC-backed</p>
            <span className="text-lg font-light tabular-nums text-a24-text dark:text-a24-dark-text">
              <LearnCountUp value={data.vcJobPercent} className="text-lg font-light tabular-nums" />%
            </span>
          </div>
        </section>

        {/* Intelligence Report (Client Component) */}
        <IntelligenceReport data={data} />

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
