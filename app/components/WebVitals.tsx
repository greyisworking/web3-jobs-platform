'use client'

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

  return null
}
