/**
 * CSRF Protection Utilities
 *
 * Uses double-submit cookie pattern for stateless CSRF protection.
 * Token is stored in cookie and must match X-CSRF-Token header.
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get or create CSRF token (for server components/actions)
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!token) {
    token = generateToken()
  }

  return token
}

/**
 * Set CSRF token cookie in response
 */
export function setCSRFCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateToken()

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by JS for header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return response
}

/**
 * Validate CSRF token from request
 * Compares cookie value with header value
 */
export function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  }

  return result === 0
}

/**
 * CSRF validation middleware helper
 * Use in API routes that modify data
 */
export function requireCSRF(request: NextRequest): NextResponse | null {
  if (!validateCSRFToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }
  return null
}
