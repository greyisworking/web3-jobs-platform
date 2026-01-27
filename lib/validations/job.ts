import { z } from 'zod'

// 크롤러에서 수집한 데이터 유효성 검사 스키마
export const jobSchema = z.object({
  title: z.string().min(2, '제목은 최소 2자 이상이어야 합니다'),
  company: z.string().min(1, '회사명은 필수입니다'),
  url: z.string().url('유효하지 않은 URL 형식입니다'),
  location: z.string().optional().default('Remote'),
  type: z.string().optional().default('Full-time'),
  category: z.string().optional().default('Engineering'),
  salary: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().min(1, '소스는 필수입니다'),
  region: z.string().optional().default('Global'),
  postedDate: z.date().optional(),
})

export type JobInput = z.infer<typeof jobSchema>

// 상태값 스키마
export const jobStatusSchema = z.enum(['pending', 'active', 'expired', 'hidden'])
export type JobStatus = z.infer<typeof jobStatusSchema>
