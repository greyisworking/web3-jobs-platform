import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

export const metadata: Metadata = {
  title: 'Web3 Job Market Trends — Hiring Data, Skill Demand, Tech Stacks',
  description: 'Real-time Web3 job market trends. Track weekly hiring volume, top companies, skill demand by category, remote work rates, and tech stack rankings across thousands of positions.',
  keywords: ['web3 market trends', 'crypto hiring data', 'blockchain job market', 'web3 skill demand', 'tech stack ranking'],
  alternates: {
    canonical: `${baseUrl}/market`,
  },
  openGraph: {
    title: 'Web3 Job Market Trends — Hiring Data, Skill Demand, Tech Stacks | NEUN',
    description: 'Real-time Web3 job market trends. Track hiring volume, skill demand, and tech stack rankings.',
    url: `${baseUrl}/market`,
    siteName: 'NEUN',
    type: 'website',
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: 'NEUN - Web3 Market Trends' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Job Market Trends | NEUN',
    description: 'Real-time Web3 job market trends. Track hiring volume, skill demand, and tech stack rankings.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@neun_io',
  },
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return children
}
