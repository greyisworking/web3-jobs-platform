import { createPublicSupabaseClient } from '@/lib/supabase-public'
import type { Job } from '@/types/job'

const LIST_FIELDS = [
  'id', 'title', 'company', 'url', 'location', 'type', 'category',
  'salary', 'salaryMin', 'salaryMax', 'salaryCurrency', 'tags', 'source', 'region',
  'postedDate', 'crawledAt', 'updatedAt', 'isActive',
  'experienceLevel', 'remoteType', 'companyLogo',
  'backers', 'sector', 'badges', 'is_featured', 'is_urgent'
].join(',')

export async function getFeaturedJobs(): Promise<Job[]> {
  const supabase = createPublicSupabaseClient()

  const { data: jobs, error } = await supabase
    .from('Job')
    .select(LIST_FIELDS)
    .eq('isActive', true)
    .or('is_featured.eq.true,source.in.(priority:greenhouse,priority:lever,priority:ashby)')
    .order('is_featured', { ascending: false, nullsFirst: false })
    .order('postedDate', { ascending: false })
    .limit(6)

  if (error) {
    console.error('getFeaturedJobs error:', error)
    return []
  }

  return (jobs as unknown as Job[]) ?? []
}
