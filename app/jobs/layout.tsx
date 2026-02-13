import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

export const metadata: Metadata = {
  title: 'Web3 Jobs | NEUN',
  description: 'Browse 1000+ Web3 jobs from a16z, Paradigm, Hashed backed companies. Find crypto, DeFi, NFT, and blockchain careers. Remote & Korea positions available.',
  keywords: ['web3 jobs', 'crypto jobs', 'blockchain careers', 'defi jobs', 'nft jobs', 'remote crypto jobs', 'korea web3 jobs'],
  alternates: {
    canonical: `${baseUrl}/jobs`,
  },
  openGraph: {
    title: 'Web3 Jobs | NEUN',
    description: 'Browse 1000+ Web3 jobs from top VC-backed companies. Find crypto, DeFi, NFT, and blockchain careers.',
    url: `${baseUrl}/jobs`,
    siteName: 'NEUN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'NEUN - Web3 Jobs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Jobs | NEUN',
    description: 'Browse 1000+ Web3 jobs from top VC-backed companies.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@neun_io',
  },
}

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
