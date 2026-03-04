import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

export const metadata: Metadata = {
  title: 'Web3 Companies & Projects Hiring Now',
  description: 'Explore VC-backed Web3 companies and blockchain projects actively hiring. Browse by investor, sector, and team size. Backed by a16z, Paradigm, Hashed, and 40+ top-tier VCs.',
  keywords: ['web3 companies', 'blockchain startups', 'crypto companies hiring', 'vc backed web3', 'defi projects'],
  alternates: {
    canonical: `${baseUrl}/ecosystem`,
  },
  openGraph: {
    title: 'Web3 Companies & Projects Hiring Now | NEUN',
    description: 'Explore VC-backed Web3 companies and blockchain projects actively hiring.',
    url: `${baseUrl}/ecosystem`,
    siteName: 'NEUN',
    type: 'website',
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: 'NEUN - Web3 Ecosystem' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Companies & Projects Hiring Now | NEUN',
    description: 'Explore VC-backed Web3 companies and blockchain projects actively hiring.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@neun_io',
  },
}

export default function EcosystemLayout({ children }: { children: React.ReactNode }) {
  return children
}
