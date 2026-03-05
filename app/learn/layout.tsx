import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

export const metadata: Metadata = {
  title: 'Find Your Web3 Career Path — Interactive Quiz & Roadmap | NEUN',
  description: 'Answer 3 questions and get a personalized Web3 career roadmap with real-time job data, salary benchmarks, skill requirements, and curated learning resources.',
  keywords: ['web3 career quiz', 'blockchain career path', 'web3 roadmap', 'crypto job guide', 'web3 skills', 'solidity career'],
  alternates: {
    canonical: `${baseUrl}/learn`,
  },
  openGraph: {
    title: 'Find Your Web3 Career Path | NEUN',
    description: 'Answer 3 questions and get a personalized Web3 career roadmap powered by real job data.',
    url: `${baseUrl}/learn`,
    siteName: 'NEUN',
    type: 'website',
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: 'NEUN - Web3 Career Quiz' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Your Web3 Career Path | NEUN',
    description: 'Answer 3 questions and get a personalized Web3 career roadmap powered by real job data.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@neun_io',
  },
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children
}
