import Footer from '@/app/components/Footer'
import { getIntelligenceData } from '@/lib/intelligence-data'
import IntelligenceReport from './IntelligenceReport'

export const revalidate = 3600

export default async function LearnPage() {
  const data = await getIntelligenceData()

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-10">

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
