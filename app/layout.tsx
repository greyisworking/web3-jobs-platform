import type { Metadata, Viewport } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import { Toaster } from 'sonner'
import WebVitals from './components/WebVitals'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-body' })
const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-heading' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.io'),
  title: '는 neun — Web3 Jobs',
  description: 'Web3 jobs aggregated from 40+ global and Korean sources',
  openGraph: {
    siteName: '는 neun',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
}

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
      <body className={`${inter.variable} ${bebasNeue.variable} ${inter.className}`}>
        <WebVitals />
        {children}
        <Toaster
          position="bottom-right"
          theme="system"
          duration={3000}
          toastOptions={{
            className: 'bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark text-sub-charcoal dark:text-gray-200 !rounded-none',
          }}
        />
      </body>
    </html>
  )
}
