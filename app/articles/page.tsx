'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Eye } from 'lucide-react'
import type { Article } from '@/types/article'
import SubpageHeader from '../components/SubpageHeader'
import Footer from '../components/Footer'
import Pixelbara from '../components/Pixelbara'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <div className="max-w-3xl mx-auto px-6">
        <SubpageHeader title="A R T I C L E S" />
      </div>

      <main className="max-w-3xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="py-24 text-center">
            <Pixelbara pose="loading" size={120} className="mx-auto mb-4" />
            <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted">
              Loading articles...
            </p>
          </div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
            <Pixelbara pose="empty" size={140} className="mx-auto mb-4" />
            <p className="text-lg font-light uppercase tracking-[0.2em] text-a24-text dark:text-a24-dark-text mb-2">
              No articles yet
            </p>
            <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
              Web3 insights coming soon. Stay tuned.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-a24-border dark:border-a24-dark-border"
              >
                <Link
                  href={`/articles/${article.slug}`}
                  className="block py-8 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-medium text-a24-text dark:text-a24-dark-text mb-2 group-hover:underline decoration-1 underline-offset-4">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-sm text-a24-muted dark:text-a24-dark-muted line-clamp-2 mb-3">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-[11px] text-a24-muted/70 dark:text-a24-dark-muted/70 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {article.published_at ? formatDate(article.published_at) : 'Draft'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.view_count}
                        </span>
                        <span>{article.author_name}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-a24-muted dark:text-a24-dark-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
