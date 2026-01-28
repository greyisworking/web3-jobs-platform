import type { Metadata, Viewport } from 'next'
import { Inter, Caveat, VT323 } from 'next/font/google'
import { Toaster } from 'sonner'
import WebVitals from './components/WebVitals'
import Navigation from './components/Navigation'
import PageTransition from './components/PageTransition'
import KonamiEasterEgg from './components/KonamiEasterEgg'
import TouchGrassReminder from './components/TouchGrassReminder'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['200', '300', '400', '500', '700'], display: 'swap', variable: '--font-body' })
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-script' })
const vt323 = VT323({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-pixel' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.io'),
  title: 'Neun — Web3 Careers',
  description: 'Web3 jobs aggregated from 40+ global and Korean sources',
  openGraph: {
    siteName: 'Neun',
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
  if (stored === 'light') {
  } else {
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${caveat.variable} ${vt323.variable} ${inter.className}`}>
        <WebVitals />
        <PageTransition />
        <Navigation />
        {children}
        <KonamiEasterEgg />
        <TouchGrassReminder />
        <Toaster
          position="bottom-right"
          theme="system"
          duration={3000}
          toastOptions={{
            className: 'bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text !rounded-none',
          }}
        />
      </body>
    </html>
  )
}
