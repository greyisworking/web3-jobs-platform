/**
 * Shared crawler runner — eliminates save-loop / CrawlLog / logging boilerplate.
 *
 * Each crawler only needs to provide:
 *   1. fetchJobs()    — fetch raw data from the source
 *   2. mapToJobInput() — transform one raw item into a validateAndSaveJob-compatible object
 */
import { PrismaClient } from '@prisma/client'
import { validateAndSaveJob } from '../../lib/validations/validate-job'
import { delay } from '../utils'
import type { CrawlerReturn } from './platforms'

const prisma = new PrismaClient()

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
    try {
      await prisma.crawlLog.create({
        data: { source, status: 'failed', jobCount: 0, error: error.message || String(error) },
      })
    } catch { /* CrawlLog write failure is non-fatal */ }
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

  try {
    await prisma.crawlLog.create({
      data: { source, status: 'success', jobCount: savedCount },
    })
  } catch { /* CrawlLog write failure is non-fatal */ }

  console.log(`✅ Saved ${savedCount} jobs from ${displayName} (${newCount} new)`)
  return { total: savedCount, new: newCount }
}
