import { createPublicSupabaseClient } from '@/lib/supabase-public'
import type { Job } from '@/types/job'

const LIST_FIELDS = [
  'id', 'title', 'company', 'url', 'location', 'type', 'category',
  'salary', 'salaryMin', 'salaryMax', 'salaryCurrency', 'tags', 'source', 'region',
  'postedDate', 'crawledAt', 'updatedAt', 'isActive',
  'experienceLevel', 'remoteType', 'companyLogo',
  'backers', 'sector', 'badges', 'is_featured', 'is_urgent'
].join(',')

const FEATURED_COUNT = 9
const POOL_LIMIT = 120
const DAYS_WINDOW = 7

/**
 * Seeded PRNG (mulberry32) — deterministic within each 30-min ISR window
 * so the same build always returns the same set, but next revalidation differs.
 */
function seededRandom(seed: number) {
  let t = seed + 0x6D2B79F5
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function getFeaturedJobs(): Promise<Job[]> {
  const supabase = createPublicSupabaseClient()

  const since = new Date()
  since.setDate(since.getDate() - DAYS_WINDOW)

  const { data: pool, error } = await supabase
    .from('Job')
    .select(LIST_FIELDS)
    .eq('isActive', true)
    .gte('postedDate', since.toISOString())
    .order('postedDate', { ascending: false })
    .limit(POOL_LIMIT)

  if (error) {
    console.error('getFeaturedJobs error:', error)
    return []
  }

  const jobs = (pool ?? []) as unknown as Job[]
  if (jobs.length === 0) return []

  // 30-min time window seed — changes every ISR cycle
  const seed = Math.floor(Date.now() / (30 * 60 * 1000))
  const rand = seededRandom(seed)

  // Korean character regex (Hangul syllables)
  const HANGUL = /[\uAC00-\uD7AF]/
  // Broken titles: starts with conjunction/preposition leftover from Korean strip
  const BROKEN_TITLE = /^(and|or|the|of|for|in|at|to)\s/i

  // Company dedup + quality filter for Featured
  const seen = new Set<string>()
  const deduped = jobs.filter((job) => {
    const key = (job.company || '').toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    // Exclude Korean company names (NEUN is English-only)
    if (HANGUL.test(job.company || '')) return false
    // Exclude rocketpunch (Korean job board)
    if (job.source === 'rocketpunch') return false
    // Exclude broken titles (e.g. "and Operations")
    if (BROKEN_TITLE.test((job.title || '').trim())) return false
    return true
  })

  // Boost is_featured and priority-source jobs to front before shuffle
  const boosted: Job[] = []
  const rest: Job[] = []
  for (const job of deduped) {
    if (job.is_featured || (job.source && job.source.startsWith('priority:'))) {
      boosted.push(job)
    } else {
      rest.push(job)
    }
  }

  // Shuffle each bucket, then ensure source/category diversity
  const shuffledBoosted = seededShuffle(boosted, rand)
  const shuffledRest = seededShuffle(rest, rand)

  // Pick with diversity: spread sources and categories
  const result: Job[] = []
  const usedSources = new Map<string, number>()
  const usedCategories = new Map<string, number>()
  const MAX_PER_SOURCE = 3
  const MAX_PER_CATEGORY = 3

  const candidates = [...shuffledBoosted, ...shuffledRest]

  for (const job of candidates) {
    if (result.length >= FEATURED_COUNT) break

    const src = job.source || 'unknown'
    const cat = job.category || 'Other'
    const srcCount = usedSources.get(src) || 0
    const catCount = usedCategories.get(cat) || 0

    if (srcCount >= MAX_PER_SOURCE || catCount >= MAX_PER_CATEGORY) continue

    result.push(job)
    usedSources.set(src, srcCount + 1)
    usedCategories.set(cat, catCount + 1)
  }

  // If diversity filter was too strict, backfill
  if (result.length < FEATURED_COUNT) {
    for (const job of candidates) {
      if (result.length >= FEATURED_COUNT) break
      if (!result.includes(job)) result.push(job)
    }
  }

  return result
}
