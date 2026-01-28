'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Footer from '../components/Footer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/account')
      router.refresh()
    }
  }

  const handleKakaoLogin = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
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

        {/* Email/Password */}
        <form onSubmit={handleEmailLogin} className="space-y-5">
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
              placeholder="Enter password"
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
            {loading ? 'Signing in...' : 'Sign In'}
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

        {/* Kakao OAuth */}
        <button
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#FEE500] text-[#191919] text-sm font-medium rounded-none hover:bg-[#FDD800] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0.6C4.029 0.6 0 3.726 0 7.554C0 9.918 1.558 12.006 3.931 13.239L2.933 16.827C2.845 17.139 3.213 17.385 3.483 17.193L7.773 14.355C8.175 14.397 8.583 14.418 9 14.418C13.971 14.418 18 11.382 18 7.554C18 3.726 13.971 0.6 9 0.6Z"
              fill="#191919"
            />
          </svg>
          카카오로 로그인
        </button>

        <p className="text-center text-xs font-light text-a24-muted dark:text-a24-dark-muted mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-a24-text dark:text-a24-dark-text underline underline-offset-2 decoration-1">
            Sign Up
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
