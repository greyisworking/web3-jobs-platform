import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { JobWithStatus, DuplicateGroup } from '@/types/admin'

export const dynamic = 'force-dynamic'

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a: string, b: string): number {
  const na = normalizeText(a)
  const nb = normalizeText(b)
  if (na === nb) return 1.0

  const wordsA = new Set(na.split(' '))
  const wordsB = new Set(nb.split(' '))
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])

  if (union.size === 0) return 0
  return intersection.size / union.size
}

export const GET = withAdminAuth(async (_request, _admin) => {
  const supabase = await createSupabaseServerClient()

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('*')
    .eq('isActive', true)
    .order('company', { ascending: true })
    .limit(1000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ groups: [] })
  }

  // Group by normalized company name
  const companyGroups = new Map<string, JobWithStatus[]>()
  for (const job of jobs as JobWithStatus[]) {
    const key = normalizeText(job.company)
    if (!companyGroups.has(key)) {
      companyGroups.set(key, [])
    }
    companyGroups.get(key)!.push(job)
  }

  const duplicateGroups: DuplicateGroup[] = []

  for (const [companyKey, companyJobs] of companyGroups) {
    if (companyJobs.length < 2) continue

    // Within same company, find jobs with similar titles
    const visited = new Set<number>()

    for (let i = 0; i < companyJobs.length; i++) {
      if (visited.has(i)) continue

      const group: JobWithStatus[] = [companyJobs[i]]
      let maxSim = 0

      for (let j = i + 1; j < companyJobs.length; j++) {
        if (visited.has(j)) continue

        const sim = similarity(companyJobs[i].title, companyJobs[j].title)
        if (sim >= 0.6) {
          group.push(companyJobs[j])
          visited.add(j)
          maxSim = Math.max(maxSim, sim)
        }
      }

      if (group.length > 1) {
        visited.add(i)
        duplicateGroups.push({
          key: `${companyKey}-${i}`,
          jobs: group,
          similarity: Math.round(maxSim * 100),
        })
      }
    }
  }

  // Sort by similarity descending
  duplicateGroups.sort((a, b) => b.similarity - a.similarity)

  return NextResponse.json({ groups: duplicateGroups })
})
