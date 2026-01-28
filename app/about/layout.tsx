import type { Metadata } from 'next'
import SubpageHeader from '../components/SubpageHeader'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: 'About — Neun',
  description: 'About Neun — Web3 careers aggregated from 40+ global and Korean sources.',
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
