'use client'

import useSWR from 'swr'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author_wallet: string
  author_name?: string
  cover_image?: string
  tags?: string[]
  reading_time?: number
  created_at: string
  updated_at: string
  published: boolean
  tip_count?: number
  tip_total?: number
  collect_count?: number
}

interface ArticlesResponse {
  articles: Article[]
  total: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const swrOptions = {
  revalidateOnFocus: true,
  dedupingInterval: 60000,
  refreshInterval: 300000,
}

/**
 * Hook to fetch all articles with SWR caching
 */
export function useArticles(params?: { page?: number; limit?: number; tag?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.tag) searchParams.set('tag', params.tag)

  const queryString = searchParams.toString()
  const url = `/api/articles${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<ArticlesResponse>(
    url,
    fetcher,
    swrOptions
  )

  return {
    articles: data?.articles || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook to fetch a single article by slug
 */
export function useArticle(slug: string | null) {
  const { data, error, isLoading } = useSWR<{ article: Article }>(
    slug ? `/api/articles/${slug}` : null,
    fetcher,
    {
      ...swrOptions,
      revalidateOnFocus: false,
    }
  )

  return {
    article: data?.article || null,
    isLoading,
    isError: error,
  }
}

export default useArticles
