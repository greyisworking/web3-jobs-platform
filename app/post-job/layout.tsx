import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Post a Job',
  description: 'Post your Web3 job opening on NEUN and reach top blockchain talent.',
}

export default function PostJobLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
