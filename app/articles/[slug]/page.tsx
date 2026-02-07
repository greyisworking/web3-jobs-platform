import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Article } from '@/types/article'
import ArticleDetailClient from './ArticleDetailClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

async function getArticle(slug: string): Promise<Article | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as Article
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return { title: 'Article Not Found — Neun' }
  }

  const title = `${article.title} — Neun`
  const description = article.excerpt || `Read "${article.title}" on Neun`
  const ogImage = article.cover_image || `${baseUrl}/og-image.png`

  return {
    title,
    description,
    alternates: {
      canonical: `/articles/${slug}`,
    },
    openGraph: {
      title: article.title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: [article.author_ens || article.author_name],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  return <ArticleDetailClient article={article} />
}
