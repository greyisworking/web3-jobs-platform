import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bounties',
  description: 'Explore crypto bounties and earn rewards by contributing to Web3 projects.',
}

export default function BountiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
