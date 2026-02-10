import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Read Web3 insights, career advice, and industry analysis from the NEUN community.',
  openGraph: {
    title: 'Articles | NEUN',
    description: 'Read Web3 insights, career advice, and industry analysis from the NEUN community.',
  },
}

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
