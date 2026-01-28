import type { Metadata, Viewport } from 'next'
import { Inter, Caveat, Space_Grotesk } from 'next/font/google'
import { Toaster } from 'sonner'
import WebVitals from './components/WebVitals'
import Navigation from './components/Navigation'
import PageTransition from './components/PageTransition'
import KonamiEasterEgg from './components/KonamiEasterEgg'
import TouchGrassReminder from './components/TouchGrassReminder'
import { Web3Provider } from './components/Web3Provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['200', '300', '400', '500', '700'], display: 'swap', variable: '--font-body' })
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-script' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-heading' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.io'),
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
    url: 'https://neun.io',
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
      <body className={`${inter.variable} ${caveat.variable} ${spaceGrotesk.variable} ${inter.className}`}>
        <Web3Provider>
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
        </Web3Provider>
      </body>
    </html>
  )
}
