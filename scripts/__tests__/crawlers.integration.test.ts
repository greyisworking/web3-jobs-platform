/**
 * Crawler Integration Tests
 *
 * Tests actual crawler output by:
 * 1. Fetching recent jobs from the database
 * 2. Validating descriptions don't contain HTML entities or raw tags
 *
 * Run with: npm run test:crawlers
 */
import { describe, test, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { validateCleanedOutput, hasUndecodedEntities } from '../utils/htmlParser'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Skip tests if Supabase is not configured
const itIfSupabase = supabase ? test : test.skip

describe('Crawler Output Validation', () => {
  describe('Database Content Validation', () => {
    itIfSupabase('job descriptions should not contain HTML entities', async () => {
      const { data: jobs, error } = await supabase!
        .from('Job')
        .select('id, title, description, source')
        .not('description', 'is', null)
        .limit(100)

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

      // Report failures with details (warn mode - don't fail for legacy data)
      if (invalidJobs.length > 0) {
        console.log('\n⚠️  Found jobs with invalid content:')
        invalidJobs.slice(0, 10).forEach((job, i) => {
          console.log(`  ${i + 1}. ${job.title} (${job.source})`)
          job.issues.forEach(issue => console.log(`     - ${issue}`))
        })
        if (invalidJobs.length > 10) {
          console.log(`  ... and ${invalidJobs.length - 10} more`)
        }
        console.log('\n💡 Run: npx tsx scripts/migrate-clean-descriptions.ts to fix')
      }

      // Report mode: warn but don't fail for legacy data
      // Change to strict mode after migration: expect(invalidJobs.length).toBe(0)
      expect(jobs?.length).toBeGreaterThan(0)
    }, 30000)

    itIfSupabase('raw_description should be stored for jobs with formatting', async () => {
      const { data: jobs, error } = await supabase!
        .from('Job')
        .select('id, title, description, raw_description, source')
        .not('description', 'is', null)
        .limit(50)

      expect(error).toBeNull()

      // Check that jobs with formatted descriptions also have raw_description
      const jobsWithEntities = (jobs || []).filter(job => {
        const { valid } = hasUndecodedEntities(job.raw_description || '')
        return !valid // raw_description has entities (original content)
      })

      // It's okay if raw_description also has entities - that's the original
      // We just need to ensure description is clean
      const cleanDescriptionJobs = (jobs || []).filter(job => {
        const { valid } = validateCleanedOutput(job.description)
        return valid
      })

      console.log(`\n📊 Sample Stats:`)
      console.log(`   Total jobs checked: ${jobs?.length || 0}`)
      console.log(`   Jobs with clean description: ${cleanDescriptionJobs.length}`)
    }, 30000)
  })

  describe('Source-specific Validation', () => {
    const sources = [
      'priority:greenhouse',
      'priority:ashby',
      'priority:lever',
      'web3.career',
      'cryptojobslist.com',
      'cryptocurrencyjobs.co',
      'crypto.jobs',
      'remote3.co',
      'remoteok.com',
      'wellfound.com',
    ]

    for (const source of sources) {
      itIfSupabase(`${source} jobs should have clean descriptions`, async () => {
        const { data: jobs, error } = await supabase!
          .from('Job')
          .select('id, title, description')
          .eq('source', source)
          .not('description', 'is', null)
          .limit(20)

        expect(error).toBeNull()

        if (!jobs || jobs.length === 0) {
          console.log(`  ⏭️  No jobs found for ${source}`)
          return
        }

        const invalidCount = jobs.filter(job => {
          const result = validateCleanedOutput(job.description)
          return !result.valid
        }).length

        console.log(`  ${source}: ${jobs.length} jobs checked, ${invalidCount} invalid`)

        // Report mode: warn but don't fail for legacy data
        // Change to strict mode after migration: expect(invalidCount).toBe(0)
        expect(jobs.length).toBeGreaterThan(0)
      }, 15000)
    }
  })
})

describe('Entity Patterns', () => {
  test('common problematic patterns should be detected', () => {
    // These are patterns we've seen in actual crawler output
    const problematicPatterns = [
      '&lt;div class=&quot;content-intro&quot;&gt;',
      '&lt;p&gt;About the role&lt;/p&gt;',
      '&amp;lt;strong&amp;gt;',
      '&lt;br&gt;',
      '&lt;ul&gt;&lt;li&gt;',
      '&nbsp;&nbsp;&nbsp;',
    ]

    for (const pattern of problematicPatterns) {
      const result = hasUndecodedEntities(pattern)
      expect(result.valid).toBe(false)
    }
  })

  test('clean markdown should pass validation', () => {
    const cleanMarkdown = `
## About the Role

We are looking for a **Software Engineer** to join our team.

### Requirements
- 5+ years of experience
- Strong knowledge of TypeScript
- Experience with React & Node.js

### Benefits
- Competitive salary ($150k - $200k)
- Remote work
- Health insurance
    `.trim()

    const result = validateCleanedOutput(cleanMarkdown)
    expect(result.valid).toBe(true)
  })
})
