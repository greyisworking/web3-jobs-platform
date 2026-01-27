import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Web3 Jobs Platform - 글로벌 & 국내 Web3 채용 공고',
  description: '40개 이상의 사이트에서 자동으로 수집한 최신 Web3 채용 정보',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
