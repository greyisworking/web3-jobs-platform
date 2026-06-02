import type { Metadata } from 'next'
import Footer from '../components/Footer'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

export const metadata: Metadata = {
  title: 'About NEUN — Real-Time Web3 Job Market Intelligence',
  description: 'NEUN is a Web3 job aggregator tracking 1,000+ positions from 40+ sources. Updated every 3 hours with market intelligence, skill trends, and salary data.',
  alternates: {
    canonical: `${baseUrl}/about`,
  },
  openGraph: {
    title: 'About NEUN — Real-Time Web3 Job Market Intelligence',
    description: 'NEUN is a Web3 job aggregator tracking 1,000+ positions from 40+ sources.',
    url: `${baseUrl}/about`,
    siteName: 'NEUN',
    type: 'website',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16">
        {children}
      </main>
      <Footer />
    </div>
  )
}
