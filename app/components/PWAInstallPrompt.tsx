'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import Pixelbara from './Pixelbara'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Check if mobile device
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth <= 768
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    if (standalone) return

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstall = (e: Event) => {
      console.log('🔥 beforeinstallprompt fired!')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show banner on both mobile and desktop
      console.log('📱 Showing install banner')
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS, show banner after delay if not standalone
    if (iOS) {
      setTimeout(() => setShowBanner(true), 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    console.log('🎯 Install clicked, deferredPrompt:', deferredPrompt)
    if (!deferredPrompt) {
      console.log('❌ No deferredPrompt available!')
      return
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install')
    }

    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isStandalone || !showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in">
      <div className="bg-gray-900 dark:bg-gray-950 border border-gray-800 shadow-lg shadow-neun-success/20 p-4">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          {/* Pixelbara icon */}
          <div className="flex-shrink-0">
            <Pixelbara pose="wagmi" size={48} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-pixel text-xs text-neun-success mb-1">
              INSTALL NEUN
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              {isIOS
                ? 'Add to Home Screen for the best experience'
                : 'Install our app for quick access to Web3 jobs'}
            </p>

            {isIOS ? (
              // iOS instructions
              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="text-neun-success">1.</span>
                  Tap the Share button
                  <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L8 6h3v8h2V6h3L12 2zm-7 9v11h14V11h-2v9H7v-9H5z"/>
                  </svg>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-neun-success">2.</span>
                  Scroll and tap &quot;Add to Home Screen&quot;
                </p>
              </div>
            ) : (
              // Install button for Android/Desktop
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 bg-neun-success text-white text-xs uppercase tracking-wider hover:shadow-green-glow transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}
          </div>
        </div>

        {/* Features preview */}
        <div className="mt-4 pt-3 border-t border-gray-800 flex gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            Offline access
          </span>
          <span className="flex items-center gap-1">
            <span className="text-neun-success">+</span>
            Push notifications
          </span>
          <span className="flex items-center gap-1">
            <span className="text-neun-success">+</span>
            Quick launch
          </span>
        </div>
      </div>
    </div>
  )
}
