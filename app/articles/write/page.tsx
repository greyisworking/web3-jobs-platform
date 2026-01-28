'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react'
import RichTextEditor from '@/app/components/RichTextEditor'
import Pixelbara from '@/app/components/Pixelbara'

export default function ArticleWritePage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    published: false,
  })

  useEffect(() => {
    // Check admin status
    fetch('/api/admin/check')
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.isAdmin))
      .catch(() => setIsAdmin(false))
  }, [])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
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

  const handleSubmit = async (publish: boolean) => {
    if (!form.title || !form.content) {
      alert('Title and content are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          published: publish,
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

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Pixelbara pose="loading" size={120} className="mx-auto mb-4" />
          <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
            Checking permissions...
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Pixelbara pose="notfound" size={180} className="mx-auto mb-6" />
          <p className="text-2xl font-light text-a24-text dark:text-a24-dark-text mb-2">
            Admin Only
          </p>
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-6">
            ser, you need admin access to write articles.
          </p>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-6 py-3 hover:bg-a24-text hover:text-white dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      {/* Header */}
      <header className="border-b border-a24-border dark:border-a24-dark-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted border border-a24-border dark:border-a24-dark-border px-4 py-2 hover:border-a24-text dark:hover:border-a24-dark-text transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg px-4 py-2 hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Publish
            </button>
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
                className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-a24-text dark:text-a24-dark-text placeholder:text-a24-muted/50 dark:placeholder:text-a24-dark-muted/50"
              />
              <div className="flex items-center justify-between mt-2 text-[11px] text-a24-muted dark:text-a24-dark-muted">
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
                className="w-full text-sm bg-transparent border border-a24-border dark:border-a24-dark-border p-3 outline-none text-a24-text dark:text-a24-dark-text placeholder:text-a24-muted/50 dark:placeholder:text-a24-dark-muted/50 resize-none focus:border-a24-text dark:focus:border-a24-dark-text transition-colors"
              />
            </div>

            {/* Cover Image */}
            <div>
              <input
                type="url"
                value={form.cover_image}
                onChange={(e) => setForm((prev) => ({ ...prev, cover_image: e.target.value }))}
                placeholder="Cover image URL (optional)"
                className="w-full text-sm bg-transparent border border-a24-border dark:border-a24-dark-border p-3 outline-none text-a24-text dark:text-a24-dark-text placeholder:text-a24-muted/50 dark:placeholder:text-a24-dark-muted/50 focus:border-a24-text dark:focus:border-a24-dark-text transition-colors"
              />
            </div>

            {/* Content Editor */}
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
              placeholder="Write your article..."
            />
          </div>

          {/* Writing Guide Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <div className="border border-a24-border dark:border-a24-dark-border p-5">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text mb-4 font-medium">
                  Writing Guide
                </h3>
                <ul className="space-y-3 text-[12px] text-a24-muted dark:text-a24-dark-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-a24-text dark:text-a24-dark-text">01</span>
                    <span>Keep titles concise and clear (max 60 chars)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-a24-text dark:text-a24-dark-text">02</span>
                    <span>Add a cover image for visual impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-a24-text dark:text-a24-dark-text">03</span>
                    <span>Use headings to structure your content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-a24-text dark:text-a24-dark-text">04</span>
                    <span>Include relevant images and videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-a24-text dark:text-a24-dark-text">05</span>
                    <span>Proofread before publishing</span>
                  </li>
                </ul>
              </div>

              <div className="border border-a24-border dark:border-a24-dark-border p-5">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text mb-4 font-medium">
                  Editor Tips
                </h3>
                <ul className="space-y-2 text-[12px] text-a24-muted dark:text-a24-dark-muted">
                  <li><strong>Bold</strong> - Select text + click B</li>
                  <li><em>Italic</em> - Select text + click I</li>
                  <li><u>Underline</u> - Select text + click U</li>
                  <li>Links - Select text + click link icon</li>
                  <li>Images - Click image icon + paste URL</li>
                  <li>Videos - Paste YouTube URL</li>
                </ul>
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
