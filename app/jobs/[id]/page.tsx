import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Job } from '@/types/job'
import JobDetailPageClient from './JobDetailPageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web3jobs.kr'

async function getJob(id: string): Promise<Job | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('Job')
    .select('*')
    .eq('id', id)
    .eq('isActive', true)
    .single()

  if (error || !data) return null
  return data as Job
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    return { title: '공고를 찾을 수 없습니다 - Web3 Jobs Platform' }
  }

  const backerText = job.backers?.length
    ? ` | Backed by ${job.backers.slice(0, 3).join(', ')}`
    : ''

  const title = job.backers?.length
    ? `${job.title} at ${job.company} | Backed by ${job.backers[0]}`
    : `${job.title} - ${job.company} | Web3 Jobs Platform`

  const tags = parseTags(job.tags)
  const tagText = tags.length ? ` | Skills: ${tags.slice(0, 5).join(', ')}` : ''
  const salaryText = job.salary ? ` | ${job.salary}` : ''
  const description = job.description
    ?? `${job.type} position at ${job.company}. Location: ${job.location}.${salaryText}${tagText}${backerText}`

  const logoUrl = `https://logo.clearbit.com/${encodeURIComponent(job.company.toLowerCase().replace(/\s+/g, ''))}.com`

  return {
    title,
    description,
    alternates: {
      canonical: `/jobs/${id}`,
    },
    openGraph: {
      title: `${job.title} - ${job.company}`,
      description,
      images: [{ url: logoUrl, width: 128, height: 128, alt: job.company }],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${job.title} - ${job.company}`,
      description,
      images: [logoUrl],
    },
  }
}

function buildJobPostingJsonLd(job: Job) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description ?? `${job.title} at ${job.company}`,
    datePosted: job.postedDate ? new Date(job.postedDate).toISOString() : undefined,
    employmentType: job.type?.toUpperCase().replace(/-/g, '_') ?? 'FULL_TIME',
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      logo: `https://logo.clearbit.com/${encodeURIComponent(job.company.toLowerCase().replace(/\s+/g, ''))}.com`,
    },
    url: `${baseUrl}/jobs/${job.id}`,
  }

  if (job.salary) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salary,
      },
    }
  }

  return jsonLd
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  const jsonLd = buildJobPostingJsonLd(job)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobDetailPageClient job={job} />
    </>
  )
}
