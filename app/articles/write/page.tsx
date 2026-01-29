'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Loader2, X, Plus, Wallet } from 'lucide-react'
import { useAccount, useEnsName } from 'wagmi'
import RichTextEditor from '@/app/components/RichTextEditor'
import Pixelbara from '@/app/components/Pixelbara'
import Blockies, { truncateAddress } from '@/app/components/Blockies'
import { WalletConnect } from '@/app/components/WalletConnect'

const SUGGESTED_TAGS = [
  'DeFi', 'NFT', 'DAO', 'Layer2', 'Security', 'Trading',
  'Development', 'Research', 'Tutorial', 'Opinion', 'News'
]

export default function ArticleWritePage() {
  const router = useRouter()
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

  // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (content: string) => {
    const text = content.replace(/<[^>]*>/g, '') // Strip HTML
    const words = text.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200))
  }

  const handleSubmit = async (publish: boolean) => {
    if (!form.title || !form.content) {
      alert('Title and content are required')
      return
    }

    if (!address) {
      alert('Please connect your wallet')
      return
    }

    setLoading(true)
    try {
      const readingTime = calculateReadingTime(form.content)

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          published: publish,
          author_address: address,
          author_ens: ensName || null,
          author_name: ensName || truncateAddress(address),
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
      alert(error instanceof Error ? error.message : 'Failed to create article')
    } finally {
      setLoading(false)
    }
  }

  // Not connected - show wallet connect prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Pixelbara pose="question" size={140} className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Connect Wallet to Write
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            ser, connect your wallet to share your alpha with the community.
          </p>

          <WalletConnect />

          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mt-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center gap-4">
            {/* Connected Wallet */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Blockies address={address!} size={20} />
              <span>{ensName || truncateAddress(address!)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm text-gray-400 border border-gray-700 px-4 py-2 hover:border-gray-500 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 transition-colors disabled:opacity-50"
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
                className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-white placeholder:text-gray-600"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
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
                className="w-full text-sm bg-transparent border border-gray-800 p-3 outline-none text-white placeholder:text-gray-600 resize-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Cover Image */}
            <div>
              <input
                type="url"
                value={form.cover_image}
                onChange={(e) => setForm((prev) => ({ ...prev, cover_image: e.target.value }))}
                placeholder="Cover image URL (optional)"
                className="w-full text-sm bg-transparent border border-gray-800 p-3 outline-none text-white placeholder:text-gray-600 focus:border-purple-500 transition-colors"
              />
              {form.cover_image && (
                <div className="mt-2 aspect-video bg-gray-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.cover_image}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Tags (up to 5)
              </label>

              {/* Selected Tags */}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-400 text-xs"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input */}
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
                    className="flex-1 text-sm bg-transparent border border-gray-800 px-3 py-2 outline-none text-white placeholder:text-gray-600 focus:border-purple-500 transition-colors"
                  />
                  <button
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="px-3 py-2 bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Suggested Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {SUGGESTED_TAGS.filter(t => !form.tags.includes(t.toLowerCase())).slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    disabled={form.tags.length >= 5}
                    className="px-2 py-1 text-xs text-gray-500 border border-gray-800 hover:border-gray-600 hover:text-gray-300 disabled:opacity-50 transition-colors"
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
              <div className="border border-gray-800 p-5">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                  Publishing As
                </h3>
                <div className="flex items-center gap-3">
                  <Blockies address={address!} size={40} />
                  <div>
                    <p className="text-white font-medium">
                      {ensName || truncateAddress(address!)}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {truncateAddress(address!)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Writing Guide */}
              <div className="border border-gray-800 p-5">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                  Writing Guide
                </h3>
                <ul className="space-y-3 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">01</span>
                    <span>Keep titles concise and clear</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">02</span>
                    <span>Add a cover image for visual impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">03</span>
                    <span>Use relevant tags to help discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">04</span>
                    <span>Structure with headings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">05</span>
                    <span>Proofread before publishing</span>
                  </li>
                </ul>
              </div>

              {/* Reading Time Estimate */}
              <div className="border border-gray-800 p-5">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
                  Estimated Reading Time
                </h3>
                <p className="text-2xl font-bold text-white">
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
