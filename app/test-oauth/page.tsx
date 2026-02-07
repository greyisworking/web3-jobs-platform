'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function TestOAuthPage() {
  const [log, setLog] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseBrowserClient()

  const addLog = (msg: string) => {
    console.log('[TestOAuth]', msg)
    setLog(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${msg}`])
  }

  const handleGoogleLogin = async () => {
    addLog('Google button clicked')
    setLoading(true)

    try {
      addLog('Calling signInWithOAuth...')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      addLog(`Response: url=${data?.url ? 'YES' : 'NO'}, error=${error?.message || 'none'}`)

      if (error) {
        addLog(`ERROR: ${error.message}`)
        setLoading(false)
        return
      }

      if (data?.url) {
        addLog(`Redirecting to: ${data.url.slice(0, 80)}...`)
        // Don't use skipBrowserRedirect, let Supabase handle it
      } else {
        addLog('No URL returned!')
        setLoading(false)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLog(`Exception: ${errorMessage}`)
      setLoading(false)
    }
  }

  const handleSimpleRedirect = async () => {
    addLog('Simple redirect test')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    addLog(`Result: ${error?.message || 'Supabase will redirect automatically'}`)
  }

  const checkSession = async () => {
    addLog('Checking session...')
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      addLog(`Session error: ${error.message}`)
    } else if (session) {
      addLog(`Logged in as: ${session.user.email}`)
    } else {
      addLog('No session')
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">OAuth Test Page</h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Google OAuth (with redirectTo)'}
          </button>

          <button
            onClick={handleSimpleRedirect}
            className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Simple Google OAuth (no options)
          </button>

          <button
            onClick={checkSession}
            className="w-full py-3 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Check Session
          </button>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2">Log:</h2>
          <div className="font-mono text-sm space-y-1 max-h-80 overflow-auto">
            {log.length === 0 ? (
              <p className="text-gray-400">No logs yet. Click a button.</p>
            ) : (
              log.map((l, i) => <p key={i}>{l}</p>)
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-100 rounded">
          <h3 className="font-bold">Debug Info:</h3>
          <p>Origin: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
          <p>Pathname: {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}</p>
        </div>
      </div>
    </div>
  )
}
