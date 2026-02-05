'use client'

import { useState, useEffect } from 'react'
import { Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Inline PWA install button — renders as a section (not a popup).
 * Mobile only. Place this in page.tsx where you want it to appear.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth <= 768
    setIsMobile(mobile)

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    if (standalone || !mobile) return

    // Check iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    if (iOS) {
      setShow(true)
      return
    }

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  if (isStandalone || !show || !isMobile) return null

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-a24-surface/80 dark:bg-a24-dark-surface/80 border border-a24-border dark:border-a24-dark-border">
      <Smartphone className="w-4 h-4 text-neun-success flex-shrink-0" />
      {isIOS ? (
        <p className="text-xs text-a24-muted dark:text-a24-dark-muted">
          Tap <span className="font-medium text-a24-text dark:text-a24-dark-text">Share</span> then <span className="font-medium text-a24-text dark:text-a24-dark-text">Add to Home Screen</span>
        </p>
      ) : (
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 px-4 py-2 bg-neun-success text-white text-xs uppercase tracking-wider font-medium hover:shadow-green-glow transition-all touch-target"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </button>
      )}
    </div>
  )
}
