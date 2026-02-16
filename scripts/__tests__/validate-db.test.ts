/**
 * Database Validation Tests (Strict Mode)
 *
 * These tests FAIL if any job has invalid content.
 * Run after migration to ensure all data is clean.
 *
 * Usage: npm run test:validate-db
 */
import { describe, test, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { validateCleanedOutput } from '../utils/htmlParser'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

const itIfSupabase = supabase ? test : test.skip

describe('Database Validation (Strict)', () => {
  itIfSupabase('ALL job descriptions must be clean', async () => {
    // Fetch a large sample of jobs
    const { data: jobs, error } = await supabase!
      .from('Job')
      .select('id, title, description, source')
      .not('description', 'is', null)
      .limit(500)

    expect(error).toBeNull()
    expect(jobs).toBeDefined()

    const invalidJobs: Array<{ title: string; source: string; issues: string[] }> = []

    for (const job of jobs || []) {
      const result = validateCleanedOutput(job.description)
      if (!result.valid) {
        invalidJobs.push({
          title: job.title,
          source: job.source,
          issues: result.issues,
        })
      }
    }

    if (invalidJobs.length > 0) {
      console.log('\n❌ Found jobs with invalid content:')
      invalidJobs.slice(0, 20).forEach((job, i) => {
        console.log(`  ${i + 1}. ${job.title} (${job.source})`)
        job.issues.forEach(issue => console.log(`     - ${issue}`))
      })
      if (invalidJobs.length > 20) {
        console.log(`  ... and ${invalidJobs.length - 20} more`)
      }
    }

    // STRICT: This test FAILS if any invalid jobs found
    expect(invalidJobs.length).toBe(0)
  }, 60000)

  itIfSupabase('recent jobs (last 7 days) must be clean', async () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: jobs, error } = await supabase!
      .from('Job')
      .select('id, title, description, source, crawledAt')
      .not('description', 'is', null)
      .gte('crawledAt', sevenDaysAgo.toISOString())
      .limit(200)

    expect(error).toBeNull()

    if (!jobs || jobs.length === 0) {
      console.log('  ⏭️  No recent jobs found')
      return
    }

    const invalidJobs = (jobs || []).filter(job => {
      const result = validateCleanedOutput(job.description)
      return !result.valid
    })

    console.log(`  Recent jobs: ${jobs.length} checked, ${invalidJobs.length} invalid`)

    // STRICT: Recent jobs MUST be clean
    expect(invalidJobs.length).toBe(0)
  }, 30000)
})
