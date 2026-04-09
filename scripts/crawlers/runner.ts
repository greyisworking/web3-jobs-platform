/**
 * Shared crawler runner — eliminates save-loop / CrawlLog / logging boilerplate.
 *
 * Each crawler only needs to provide:
 *   1. fetchJobs()    — fetch raw data from the source
 *   2. mapToJobInput() — transform one raw item into a validateAndSaveJob-compatible object
 */
import { supabase } from '../../lib/supabase-script'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'
import type { CrawlerReturn } from './platforms'

export interface RunCrawlerOptions<T> {
  source: string
  displayName: string
  emoji: string
  fetchJobs: () => Promise<T[]>
  mapToJobInput: (raw: T) => Record<string, unknown> | null
  saveDelayMs?: number   // default 100
}

export async function runCrawler<T>(opts: RunCrawlerOptions<T>): Promise<CrawlerReturn> {
  const {
    source,
    displayName,
    emoji,
    fetchJobs,
    mapToJobInput,
    saveDelayMs = 100,
  } = opts

  console.log(`${emoji} Starting ${displayName} crawler...`)

  let jobs: T[]
  try {
    jobs = await fetchJobs()
  } catch (error: any) {
    console.error(`❌ Failed to fetch ${displayName}:`, error.message || error)
    await supabase.from('CrawlLog').insert({
      source,
      status: 'failed',
      jobCount: 0,
      error: error.message || String(error),
      createdAt: new Date().toISOString(),
    })
    return { total: 0, new: 0 }
  }

  console.log(`📦 Found ${jobs.length} jobs from ${displayName}`)

  let savedCount = 0
  let newCount = 0
  for (const raw of jobs) {
    try {
      const input = mapToJobInput(raw)
      if (!input) continue

      const result = await validateAndSaveJob(input, source)
      if (result.saved) savedCount++
      if (result.isNew) newCount++
      await delay(saveDelayMs)
    } catch (error) {
      console.error(`Error saving ${displayName} job:`, error)
    }
  }

  await supabase.from('CrawlLog').insert({
    source,
    status: 'success',
    jobCount: savedCount,
    createdAt: new Date().toISOString(),
  })

  console.log(`✅ Saved ${savedCount} jobs from ${displayName} (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
