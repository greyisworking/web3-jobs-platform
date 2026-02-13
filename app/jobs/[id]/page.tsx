import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Job } from '@/types/job'
import CareersDetailClient from './CareersDetailClient'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf'

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
    return { title: 'Job Not Found | NEUN' }
  }

  // Unified title format: "{직무} at {회사} | NEUN"
  const title = `${job.title} at ${job.company} | NEUN`

  // Build rich description
  const parts: string[] = []
  parts.push(`${job.type || 'Full-time'} position at ${job.company}`)
  if (job.location) parts.push(`Location: ${job.location}`)
  if (job.salaryMin && job.salaryMax) {
    parts.push(`Salary: ${job.salaryCurrency || 'USD'} ${job.salaryMin.toLocaleString()}-${job.salaryMax.toLocaleString()}`)
  } else if (job.salary) {
    parts.push(`Salary: ${job.salary}`)
  }
  if (job.backers?.length) {
    parts.push(`Backed by ${job.backers.slice(0, 3).join(', ')}`)
  }
  const tags = parseTags(job.tags)
  if (tags.length) {
    parts.push(`Skills: ${tags.slice(0, 5).join(', ')}`)
  }

  // Use job description if available, otherwise build from parts
  const description = job.description
    ? job.description.slice(0, 160).replace(/\n/g, ' ').trim() + '...'
    : parts.join(' • ')

  const logoUrl = `https://logo.clearbit.com/${encodeURIComponent(job.company.toLowerCase().replace(/\s+/g, ''))}.com`
  const ogImageUrl = `${baseUrl}/og-image.png` // Fallback to site OG image

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/jobs/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/jobs/${id}`,
      siteName: 'NEUN',
      images: [
        { url: ogImageUrl, width: 1200, height: 630, alt: `${job.title} at ${job.company}` },
        { url: logoUrl, width: 128, height: 128, alt: job.company },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@neun_io',
    },
    other: {
      'application-name': 'NEUN',
    },
  }
}

function buildJobPostingJsonLd(job: Job) {
  // Map employment type to schema.org format
  const employmentTypeMap: Record<string, string> = {
    'full-time': 'FULL_TIME',
    'fulltime': 'FULL_TIME',
    'part-time': 'PART_TIME',
    'parttime': 'PART_TIME',
    'contract': 'CONTRACTOR',
    'contractor': 'CONTRACTOR',
    'freelance': 'CONTRACTOR',
    'intern': 'INTERN',
    'internship': 'INTERN',
    'temporary': 'TEMPORARY',
    'ambassador': 'OTHER',
  }
  const employmentType = employmentTypeMap[job.type?.toLowerCase() || ''] || 'FULL_TIME'

  // Check if remote
  const isRemote = job.remoteType === 'Remote' ||
    job.location?.toLowerCase().includes('remote') ||
    job.region === 'Global'

  // Build description - clean HTML and limit length for Google
  let description = job.description || `${job.title} position at ${job.company}`
  // Strip HTML tags and limit to 4000 chars (Google limit)
  description = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000)

  // Calculate validThrough (60 days from posted date or now)
  const postedDate = job.postedDate ? new Date(job.postedDate) : new Date()
  const validThrough = new Date(postedDate)
  validThrough.setDate(validThrough.getDate() + 60)

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description,
    datePosted: postedDate.toISOString().split('T')[0],
    validThrough: validThrough.toISOString().split('T')[0],
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      sameAs: job.companyWebsite || undefined,
      logo: `https://logo.clearbit.com/${encodeURIComponent(job.company.toLowerCase().replace(/\s+/g, ''))}.com`,
    },
    identifier: {
      '@type': 'PropertyValue',
      name: 'NEUN',
      value: job.id,
    },
    url: `${baseUrl}/jobs/${job.id}`,
    directApply: true,
  }

  // Job location
  if (isRemote) {
    jsonLd.jobLocationType = 'TELECOMMUTE'
    jsonLd.applicantLocationRequirements = {
      '@type': 'Country',
      name: job.region === 'Korea' ? 'South Korea' : 'Worldwide',
    }
  }
  jsonLd.jobLocation = {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: job.location?.split(',')[0]?.trim() || 'Remote',
      addressRegion: job.region === 'Korea' ? 'Seoul' : undefined,
      addressCountry: job.region === 'Korea' ? 'KR' : undefined,
    },
  }

  // Salary information (Google for Jobs requires specific format)
  if (job.salaryMin || job.salaryMax) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salaryCurrency || 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin || undefined,
        maxValue: job.salaryMax || undefined,
        unitText: 'YEAR',
      },
    }
  } else if (job.salary) {
    // Try to parse salary string
    const salaryMatch = job.salary.match(/[\d,]+/g)
    if (salaryMatch) {
      const values = salaryMatch.map(v => parseInt(v.replace(/,/g, '')))
      jsonLd.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: job.salary.includes('₩') || job.salary.includes('KRW') ? 'KRW' : 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: values[0],
          maxValue: values[1] || values[0],
          unitText: 'YEAR',
        },
      }
    }
  }

  // Experience level
  if (job.experienceLevel) {
    const levelMap: Record<string, string> = {
      'Junior': 'Entry level',
      'Mid': 'Mid-Senior level',
      'Senior': 'Senior level',
      'Lead': 'Director',
    }
    jsonLd.experienceRequirements = levelMap[job.experienceLevel] || job.experienceLevel
  }

  // Skills/qualifications
  const tags = parseTags(job.tags)
  if (tags.length > 0) {
    jsonLd.skills = tags.join(', ')
  }

  // Industry
  if (job.sector) {
    jsonLd.industry = job.sector
  }

  return jsonLd
}

export default async function CareersDetailPage({ params }: PageProps) {
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
      <CareersDetailClient job={job} />
    </>
  )
}
