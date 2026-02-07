'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Footer from '../components/Footer'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  // Get the redirect destination from query params (default to /)
  const nextUrl = searchParams.get('next') || '/'

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
          skipBrowserRedirect: true,
        },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError('Google OAuth가 설정되지 않았습니다.')
        setLoading(false)
      }
    } catch {
      setError('Google 로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const handleKakaoSignup = async () => {
    setError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
          skipBrowserRedirect: true,
        },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError('Kakao OAuth가 설정되지 않았습니다.')
        setLoading(false)
      }
    } catch {
      setError('카카오 로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
        <main className="max-w-md mx-auto px-6 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text mb-6">
              Check Your Email
            </h1>
            <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mx-auto mb-8" />
            <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted leading-relaxed mb-8">
              We sent a confirmation link to <strong className="text-a24-text dark:text-a24-dark-text">{email}</strong>.
              <br />
              Please check your inbox and click the link to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-block text-[11px] uppercase tracking-[0.3em] font-light text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-8 py-3 hover:bg-a24-text hover:text-a24-surface dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-all duration-300"
            >
              Go to Login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-md mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-a24-text dark:text-a24-dark-text mb-3">
            Sign Up
          </h1>
          <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mx-auto" />
        </div>

        {/* Email/Password */}
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm font-light bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder:text-a24-muted/50 focus:outline-none focus:border-a24-text dark:focus:border-a24-dark-text transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm font-light bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder:text-a24-muted/50 focus:outline-none focus:border-a24-text dark:focus:border-a24-dark-text transition-colors"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] font-light text-a24-muted dark:text-a24-dark-muted mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm font-light bg-transparent border border-a24-border dark:border-a24-dark-border text-a24-text dark:text-a24-dark-text placeholder:text-a24-muted/50 focus:outline-none focus:border-a24-text dark:focus:border-a24-dark-text transition-colors"
              placeholder="Re-enter password"
            />
          </div>

          {error && (
            <p className="text-xs font-light text-red-500 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-[11px] uppercase tracking-[0.3em] font-light bg-a24-text dark:bg-a24-dark-text text-a24-surface dark:text-a24-dark-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted">
            or
          </span>
          <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-gray-800 text-sm font-medium rounded-none hover:bg-gray-100 transition-colors border border-gray-300 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? '로그인 중...' : 'Google로 시작하기'}
        </button>

        <div className="h-3" />

        {/* Kakao OAuth */}
        <button
          onClick={handleKakaoSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#FEE500] text-[#191919] text-sm font-medium rounded-none hover:bg-[#FDD800] transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0.6C4.029 0.6 0 3.726 0 7.554C0 9.918 1.558 12.006 3.931 13.239L2.933 16.827C2.845 17.139 3.213 17.385 3.483 17.193L7.773 14.355C8.175 14.397 8.583 14.418 9 14.418C13.971 14.418 18 11.382 18 7.554C18 3.726 13.971 0.6 9 0.6Z"
              fill="#191919"
            />
          </svg>
          {loading ? '로그인 중...' : '카카오로 시작하기'}
        </button>

        <p className="text-center text-xs font-light text-a24-muted dark:text-a24-dark-muted mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-a24-text dark:text-a24-dark-text underline underline-offset-2 decoration-1">
            Log In
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
