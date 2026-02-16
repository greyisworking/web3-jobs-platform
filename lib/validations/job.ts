import { z } from 'zod'

// Role categories for job classification
export const ROLE_CATEGORIES = [
  'Engineering',
  'Product',
  'Design',
  'Marketing/Growth',
  'Business Development',
  'Operations/HR',
  'Community/Support',
] as const

export type RoleCategory = typeof ROLE_CATEGORIES[number]

export const jobSchema = z.object({
  title: z.string().min(2, '제목은 최소 2자 이상이어야 합니다'),
  company: z.string().min(1, '회사명은 필수입니다'),
  url: z.string().url('유효하지 않은 URL 형식입니다'),
  location: z.string().optional().default('Remote'),
  type: z.string().optional().default('Full-time'),
  category: z.string().optional().default('Engineering'),
  role: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().min(1, '소스는 필수입니다'),
  region: z.string().optional().default('Global'),
  postedDate: z.date().optional(),
  backers: z.array(z.string()).nullable().optional(),
  sector: z.string().nullable().optional(),
  office_location: z.string().nullable().optional(),
  badges: z.array(z.string()).nullable().optional(),
  // Enhanced job details
  description: z.string().nullable().optional(),
  raw_description: z.string().nullable().optional(),  // Original unformatted description
  requirements: z.string().nullable().optional(),
  responsibilities: z.string().nullable().optional(),
  benefits: z.string().nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  deadline: z.date().nullable().optional(),
  experienceLevel: z.string().nullable().optional(),
  remoteType: z.string().nullable().optional(),
  companyLogo: z.string().nullable().optional(),
  companyWebsite: z.string().nullable().optional(),
})

export type JobInput = z.infer<typeof jobSchema>

// 상태값 스키마
export const jobStatusSchema = z.enum(['pending', 'active', 'expired', 'hidden'])
export type JobStatus = z.infer<typeof jobStatusSchema>
