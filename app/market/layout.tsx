import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

export const metadata: Metadata = {
  title: 'Web3 Job Market Trends — Salary Data, Skill Analysis, Hiring Insights',
  description: 'Real-time Web3 job market intelligence. Track in-demand skills like Solidity & Rust, salary benchmarks, hiring trends, and remote work rates across 2,400+ positions.',
  keywords: ['web3 market trends', 'crypto salary data', 'blockchain hiring', 'defi job market', 'web3 skills demand', 'solidity developer salary'],
  alternates: {
    canonical: `${baseUrl}/market`,
  },
  openGraph: {
    title: 'Web3 Job Market Trends — Salary Data, Skill Analysis, Hiring Insights | NEUN',
    description: 'Real-time Web3 job market intelligence. Track in-demand skills, salary benchmarks, and hiring trends.',
    url: `${baseUrl}/market`,
    siteName: 'NEUN',
    type: 'website',
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: 'NEUN - Web3 Market Trends' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Job Market Trends | NEUN',
    description: 'Real-time Web3 job market intelligence. Track in-demand skills, salary benchmarks, and hiring trends.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@neun_io',
  },
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return children
}
