import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

export const metadata: Metadata = {
  title: 'Web3 Career Guide — Skills, Salary & Learning Paths | NEUN',
  description: 'Data-driven career guide for Web3. Explore skill demand by experience level, salary benchmarks by region, curated learning paths, and career roadmaps powered by real job data.',
  keywords: ['web3 career guide', 'blockchain career path', 'web3 salary data', 'solidity skills', 'web3 learning resources', 'crypto job skills'],
  alternates: {
    canonical: `${baseUrl}/learn`,
  },
  openGraph: {
    title: 'Web3 Career Guide — Skills, Salary & Learning Paths | NEUN',
    description: 'Data-driven career guide for Web3. Skills, salaries, and learning paths from real job data.',
    url: `${baseUrl}/learn`,
    siteName: 'NEUN',
    type: 'website',
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: 'NEUN - Web3 Career Guide' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Career Guide | NEUN',
    description: 'Data-driven career guide for Web3. Skills, salaries, and learning paths from real job data.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@neun_io',
  },
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children
}
