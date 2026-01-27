import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Web3 Jobs Platform - 글로벌 & 국내 Web3 채용 공고',
  description: '40개 이상의 사이트에서 자동으로 수집한 최신 Web3 채용 정보',
}

/**
 * 테마 초기화 스크립트 — React 하이드레이션 전에 실행
 * FOUC(Flash of Unstyled Content) 방지를 위해 blocking script 사용
 */
const themeScript = `
(function() {
  var stored = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
