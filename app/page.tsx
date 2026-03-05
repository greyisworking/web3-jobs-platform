import { getHeroData } from '@/lib/hero-data'
import { getFeaturedJobs } from '@/lib/featured-jobs'
import HeroTrendDashboard from './components/HeroTrendDashboard'
import HomeJobList from './components/HomeJobList'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import Footer from './components/Footer'

export const revalidate = 1800

export default async function Home() {
  const [heroData, jobs] = await Promise.all([
    getHeroData(),
    getFeaturedJobs(),
  ])

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg pixelbara-cursor">

      {/* Hero Trend Dashboard */}
      <HeroTrendDashboard data={heroData} />

      {/* Featured Jobs */}
      <HomeJobList jobs={jobs} />

      {/* PWA Install — mobile only, inline */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <PWAInstallPrompt />
      </section>

      <Footer />
    </div>
  )
}
