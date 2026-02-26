'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Eye, Heart, Share2, MessageSquare,
  Twitter, ExternalLink, Copy, Check, Coins
} from 'lucide-react'
import { useAccount } from 'wagmi'
import type { Article } from '@/types/article'
import { formatDate } from '@/lib/format'
import Pixelbara from '@/app/components/Pixelbara'
import Footer from '@/app/components/Footer'
import Blockies, { truncateAddress } from '@/app/components/Blockies'

// Share modal component
function ShareModal({
  isOpen,
  onClose,
  article
}: {
  isOpen: boolean
  onClose: () => void
  article: Article
}) {
  const [copied, setCopied] = useState(false)
  const [articleUrl, setArticleUrl] = useState('')

  // Set URL on client side only to avoid hydration mismatch
  useEffect(() => {
    setArticleUrl(`${window.location.origin}/articles/${article.slug}`)
  }, [article.slug])

  if (!isOpen) return null

  const shareText = `${article.title} by ${article.author_ens || article.author_name}`

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(articleUrl)}`,
    farcaster: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText + '\n\n' + articleUrl)}`,
    lens: `https://hey.xyz/?text=${encodeURIComponent(shareText + '\n\n' + articleUrl)}`,
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(articleUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="bg-a24-surface border border-a24-border p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-a24-text mb-4">Share Article</h3>

        <div className="space-y-3">
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 text-a24-text transition-colors"
          >
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            <span>Share on Twitter</span>
            <ExternalLink className="w-4 h-4 ml-auto text-a24-muted" />
          </a>

          <a
            href={shareLinks.farcaster}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 text-a24-text transition-colors"
          >
            <div className="w-5 h-5 bg-neun-success flex items-center justify-center text-xs font-bold">F</div>
            <span>Share on Farcaster</span>
            <ExternalLink className="w-4 h-4 ml-auto text-a24-muted" />
          </a>

          <a
            href={shareLinks.lens}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 text-a24-text transition-colors"
          >
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">L</div>
            <span>Share on Lens</span>
            <ExternalLink className="w-4 h-4 ml-auto text-a24-muted" />
          </a>

          <button
            onClick={copyLink}
            className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 text-a24-text transition-colors w-full"
          >
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-a24-muted" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-a24-muted hover:text-a24-text transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// Tip modal component
function TipModal({
  isOpen,
  onClose,
  article,
  onTip
}: {
  isOpen: boolean
  onClose: () => void
  article: Article
  onTip: (amount: number) => void
}) {
  const [amount, setAmount] = useState('0.01')
  const [sending, setSending] = useState(false)

  if (!isOpen) return null

  const presetAmounts = ['0.001', '0.005', '0.01', '0.05']

  const handleTip = async () => {
    setSending(true)
    // In real implementation, this would trigger a wallet transaction
    await new Promise(resolve => setTimeout(resolve, 1000))
    onTip(parseFloat(amount))
    setSending(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="bg-a24-surface border border-a24-border p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-a24-text mb-2">Tip the Author</h3>
        <p className="text-sm text-a24-muted mb-6">
          Support {article.author_ens || article.author_name} with ETH
        </p>

        {/* Preset Amounts */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presetAmounts.map(preset => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`py-2 text-sm font-medium transition-colors ${
                amount === preset
                  ? 'bg-neun-success text-a24-text'
                  : 'bg-gray-800 text-a24-muted hover:text-a24-text'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="flex items-center gap-2 mb-6">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.001"
            step="0.001"
            className="flex-1 bg-gray-800 border border-gray-700 px-3 py-2 text-a24-text outline-none focus:border-neun-success"
          />
          <span className="text-a24-muted">ETH</span>
        </div>

        <button
          onClick={handleTip}
          disabled={sending || !amount || parseFloat(amount) <= 0}
          className="w-full py-3 bg-neun-success hover:bg-neun-success/90 text-a24-text font-medium transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : `Send ${amount} ETH`}
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full py-2 text-sm text-a24-muted hover:text-a24-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface ArticleDetailClientProps {
  article: Article
}

export default function ArticleDetailClient({ article: initialArticle }: ArticleDetailClientProps) {
  const { address, isConnected } = useAccount()
  const [article, setArticle] = useState<Article>(initialArticle)
  const [collected, setCollected] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showTip, setShowTip] = useState(false)

  // Increment view count on mount
  useEffect(() => {
    fetch(`/api/articles/${initialArticle.slug}`).catch(() => {})
  }, [initialArticle.slug])

  const handleCollect = async () => {
    if (!isConnected || !article) return

    setCollecting(true)
    try {
      await fetch(`/api/articles/${article.slug}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collector_address: address }),
      })

      setCollected(true)
      setArticle(prev => ({ ...prev, collect_count: prev.collect_count + 1 }))
    } catch (err) {
      console.error('Failed to collect:', err)
    } finally {
      setCollecting(false)
    }
  }

  const handleTip = async (amount: number) => {
    setArticle(prev => ({
      ...prev,
      tip_amount: prev.tip_amount + amount
    }))

    try {
      await fetch(`/api/articles/${article.slug}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collector_address: address,
          amount,
        }),
      })
    } catch (err) {
      console.error('Failed to record tip:', err)
    }
  }

  return (
    <div className="min-h-screen bg-a24-bg">
      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 pt-24 pb-12">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm text-a24-muted hover:text-a24-text transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-neun-success/20 text-neun-success text-xs uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-2xl md:text-4xl font-bold text-a24-text leading-tight mb-6">
          {article.title}
        </h1>

        {/* Author & Meta */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Author */}
            <div className="flex items-center gap-3">
              {article.author_address ? (
                <>
                  <Blockies address={article.author_address} size={40} />
                  <div>
                    <p className="text-a24-text font-medium">
                      {article.author_ens || truncateAddress(article.author_address)}
                    </p>
                    {article.author_ens && (
                      <p className="text-xs text-a24-muted font-mono">
                        {truncateAddress(article.author_address)}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-a24-text font-medium">{article.author_name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-a24-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {article.reading_time || 1} min read
            </span>
            <span>
              {article.published_at ? formatDate(article.published_at) : 'Draft'}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {article.view_count}
            </span>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {article.cover_image ? (
        <div className="max-w-4xl mx-auto px-6 mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full aspect-video object-cover"
          />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <div className="w-full aspect-video bg-a24-surface flex items-center justify-center">
            <Pixelbara pose="reading" size={160} />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 pb-12">
        <div
          className="prose prose-lg prose-invert max-w-none
            prose-headings:font-bold prose-headings:text-a24-text
            prose-p:text-a24-text prose-p:leading-relaxed
            prose-a:text-neun-success prose-a:underline prose-a:underline-offset-4
            prose-blockquote:border-gray-700 prose-blockquote:text-a24-muted
            prose-code:text-neun-success prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5
            prose-pre:bg-a24-surface prose-pre:border prose-pre:border-a24-border
            prose-img:mx-auto
          "
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      {/* Action Bar */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <div className="border-t border-b border-a24-border py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Collect & Stats */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleCollect}
                disabled={!isConnected || collected || collecting}
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  collected
                    ? 'bg-neun-success/20 text-neun-success cursor-default'
                    : isConnected
                      ? 'bg-neun-success hover:bg-neun-success/90 text-a24-text'
                      : 'bg-gray-800 text-a24-muted cursor-not-allowed'
                }`}
              >
                <Heart className={`w-4 h-4 ${collected ? 'fill-current' : ''}`} />
                {collecting ? 'Collecting...' : collected ? 'Collected' : 'Collect'}
              </button>

              <div className="flex items-center gap-1.5 text-a24-muted">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{article.collect_count} collected</span>
              </div>

              {article.tip_amount > 0 && (
                <div className="flex items-center gap-1.5 text-a24-muted">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm">{article.tip_amount.toFixed(4)} ETH tipped</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isConnected && (
                <button
                  onClick={() => setShowTip(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-a24-text text-sm transition-colors"
                >
                  <Coins className="w-4 h-4" />
                  Tip
                </button>
              )}

              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-a24-text text-sm transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>

              <Link
                href={`/articles/write?remix=${article.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-a24-text text-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Remix
              </Link>
            </div>
          </div>

          {!isConnected && (
            <p className="text-xs text-a24-muted mt-4">
              Connect wallet to collect and tip
            </p>
          )}
        </div>

        {/* Author Card */}
        {article.author_address && (
          <div className="mt-8 p-6 bg-a24-surface border border-a24-border">
            <div className="flex items-center gap-4">
              <Blockies address={article.author_address} size={60} />
              <div className="flex-1">
                <p className="text-a24-text font-bold text-lg">
                  {article.author_ens || truncateAddress(article.author_address)}
                </p>
                <p className="text-xs text-a24-muted font-mono mb-2">
                  {article.author_address}
                </p>
                <a
                  href={`https://etherscan.io/address/${article.author_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neun-success hover:text-neun-success/80 inline-flex items-center gap-1"
                >
                  View on Etherscan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Modals */}
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} article={article} />
      <TipModal isOpen={showTip} onClose={() => setShowTip(false)} article={article} onTip={handleTip} />
    </div>
  )
}
