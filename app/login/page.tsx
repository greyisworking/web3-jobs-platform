'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { WalletConnect } from '../components/WalletConnect'
import Footer from '../components/Footer'

// Detect in-app browsers (KakaoTalk, Instagram, Facebook, etc.)
function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /KAKAOTALK|FBAN|FBAV|Instagram|Line|NAVER|Daum|SamsungBrowser.*CrossApp/i.test(ua)
}

function openInExternalBrowser(url: string) {
  const ua = navigator.userAgent || ''
  if (/KAKAOTALK/i.test(ua)) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
    return
  }
  if (/Android/i.test(ua)) {
    window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
    return
  }
  window.open(url, '_blank')
}

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inApp, setInApp] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  const nextUrl = searchParams.get('next') || '/'

  useEffect(() => {
    setInApp(isInAppBrowser())
    // Show error from URL params (e.g., from OAuth callback failure)
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  // Server-side OAuth via API routes - avoids client-side cookie sync issues
  const handleGoogleLogin = () => {
    setError('')
    setLoading(true)
    // Redirect to server-side OAuth handler with next URL
    window.location.href = `/api/auth/google?next=${encodeURIComponent(nextUrl)}`
  }

  const handleKakaoLogin = () => {
    setError('')
    setLoading(true)
    // Redirect to server-side OAuth handler with next URL
    window.location.href = `/api/auth/kakao?next=${encodeURIComponent(nextUrl)}`
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-md mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text mb-3">
            Log In
          </h1>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mx-auto" />
        </div>

        {/* In-app browser warning */}
        {inApp && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 mb-6">
            <p className="text-xs font-medium text-amber-400 mb-2">
              In-app browser detected
            </p>
            <p className="text-[11px] text-a24-muted dark:text-a24-dark-muted mb-3">
              Google login doesn&apos;t work in KakaoTalk, Instagram, or other in-app browsers. Please open in your default browser.
            </p>
            <button
              onClick={() => openInExternalBrowser(window.location.href)}
              className="w-full py-2.5 text-[11px] uppercase tracking-[0.2em] font-medium bg-amber-500 text-black hover:bg-amber-400 transition-colors"
            >
              Open in Browser
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs font-light text-red-500 dark:text-red-400 mb-4 text-center">
            {error}
          </p>
        )}

        {/* 1. Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-300 dark:border-gray-400 shadow-sm disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="h-3" />

        {/* 2. Kakao Login */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#FEE500] text-[#191919] text-sm font-medium hover:bg-[#FDD800] transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0.6C4.029 0.6 0 3.726 0 7.554C0 9.918 1.558 12.006 3.931 13.239L2.933 16.827C2.845 17.139 3.213 17.385 3.483 17.193L7.773 14.355C8.175 14.397 8.583 14.418 9 14.418C13.971 14.418 18 11.382 18 7.554C18 3.726 13.971 0.6 9 0.6Z"
              fill="#191919"
            />
          </svg>
          {loading ? 'Signing in...' : 'Continue with Kakao'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted">
            or
          </span>
          <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
        </div>

        {/* 3. Wallet Connect */}
        <div className="flex justify-center">
          <WalletConnect />
        </div>

      </main>

      <Footer />
    </div>
  )
}
