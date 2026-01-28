'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useEnsName, useSignMessage } from 'wagmi'
import { Wallet, LogOut, Copy, Check, ChevronDown, X } from 'lucide-react'
import { toast } from 'sonner'

// Truncate address for display
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Connector icons
const connectorIcons: Record<string, string> = {
  'MetaMask': '🦊',
  'WalletConnect': '🔗',
  'Coinbase Wallet': '🔵',
  'Injected': '💉',
}

export function WalletConnect() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { signMessage } = useSignMessage()

  // Hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleSignIn = () => {
    if (!address) return
    signMessage(
      { message: `Sign in to NEUN Jobs\n\nWallet: ${address}\nTimestamp: ${Date.now()}` },
      {
        onSuccess: () => {
          toast('gm ser! wallet verified 🤝', { duration: 3000 })
          setIsOpen(false)
        },
        onError: () => {
          toast('signature failed... ngmi', { duration: 3000 })
        },
      }
    )
  }

  if (!mounted) {
    return (
      <button
        className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-medium border border-a24-border dark:border-a24-dark-border text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
        disabled
      >
        <Wallet className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Connect</span>
      </button>
    )
  }

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
                onClick={handleSignIn}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-wider font-medium text-a24-text dark:text-a24-dark-text hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors text-left"
              >
                ✍️ Sign Message
              </button>
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
        <div className="absolute right-0 top-full mt-2 w-72 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border shadow-lg z-50">
          <div className="p-4 border-b border-a24-border dark:border-a24-dark-border flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-a24-text dark:text-a24-dark-text">
                Connect Wallet
              </p>
              <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted mt-0.5">
                web3 native experience ser
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-a24-border dark:hover:bg-a24-dark-border rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 space-y-1">
            {connectors.map((c) => (
              <button
                key={c.uid}
                onClick={() => {
                  connect({ connector: c })
                  setIsOpen(false)
                }}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors disabled:opacity-50"
              >
                <span className="text-xl">{connectorIcons[c.name] || '🔗'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-a24-text dark:text-a24-dark-text">
                    {c.name}
                  </p>
                  {c.name === 'MetaMask' && (
                    <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
                      Popular browser wallet
                    </p>
                  )}
                  {c.name === 'WalletConnect' && (
                    <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
                      Connect mobile wallet
                    </p>
                  )}
                  {c.name === 'Coinbase Wallet' && (
                    <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
                      Coinbase app or extension
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

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
