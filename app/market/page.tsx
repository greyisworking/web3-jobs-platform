import Footer from '@/app/components/Footer'
import TrendsDashboard from './TrendsDashboard'

export const revalidate = 3600

export default function MarketPage() {
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

        {/* Trends Dashboard (Client Component) */}
        <TrendsDashboard />

        {/* Footer note */}
        <div className="text-center mt-6">
          <p className="text-[9px] text-a24-muted/30 dark:text-a24-dark-muted/30 uppercase tracking-[0.3em] font-light">
            updated hourly · data from all active job postings
          </p>
        </div>

      </main>
      <Footer />
    </div>
  )
}
