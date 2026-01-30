import type { Metadata, Viewport } from 'next'
import { Inter, Caveat, Press_Start_2P } from 'next/font/google'
import { Toaster } from 'sonner'
import WebVitals from './components/WebVitals'
import Navigation from './components/Navigation'
import PageTransition from './components/PageTransition'
import KonamiEasterEgg from './components/KonamiEasterEgg'
import TouchGrassReminder from './components/TouchGrassReminder'
import { Web3Provider } from './components/Web3Provider'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import ErrorBoundary from './components/ErrorBoundary'
import Onboarding from './components/Onboarding'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['200', '300', '400', '500', '700'], display: 'swap', variable: '--font-body' })
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-script' })
const pressStart = Press_Start_2P({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-pixel' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'),
  title: {
    default: 'NEUN — Web3 Careers from Top VC Portfolios',
    template: '%s | NEUN',
  },
  description: 'Find Web3 jobs from a16z, Paradigm, Hashed portfolio companies. Curated blockchain, DeFi, and crypto careers from 40+ global and Korean sources.',
  keywords: [
    'Web3 jobs', 'crypto jobs', 'blockchain careers', 'DeFi jobs',
    'a16z portfolio', 'Paradigm portfolio', 'Hashed portfolio',
    'Web3 careers Korea', 'blockchain developer jobs', 'crypto startup jobs',
    'NFT jobs', 'smart contract developer', 'Web3 remote jobs',
  ],
  authors: [{ name: 'NEUN' }],
  creator: 'NEUN',
  publisher: 'NEUN',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://neun.wtf',
    siteName: 'NEUN',
    title: 'NEUN — Web3 Careers from Top VC Portfolios',
    description: 'Find Web3 jobs from a16z, Paradigm, Hashed portfolio companies. Curated blockchain, DeFi, and crypto careers.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NEUN - Web3 Careers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEUN — Web3 Careers from Top VC Portfolios',
    description: 'Find Web3 jobs from a16z, Paradigm, Hashed portfolio companies.',
    images: ['/og-image.png'],
    creator: '@neun_io',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NEUN',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#22C55E',
    'msapplication-tap-highlight': 'no',
  },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22C55E' },
    { media: '(prefers-color-scheme: dark)', color: '#22C55E' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        {/* PWA Apple icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon-96x96.svg" />
        {/* Splash screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} ${caveat.variable} ${pressStart.variable} ${inter.className}`}>
        <Web3Provider>
          <WebVitals />
          <PageTransition />
          <Navigation />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Onboarding />
          <KonamiEasterEgg />
          <TouchGrassReminder />
          <ServiceWorkerRegistration />
          <PWAInstallPrompt />
          <Toaster
            position="bottom-right"
            theme="system"
            duration={3000}
            toastOptions={{
              className: 'bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text !rounded-none',
            }}
          />
        </Web3Provider>
      </body>
    </html>
  )
}
