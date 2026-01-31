'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi'
import { Wallet, LogOut, Copy, Check, ChevronDown, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getErrorForToast } from '@/lib/error-messages'

// Truncate address for display
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Connector icons and names
const CONNECTOR_INFO: Record<string, { icon: string; label: string; description: string }> = {
  'injected': { icon: '🦊', label: 'MetaMask', description: 'Browser wallet' },
  'metaMask': { icon: '🦊', label: 'MetaMask', description: 'Browser wallet' },
  'walletConnect': { icon: '🔗', label: 'WalletConnect', description: 'Mobile wallet' },
  'coinbaseWalletSDK': { icon: '🔵', label: 'Coinbase', description: 'Coinbase Wallet' },
}

export function WalletConnect() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [connectingId, setConnectingId] = useState<string | null>(null)

  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const supabase = createSupabaseBrowserClient()

  // Hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      console.error('Connection error:', connectError)
      const { title, description } = getErrorForToast(connectError)
      toast.error(title, { description })
      setConnectingId(null)
    }
  }, [connectError])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.wallet-dropdown')) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const handleCopyAddress = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    toast('Address copied!', { duration: 2000 })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConnect = useCallback(async (connectorId: string) => {
    const selectedConnector = connectors.find(c => c.id === connectorId)
    if (!selectedConnector) {
      const { title, description } = getErrorForToast(new Error('Connector not found'))
      toast.error(title, { description })
      return
    }

    setConnectingId(connectorId)

    try {
      connect(
        { connector: selectedConnector },
        {
          onSuccess: () => {
            toast.success('gm ser! wallet connected', { duration: 2000 })
            setIsOpen(false)
            setConnectingId(null)
          },
          onError: (err) => {
            console.error('Connect error:', err)
            const { title, description } = getErrorForToast(err)
            toast.error(title, { description })
            setConnectingId(null)
          },
        }
      )
    } catch (err) {
      console.error('Connect exception:', err)
      setConnectingId(null)
    }
  }, [connect, connectors])

  const [oauthLoading, setOauthLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setOauthLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true, // Handle redirect manually
        },
      })
      console.log('Google OAuth response:', { data, error })
      if (error) {
        const { title, description } = getErrorForToast(error)
        toast.error(title, { description })
        setOauthLoading(false)
        return
      }
      // Manually redirect to OAuth URL
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.error('Google OAuth 미설정', {
          description: 'Supabase 대시보드에서 Google provider를 활성화하세요.'
        })
        setOauthLoading(false)
      }
    } catch (err) {
      console.error('Google OAuth error:', err)
      toast.error('Google 로그인 오류', { description: '다시 시도해주세요.' })
      setOauthLoading(false)
    }
  }

  const handleKakaoLogin = async () => {
    setOauthLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      })
      console.log('Kakao OAuth response:', { data, error })
      if (error) {
        const { title, description } = getErrorForToast(error)
        toast.error(title, { description })
        setOauthLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.error('Kakao OAuth 미설정', {
          description: 'Supabase 대시보드에서 Kakao provider를 활성화하세요.'
        })
        setOauthLoading(false)
      }
    } catch (err) {
      console.error('Kakao OAuth error:', err)
      toast.error('Kakao 로그인 오류', { description: '다시 시도해주세요.' })
      setOauthLoading(false)
    }
  }

  if (!mounted) {
    return (
      <button
        className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-medium border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted"
        disabled
      >
        <Wallet className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Connect</span>
      </button>
    )
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="relative wallet-dropdown">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-medium bg-neun-success/10 border border-neun-success/30 text-neun-success hover:bg-neun-success/20 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-neun-success animate-pulse" />
          <span className="hidden sm:inline">{ensName || truncateAddress(address)}</span>
          <span className="sm:hidden">{truncateAddress(address)}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border shadow-lg z-50">
            <div className="p-4 border-b border-a24-border dark:border-a24-dark-border">
              <p className="text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-1">
                Connected via {connector?.name}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-a24-text dark:text-a24-dark-text truncate flex-1">
                  {ensName || truncateAddress(address)}
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="p-1.5 hover:bg-a24-border dark:hover:bg-a24-dark-border rounded transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-neun-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {ensName && (
                <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted mt-1 font-mono">
                  {truncateAddress(address)}
                </p>
              )}
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  disconnect()
                  setIsOpen(false)
                  toast('disconnected... cya ser', { duration: 2000 })
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-wider font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Disconnected state - show connect options
  return (
    <div className="relative wallet-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-medium border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
      >
        <Wallet className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Connect</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-a24-border dark:border-a24-dark-border flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-a24-text dark:text-a24-dark-text">
                Connect
              </p>
              <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted mt-0.5">
                Choose your login method
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-a24-border dark:hover:bg-a24-dark-border rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Web3 Login Section */}
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted mb-2 px-1">
              Web3 Login
            </p>
            <p className="text-[9px] text-neun-success mb-3 px-1">
              Full features: Post jobs, on-chain badges, POAP
            </p>
            <div className="space-y-1">
              {connectors.map((c) => {
                const info = CONNECTOR_INFO[c.id] || { icon: '🔗', label: c.name, description: '' }
                const isConnecting = connectingId === c.id

                return (
                  <button
                    key={c.uid}
                    onClick={() => handleConnect(c.id)}
                    disabled={isPending || isConnecting}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors disabled:opacity-50"
                  >
                    <span className="text-lg">{info.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
                        {info.label}
                      </p>
                      <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
                        {info.description}
                      </p>
                    </div>
                    {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
            <span className="text-[9px] uppercase tracking-wider text-a24-muted dark:text-a24-dark-muted">
              or continue with
            </span>
            <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
          </div>

          {/* Social Login Section */}
          <div className="p-3 pt-1">
            <p className="text-[9px] text-a24-muted dark:text-a24-dark-muted mb-3 px-1">
              Basic features: Browse jobs, bookmarks, apply
            </p>
            <div className="space-y-1">
              <button
                onClick={handleGoogleLogin}
                disabled={oauthLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
                    {oauthLoading ? '로그인 중...' : 'Google'}
                  </p>
                </div>
                {oauthLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
              <button
                onClick={handleKakaoLogin}
                disabled={oauthLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors disabled:opacity-50"
              >
                <div className="w-5 h-5 bg-[#FEE500] rounded flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9 0.6C4.029 0.6 0 3.726 0 7.554C0 9.918 1.558 12.006 3.931 13.239L2.933 16.827C2.845 17.139 3.213 17.385 3.483 17.193L7.773 14.355C8.175 14.397 8.583 14.418 9 14.418C13.971 14.418 18 11.382 18 7.554C18 3.726 13.971 0.6 9 0.6Z"
                      fill="#191919"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
                    {oauthLoading ? '로그인 중...' : 'Kakao'}
                  </p>
                </div>
                {oauthLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-a24-border dark:border-a24-dark-border bg-a24-bg/50 dark:bg-a24-dark-bg/50">
            <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted text-center">
              By connecting, you agree to our{' '}
              <a href="/terms" className="underline hover:text-a24-text dark:hover:text-a24-dark-text">
                Terms
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini wallet indicator for mobile
export function MiniWalletIndicator() {
  const { isConnected } = useAccount()

  if (!isConnected) return null

  return (
    <span className="w-2 h-2 rounded-full bg-neun-success animate-pulse" />
  )
}
