'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const supabase = createSupabaseBrowserClient()

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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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

  const handleKakaoSignup = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
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

        {/* Kakao OAuth */}
        <button
          onClick={handleKakaoSignup}
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
          카카오로 시작하기
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
