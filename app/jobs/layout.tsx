import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jobs',
  description: 'Browse Web3 jobs from top VC-backed companies. Find your next role in crypto, DeFi, NFT, and blockchain.',
  openGraph: {
    title: 'Web3 Jobs | NEUN',
    description: 'Browse Web3 jobs from top VC-backed companies. Find your next role in crypto, DeFi, NFT, and blockchain.',
  },
}

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
