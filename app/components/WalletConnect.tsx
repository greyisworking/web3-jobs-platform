'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage, useEnsName } from 'wagmi'
import { Wallet, LogOut, Copy, Check, ChevronDown, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SiweMessage } from 'siwe'
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

// Hook: detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// Bottom sheet with swipe-to-dismiss for mobile
function MobileSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const dragging = useRef(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    currentY.current = 0
    dragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return
    const diff = e.touches[0].clientY - startY.current
    currentY.current = Math.max(0, diff)
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${currentY.current}px)`
    }
  }

  const handleTouchEnd = () => {
    dragging.current = false
    if (currentY.current > 100) {
      onClose()
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-a24-surface dark:bg-a24-dark-surface border-t border-a24-border dark:border-a24-dark-border rounded-t-2xl max-h-[85vh] overflow-y-auto transition-transform duration-200"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-a24-muted/30 dark:bg-a24-dark-muted/30" />
        </div>
        {children}
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

// SIWE sign-in flow
async function performSiwe(
  address: string,
  chainId: number,
  signMessageAsync: (args: { message: string }) => Promise<string>,
): Promise<boolean> {
  // 1. Get nonce
  const nonceRes = await fetch('/api/auth/siwe/nonce')
  const { nonce } = await nonceRes.json()

  // 2. Create SIWE message
  const siweMessage = new SiweMessage({
    domain: window.location.host,
    address,
    statement: 'Sign in to NEUN with your wallet.',
    uri: window.location.origin,
    version: '1',
    chainId,
    nonce,
  })
  const messageString = siweMessage.prepareMessage()

  // 3. Sign
  const signature = await signMessageAsync({ message: messageString })

  // 4. Verify on server
  const verifyRes = await fetch('/api/auth/siwe/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: messageString, signature }),
  })

  if (!verifyRes.ok) {
    const { error } = await verifyRes.json()
    throw new Error(error || 'Verification failed')
  }

  return true
}

export function WalletConnect() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [pendingSiwe, setPendingSiwe] = useState(false)
  const isMobile = useIsMobile()

  const { address, isConnected, connector, chain } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { signMessageAsync } = useSignMessage()

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
      setPendingSiwe(false)
      setSigningIn(false)
    }
  }, [connectError])

  // After wallet connects, trigger SIWE
  useEffect(() => {
    if (isConnected && address && chain && pendingSiwe && !signingIn) {
      setSigningIn(true)
      performSiwe(address, chain.id, signMessageAsync)
        .then(() => {
          toast.success('gm ser! signed in', { duration: 2000 })
          setIsOpen(false)
          setPendingSiwe(false)
          setSigningIn(false)
          setConnectingId(null)
          // Refresh to update auth state
          window.location.reload()
        })
        .catch((err) => {
          console.error('SIWE error:', err)
          // User rejected signature — disconnect wallet
          if (err?.message?.includes('User rejected') || err?.code === 4001) {
            toast.error('Sign-in cancelled')
            disconnect()
          } else {
            toast.error('Sign-in failed', { description: err.message })
          }
          setPendingSiwe(false)
          setSigningIn(false)
          setConnectingId(null)
        })
    }
  }, [isConnected, address, chain, pendingSiwe, signingIn, signMessageAsync, disconnect])

  // Close dropdown on outside click (desktop only)
  useEffect(() => {
    if (isMobile) return
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
  }, [isOpen, isMobile])

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
    setPendingSiwe(true)

    try {
      connect(
        { connector: selectedConnector },
        {
          onError: (err) => {
            console.error('Connect error:', err)
            const { title, description } = getErrorForToast(err)
            toast.error(title, { description })
            setConnectingId(null)
            setPendingSiwe(false)
          },
        }
      )
    } catch (err) {
      console.error('Connect exception:', err)
      setConnectingId(null)
      setPendingSiwe(false)
    }
  }, [connect, connectors])

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

  // Shared popup content
  const popupContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-a24-border dark:border-a24-dark-border flex items-center justify-between">
        <p className="text-sm font-bold text-a24-text dark:text-a24-dark-text">
          Connect Wallet
        </p>
        {!isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-a24-border dark:hover:bg-a24-dark-border rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Signing state */}
      {signingIn && (
        <div className="p-4 flex items-center gap-3 bg-neun-success/5 border-b border-a24-border dark:border-a24-dark-border">
          <Loader2 className="w-4 h-4 animate-spin text-neun-success" />
          <p className="text-xs text-a24-text dark:text-a24-dark-text">
            Sign the message in your wallet to log in...
          </p>
        </div>
      )}

      {/* Wallet connectors */}
      <div className="p-3">
        <div className="space-y-1">
          {connectors.map((c) => {
            const info = CONNECTOR_INFO[c.id] || { icon: '🔗', label: c.name, description: '' }
            const isConnecting = connectingId === c.id

            return (
              <button
                key={c.uid}
                onClick={() => handleConnect(c.id)}
                disabled={isPending || isConnecting || signingIn}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors disabled:opacity-50 touch-target"
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-a24-border dark:border-a24-dark-border bg-a24-bg/50 dark:bg-a24-dark-bg/50">
        <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted text-center">
          By connecting, you agree to our{' '}
          <a href="/terms" className="underline hover:text-a24-text dark:hover:text-a24-dark-text">
            Terms
          </a>
        </p>
      </div>
    </>
  )

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

  // Disconnected state
  return (
    <div className="relative wallet-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-medium border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text hover:border-a24-text dark:hover:border-a24-dark-text transition-colors"
      >
        <Wallet className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Connect</span>
      </button>

      {/* Mobile: bottom sheet */}
      {isMobile && (
        <MobileSheet open={isOpen} onClose={() => setIsOpen(false)}>
          {popupContent}
        </MobileSheet>
      )}

      {/* Desktop: dropdown */}
      {!isMobile && isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border shadow-lg z-50">
          {popupContent}
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
