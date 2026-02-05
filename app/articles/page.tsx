'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Eye, Heart, PenLine } from 'lucide-react'
import { useAccount } from 'wagmi'
import type { Article } from '@/types/article'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import SubpageHeader from '../components/SubpageHeader'
import Footer from '../components/Footer'
import Pixelbara from '../components/Pixelbara'
import Blockies, { truncateAddress } from '../components/Blockies'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const { isConnected } = useAccount()
  const supabase = createSupabaseBrowserClient()

  // Check auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase.auth])

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

  // Get all unique tags
  const allTags = [...new Set(articles.flatMap(a => a.tags || []))]

  // Filter by selected tag
  const filteredArticles = selectedTag
    ? articles.filter(a => a.tags?.includes(selectedTag))
    : articles

  return (
    <div className="min-h-screen bg-a24-bg">
      <div className="max-w-3xl mx-auto px-6">
        <SubpageHeader title="A R T I C L E S" />
      </div>

      <main className="max-w-3xl mx-auto px-6 pb-20">
        {/* Hero with Pixelbara */}
        <div className="py-12 border-b border-a24-border mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-2">
                Web3 Insights
              </p>
              <h2 className="text-2xl font-bold text-a24-text mb-2">
                Reading the Alpha
              </h2>
              <p className="text-sm text-a24-muted">
                Discover insights from the community. Connect wallet to write.
              </p>
            </div>
            <div className="relative">
              <Pixelbara pose="sitting" size={100} className="opacity-90" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-a24-surface px-2 py-1 text-[10px] text-a24-muted whitespace-nowrap">
                reading the alpha
              </div>
            </div>
          </div>

          {/* Write Button */}
          <div className="mt-6">
            {(isConnected || user) ? (
              <Link
                href="/articles/write"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-a24-text text-sm font-medium transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Write Article
              </Link>
            ) : (
              <Link
                href="/articles/write"
                className="text-sm text-a24-muted hover:text-gray-300 transition-colors"
              >
                Sign in to write articles
              </Link>
            )}
          </div>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                !selectedTag
                  ? 'bg-purple-600 text-a24-text'
                  : 'bg-a24-surface text-a24-muted hover:text-a24-text'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-purple-600 text-a24-text'
                    : 'bg-a24-surface text-a24-muted hover:text-a24-text'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Pixelbara pose="loading" size={120} className="mx-auto mb-4" />
            <p className="text-sm text-a24-muted">
              Loading articles...
            </p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-24 text-center border border-a24-border">
            <Pixelbara pose="sparkle" size={140} className="mx-auto mb-4" />
            <p className="text-sm text-a24-muted">
              no articles yet... be the first writer
            </p>
            <Link
              href="/articles/write"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-a24-text text-sm font-medium transition-colors"
            >
              <PenLine className="w-4 h-4" />
              Write Article
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-a24-border"
              >
                <Link
                  href={`/articles/${article.slug}`}
                  className="block py-6 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {article.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-[10px] uppercase tracking-wider"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h2 className="text-lg font-medium text-a24-text mb-2 group-hover:text-purple-400 transition-colors">
                        {article.title}
                      </h2>

                      {article.excerpt && (
                        <p className="text-sm text-a24-muted line-clamp-2 mb-3">
                          {article.excerpt}
                        </p>
                      )}

                      {/* Author & Meta */}
                      <div className="flex items-center gap-4 text-[11px] text-a24-muted">
                        {/* Author with Blockies */}
                        <div className="flex items-center gap-1.5">
                          {article.author_address ? (
                            <>
                              <Blockies address={article.author_address} size={16} />
                              <span className="text-a24-muted">
                                {article.author_ens || truncateAddress(article.author_address)}
                              </span>
                            </>
                          ) : (
                            <span>{article.author_name}</span>
                          )}
                        </div>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.reading_time || 1} min
                        </span>

                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.view_count}
                        </span>

                        {article.collect_count > 0 && (
                          <span className="flex items-center gap-1 text-purple-400">
                            <Heart className="w-3 h-3" />
                            {article.collect_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cover Image Thumbnail */}
                    <div className="w-24 h-24 flex-shrink-0 bg-a24-surface">
                      {article.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Pixelbara pose="reading" size={64} />
                        </div>
                      )}
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
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
