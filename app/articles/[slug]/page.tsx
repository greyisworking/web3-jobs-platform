'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Eye, User } from 'lucide-react'
import type { Article } from '@/types/article'
import Pixelbara from '@/app/components/Pixelbara'
import Footer from '@/app/components/Footer'

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!params.slug) return

    fetch(`/api/articles/${params.slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => {
        setArticle(data.article)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [params.slug])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Pixelbara pose="loading" size={120} className="mx-auto mb-4" />
          <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Pixelbara pose="notfound" size={180} className="mx-auto mb-6" />
          <p className="text-2xl font-light text-a24-text dark:text-a24-dark-text mb-2">
            Article not found
          </p>
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-6">
            ser, this article doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text border border-a24-text dark:border-a24-dark-text px-6 py-3 hover:bg-a24-text hover:text-white dark:hover:bg-a24-dark-text dark:hover:text-a24-dark-bg transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 pt-24 pb-12">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-a24-muted dark:text-a24-dark-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Articles
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-a24-text dark:text-a24-dark-text leading-tight mb-6">
          {article.title}
        </h1>

        <div className="flex items-center gap-6 text-[11px] text-a24-muted dark:text-a24-dark-muted uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <User className="w-3 h-3" />
            {article.author_name}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {article.published_at ? formatDate(article.published_at) : 'Draft'}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3 h-3" />
            {article.view_count} views
          </span>
        </div>
      </header>

      {/* Cover Image */}
      {article.cover_image && (
        <div className="max-w-4xl mx-auto px-6 mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full aspect-video object-cover"
          />
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 pb-20">
        <div
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-wide
            prose-p:text-a24-text prose-p:dark:text-a24-dark-text prose-p:font-light prose-p:leading-relaxed
            prose-a:text-a24-text prose-a:dark:text-a24-dark-text prose-a:underline prose-a:underline-offset-4
            prose-blockquote:border-a24-muted prose-blockquote:dark:border-a24-dark-muted prose-blockquote:text-a24-muted prose-blockquote:dark:text-a24-dark-muted
            prose-img:mx-auto
          "
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      <Footer />
    </div>
  )
}
