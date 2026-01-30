'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Pixelbara from '@/app/components/Pixelbara'

export default function CompanyLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/company/dashboard`,
          },
        })
        if (signUpError) throw signUpError

        // Create company profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('companies').insert({
            user_id: user.id,
            name: email.split('@')[0],
          })
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }

      router.push('/company/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-a24-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Pixelbara pose="building" size={80} />
          </Link>
          <h1 className="text-2xl font-bold text-a24-text mb-2">
            {mode === 'login' ? 'Company Login' : 'Create Company Account'}
          </h1>
          <p className="text-a24-muted text-sm">
            {mode === 'login'
              ? 'Manage your job postings'
              : 'Start hiring top web3 talent'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-a24-surface border border-a24-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="company@example.com"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-a24-text placeholder-gray-500 focus:border-purple-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-a24-text placeholder-gray-500 focus:border-purple-500 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? 'Loading...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-a24-muted hover:text-a24-text transition-colors"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
