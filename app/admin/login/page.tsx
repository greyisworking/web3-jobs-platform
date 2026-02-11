'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseAuthClient, clearAuthSession } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Clear any stale auth sessions on page load to prevent refresh loops
  useEffect(() => {
    clearAuthSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Clear any stale/corrupted auth sessions before login attempt
    clearAuthSession()

    // Create client only when submitting to avoid auto-refresh on mount
    const supabase = createSupabaseAuthClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // Debug: log full error details
      console.error('Admin login error:', {
        message: signInError.message,
        status: signInError.status,
        code: signInError.code,
        name: signInError.name,
      })

      // Handle Supabase rate limit error with friendly Korean message
      if (signInError.message.toLowerCase().includes('rate limit')) {
        setError(`너무 많이 시도했어요. 잠시 후 다시 해주세요 (약 1분) [${signInError.status || 'N/A'}]`)
      } else if (signInError.message.toLowerCase().includes('invalid')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다')
      } else {
        setError(`${signInError.message} [${signInError.status || signInError.code || 'unknown'}]`)
      }
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
