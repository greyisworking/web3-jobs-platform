import type { MetadataRoute } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Revalidate sitemap every hour
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in Server Component context
          }
        },
      },
    }
  )

  // Fetch active jobs
  const { data: jobs } = await supabase
    .from('Job')
    .select('id, updatedAt, postedDate')
    .eq('isActive', true)
    .order('postedDate', { ascending: false })

  // Fetch published articles
  const { data: articles } = await supabase
    .from('Article')
    .select('slug, updatedAt')
    .eq('status', 'published')
    .order('createdAt', { ascending: false })

  // Fetch active bounties
  const { data: bounties } = await supabase
    .from('Bounty')
    .select('id, updatedAt')
    .eq('status', 'active')
    .order('createdAt', { ascending: false })

  // Job entries
  const jobEntries: MetadataRoute.Sitemap = (jobs ?? []).map((job) => ({
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: job.updatedAt ? new Date(job.updatedAt) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Article entries
  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Bounty entries
  const bountyEntries: MetadataRoute.Sitemap = (bounties ?? []).map((bounty) => ({
    url: `${baseUrl}/bounties/${bounty.id}`,
    lastModified: bounty.updatedAt ? new Date(bounty.updatedAt) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/ecosystem`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bounties`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/post-job`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  return [
    ...staticPages,
    ...jobEntries,
    ...articleEntries,
    ...bountyEntries,
  ]
}
