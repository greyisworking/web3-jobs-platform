'use client'

export type AnalyticsEventType =
  | 'job_view'
  | 'job_apply_click'
  | 'job_card_click'
  | 'filter_use'
  | 'vc_click'
  | 'share_click'
  | 'web_vital'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('analytics_session_id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('analytics_session_id', id)
  }
  return id
}

export function trackEvent(type: AnalyticsEventType, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return

  const payload = JSON.stringify({
    event_type: type,
    event_data: data ?? {},
    user_session: getSessionId(),
  })

  try {
    const blob = new Blob([payload], { type: 'application/json' })
    navigator.sendBeacon('/api/analytics/events', blob)
  } catch {
    // Silently fail — analytics should never break the app
  }
}
