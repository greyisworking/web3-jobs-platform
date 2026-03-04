import type { Metadata } from 'next'
import SubpageHeader from '../components/SubpageHeader'
import Footer from '../components/Footer'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

export const metadata: Metadata = {
  title: 'About NEUN — Real-Time Web3 Job Market Intelligence',
  description: 'NEUN is a Web3 job aggregator tracking 2,400+ positions from 40+ sources. Updated every 3 hours with market intelligence, skill trends, and salary data.',
  alternates: {
    canonical: `${baseUrl}/about`,
  },
  openGraph: {
    title: 'About NEUN — Real-Time Web3 Job Market Intelligence',
    description: 'NEUN is a Web3 job aggregator tracking 2,400+ positions from 40+ sources.',
    url: `${baseUrl}/about`,
    siteName: 'NEUN',
    type: 'website',
  },
}

const ABOUT_TABS = [
  { href: '/about/story', label: 'Our Story' },
  { href: '/about/notice', label: 'Notice' },
  { href: '/about/press', label: 'Press' },
]

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <div className="max-w-3xl mx-auto px-6">
        <SubpageHeader title="A B O U T" tabs={ABOUT_TABS} />
      </div>
      <main className="max-w-3xl mx-auto px-6 pb-20">
        {children}
      </main>
      <Footer />
    </div>
  )
}
