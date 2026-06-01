'use client'

import { useEffect } from 'react'
import { useReportWebVitals } from 'next/web-vitals'
import { trackEvent } from '@/lib/analytics'

export default function WebVitals() {
  useReportWebVitals((metric) => {
    trackEvent('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    })
  })

  // Suppress [object Event] unhandled rejections from @vercel/analytics
  // and @vercel/speed-insights beacon failures on localhost
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      if (e.reason instanceof Event) {
        e.preventDefault()
      }
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  return null
}
