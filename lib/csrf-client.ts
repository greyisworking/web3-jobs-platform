'use client'

/**
 * Client-side CSRF utilities
 */

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }
  return null
}

/**
 * Generate and set CSRF token if not present
 */
export function ensureCSRFToken(): string {
  let token = getCSRFTokenFromCookie()

  if (!token) {
    // Generate token client-side
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')

    // Set cookie
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Max-Age=86400${secure}`
  }

  return token
}

/**
 * Create headers with CSRF token for fetch requests
 */
export function csrfHeaders(additionalHeaders?: HeadersInit): Headers {
  const token = ensureCSRFToken()
  const headers = new Headers(additionalHeaders)
  headers.set(CSRF_HEADER_NAME, token)
  headers.set('Content-Type', 'application/json')
  return headers
}

/**
 * Fetch wrapper that automatically includes CSRF token
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = ensureCSRFToken()

  const headers = new Headers(options.headers)
  headers.set(CSRF_HEADER_NAME, token)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  })
}
