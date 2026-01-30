'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported')
      return
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        console.log('[SW] Service worker registered:', registration.scope)

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, show update notification
              console.log('[SW] New content available')

              // Dispatch custom event for update notification
              window.dispatchEvent(new CustomEvent('sw-update-available', {
                detail: { registration }
              }))
            }
          })
        })

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Controller changed, reloading for fresh content')
          // Optional: auto-reload when new SW takes control
          // window.location.reload()
        })

      } catch (error) {
        console.error('[SW] Registration failed:', error)
      }
    }

    // Register after page load for better performance
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
      return () => window.removeEventListener('load', registerSW)
    }
  }, [])

  return null
}
