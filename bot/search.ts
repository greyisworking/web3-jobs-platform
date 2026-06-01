import { PrismaClient } from '@prisma/client'
import type { ParsedQuery } from './parse-query'

const prisma = new PrismaClient()

export interface JobResult {
  title: string
  company: string
  remoteType: string | null
  url: string
}

export async function searchJobs(
  query: ParsedQuery,
): Promise<{ jobs: JobResult[]; count: number }> {
  const conditions: Record<string, unknown>[] = []

  // roleKeyword → 단어별 분리, 각 단어가 title/role/category 중 하나에 포함 (AND)
  if (query.roleKeyword) {
    const words = query.roleKeyword
      .split(/\s+/)
      .filter((w) => w.length >= 2)

    for (const word of words) {
      conditions.push({
        OR: [
          { title: { contains: word, mode: 'insensitive' } },
          { role: { contains: word, mode: 'insensitive' } },
          { category: { contains: word, mode: 'insensitive' } },
        ],
      })
    }
  }

  // other 키워드 → title/tags/sector 부분일치
  if (query.other) {
    const otherWords = query.other
      .split(/\s+/)
      .filter((w) => w.length >= 2)

    for (const word of otherWords) {
      conditions.push({
        OR: [
          { title: { contains: word, mode: 'insensitive' } },
          { tags: { contains: word, mode: 'insensitive' } },
          { sector: { contains: word, mode: 'insensitive' } },
        ],
      })
    }
  }

  // remote 필터
  if (query.remote === true) {
    conditions.push({
      OR: [
        { remoteType: { contains: 'remote', mode: 'insensitive' } },
        { type: { contains: 'remote', mode: 'insensitive' } },
      ],
    })
  }

  const where = {
    isActive: true,
    ...(conditions.length > 0 ? { AND: conditions } : {}),
  }

  console.log('[search] where:', JSON.stringify(where, null, 2))

  const [count, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: { postedDate: 'desc' },
      take: 3,
      select: {
        title: true,
        company: true,
        remoteType: true,
        url: true,
      },
    }),
  ])

  console.log('[search] count:', count, '| top:', jobs.map((j) => j.title))

  return { jobs, count }
}
