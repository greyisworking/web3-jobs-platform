'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Loader2, X, Plus, Wallet, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useEnsName } from 'wagmi'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import RichTextEditor from '@/app/components/RichTextEditor'
import ThumbnailUpload from '@/app/components/ThumbnailUpload'
import Pixelbara from '@/app/components/Pixelbara'
import Blockies, { truncateAddress } from '@/app/components/Blockies'
import { WalletConnect } from '@/app/components/WalletConnect'
import Web3Badges from '@/app/components/Web3Badges'

const SUGGESTED_TAGS = [
  'DeFi', 'NFT', 'DAO', 'Layer2', 'Security', 'Trading',
  'Development', 'Research', 'Tutorial', 'Opinion', 'News'
]

export default function ArticleWritePage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Wallet state (optional)
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })

  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    tags: [] as string[],
    published: false,
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value.slice(0, 60)
    setForm((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }))
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !form.tags.includes(trimmed) && form.tags.length < 5) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, trimmed] }))
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const calculateReadingTime = (content: string) => {
    const text = content.replace(/<[^>]*>/g, '')
    const words = text.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200))
  }

  const handleSubmit = async (publish: boolean) => {
    if (!form.title || !form.content) {
      toast.error('Fill in title & content first! 🦫')
      return
    }

    if (!user) {
      toast.error('Log in to write, ser! 🔐')
      return
    }

    setLoading(true)
    try {
      const readingTime = calculateReadingTime(form.content)

      // Determine author info based on wallet connection or user email
      const authorInfo = isConnected && address
        ? {
            author_address: address,
            author_ens: ensName || null,
            author_name: ensName || truncateAddress(address),
          }
        : {
            author_address: null,
            author_ens: null,
            author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
          }

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          published: publish,
          ...authorInfo,
          author_email: user.email,
          author_avatar: user.user_metadata?.avatar_url || null,
          reading_time: readingTime,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create article')
      }

      const data = await res.json()
      router.push(`/articles/${data.article.slug}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong... NGMI 😢')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=/articles/write`,
      },
    })
  }

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=/articles/write`,
      },
    })
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-a24-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-a24-muted animate-spin" />
      </div>
    )
  }

  // Not logged in - show login options
  if (!user) {
    return (
      <div className="min-h-screen bg-a24-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Pixelbara pose="question" size={140} className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-a24-text mb-2">
            Log In to Write
          </h1>
          <p className="text-sm text-a24-muted mb-8">
            Share your alpha with the community. Log in to get started.
          </p>

          <div className="space-y-3">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-gray-100 text-gray-900 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Kakao Login */}
            <button
              onClick={handleKakaoLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#FEE500] text-[#191919] text-sm font-medium hover:bg-[#FDD800] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 0.6C4.029 0.6 0 3.726 0 7.554C0 9.918 1.558 12.006 3.931 13.239L2.933 16.827C2.845 17.139 3.213 17.385 3.483 17.193L7.773 14.355C8.175 14.397 8.583 14.418 9 14.418C13.971 14.418 18 11.382 18 7.554C18 3.726 13.971 0.6 9 0.6Z"
                  fill="#191919"
                />
              </svg>
              Continue with Kakao
            </button>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
            <span className="text-xs text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-a24-border dark:bg-a24-dark-border" />
          </div>

          <Link
            href="/login"
            className="text-sm text-a24-muted hover:text-a24-text transition-colors"
          >
            Log in with Email
          </Link>

          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-a24-muted hover:text-a24-text mt-8 transition-colors block"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  // Get display name
  const displayName = isConnected && address
    ? (ensName || truncateAddress(address))
    : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous')

  return (
    <div className="min-h-screen bg-a24-bg">
      {/* Header */}
      <header className="border-b border-a24-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-a24-muted hover:text-a24-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center gap-4">
            {/* Connected User/Wallet Info */}
            <div className="flex items-center gap-2 text-sm text-a24-muted">
              {isConnected && address ? (
                <>
                  <Blockies address={address} size={20} />
                  <span>{displayName}</span>
                </>
              ) : (
                <>
                  {user.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-a24-text text-xs">
                      {displayName[0].toUpperCase()}
                    </div>
                  )}
                  <span>{displayName}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm text-a24-muted border border-gray-700 px-4 py-2 hover:border-gray-500 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-a24-text px-4 py-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Publish
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Editor */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="Article Title"
                maxLength={60}
                className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-a24-text placeholder:text-gray-600"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-a24-muted">
                <span>{form.title.length}/60</span>
                {form.slug && <span className="font-mono">/articles/{form.slug}</span>}
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description (optional)"
                rows={2}
                className="w-full text-sm bg-transparent border border-a24-border p-3 outline-none text-a24-text placeholder:text-gray-600 resize-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
                Cover Image (optional)
              </label>
              <ThumbnailUpload
                value={form.cover_image}
                onChange={(url) => setForm((prev) => ({ ...prev, cover_image: url }))}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-a24-muted mb-2">
                Tags (up to 5)
              </label>

              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-400 text-xs"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-a24-text">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {form.tags.length < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(tagInput)
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1 text-sm bg-transparent border border-a24-border px-3 py-2 outline-none text-a24-text placeholder:text-gray-600 focus:border-purple-500 transition-colors"
                  />
                  <button
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="px-3 py-2 bg-gray-800 text-a24-muted hover:text-a24-text disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mt-3">
                {SUGGESTED_TAGS.filter(t => !form.tags.includes(t.toLowerCase())).slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    disabled={form.tags.length >= 5}
                    className="px-2 py-1 text-xs text-a24-muted border border-a24-border hover:border-gray-600 hover:text-a24-text disabled:opacity-50 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor */}
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
              placeholder="Write your article..."
            />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              {/* Author Preview */}
              <div className="border border-a24-border p-5">
                <h3 className="text-xs uppercase tracking-wider text-a24-muted mb-4 font-medium">
                  Publishing As
                </h3>
                <div className="flex items-center gap-3">
                  {isConnected && address ? (
                    <Blockies address={address} size={40} />
                  ) : user.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-a24-text font-bold">
                      {displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-a24-text font-medium">{displayName}</p>
                    <p className="text-xs text-a24-muted">
                      {isConnected ? truncateAddress(address!) : user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Connection - Clearly Optional */}
              {!isConnected && (
                <div className="border border-dashed border-purple-500/20 bg-purple-500/5 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase tracking-wider text-purple-400 font-medium flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5" />
                      Wallet
                    </h3>
                    <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-medium bg-gray-800 text-gray-400 rounded">
                      Optional
                    </span>
                  </div>
                  <p className="text-xs text-a24-muted mb-1">
                    You can publish articles without a wallet.
                  </p>
                  <p className="text-[11px] text-a24-muted/60 mb-4">
                    Connect for extra Web3 perks:
                  </p>
                  <ul className="space-y-2 text-xs text-a24-muted/70 mb-4">
                    <li className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-purple-400/60" />
                      On-chain reputation badges
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-purple-400/60" />
                      POAP for published articles
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-purple-400/60" />
                      ENS name display
                    </li>
                  </ul>
                  <WalletConnect />
                </div>
              )}

              {/* Show Web3 badges if wallet connected */}
              {isConnected && address && (
                <Web3Badges address={address} showSync compact />
              )}

              {/* Writing Guide - Web3 style */}
              <div className="border border-a24-border p-5">
                <h3 className="text-xs uppercase tracking-wider text-a24-muted mb-4 font-medium">
                  Writing Guide
                </h3>
                <ul className="space-y-3 text-xs text-a24-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">01</span>
                    <span>Short & punchy titles. WAGMI vibes only 🔥</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">02</span>
                    <span>Add a cover image. First impressions matter 👀</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">03</span>
                    <span>Tag it right. Help frens discover your alpha 🏷️</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">04</span>
                    <span>Structure with headings. Few understand 🧠</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">05</span>
                    <span>Double-check before mint! No rugs ✅</span>
                  </li>
                </ul>
              </div>

              {/* Reading Time Estimate */}
              <div className="border border-a24-border p-5">
                <h3 className="text-xs uppercase tracking-wider text-a24-muted mb-2 font-medium">
                  Estimated Reading Time
                </h3>
                <p className="text-2xl font-bold text-a24-text">
                  {calculateReadingTime(form.content)} min
                </p>
              </div>

              <div className="text-center">
                <Pixelbara pose="sparkle" size={80} className="mx-auto opacity-50" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
