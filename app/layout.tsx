import type { Metadata, Viewport } from 'next'
import { Inter, Caveat, Press_Start_2P, Space_Grotesk } from 'next/font/google'
import { Toaster } from 'sonner'
import WebVitals from './components/WebVitals'
import Navigation from './components/Navigation'
import PageTransition from './components/PageTransition'
import KonamiEasterEgg from './components/KonamiEasterEgg'
import TouchGrassReminder from './components/TouchGrassReminder'
import { Web3Provider } from './components/Web3Provider'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'
// PWAInstallPrompt moved to page.tsx inline (no longer global popup)
import ErrorBoundary from './components/ErrorBoundary'
import Onboarding from './components/Onboarding'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['200', '300', '400', '500', '700'], display: 'swap', variable: '--font-body' })
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-script' })
const pressStart = Press_Start_2P({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-pixel' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-space' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'),
  title: {
    default: 'NEUN | Web3 Jobs',
    template: '%s | NEUN',
  },
  description: 'a16z, Hashed, Paradigm backed companies. Only legit Web3 jobs.',
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
    title: 'NEUN | Web3 Jobs',
    description: 'a16z, Hashed, Paradigm backed. Only legit jobs.',
    images: [
      {
        url: 'https://neun.wtf/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NEUN - Web3 Jobs from Top VCs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEUN | Web3 Jobs',
    description: 'a16z, Hashed, Paradigm backed. Only legit jobs.',
    images: ['https://neun.wtf/og-image.png'],
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
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        {/* iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-14-pro-max.svg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-14-pro.svg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-12-pro-max.svg" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-12-pro.svg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-xs-max.svg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-x.svg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-xr.svg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-8.svg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-iphone-se.svg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-ipad-pro-12.svg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-ipad-pro-11.svg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-ipad-10.svg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-ipad-air.svg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body className={`${inter.variable} ${caveat.variable} ${pressStart.variable} ${spaceGrotesk.variable} ${inter.className}`}>
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
          {/* PWA install button now inline on home page */}
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
