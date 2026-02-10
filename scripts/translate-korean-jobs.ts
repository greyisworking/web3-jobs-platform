/**
 * Migrate Korean job titles to English
 *
 * This script finds all jobs with Korean characters in the title
 * and translates them to English using the term-based translation system.
 *
 * Usage:
 *   npx tsx scripts/translate-korean-jobs.ts          # Dry run (preview changes)
 *   npx tsx scripts/translate-korean-jobs.ts --apply  # Apply changes
 */

import { createClient } from '@supabase/supabase-js'
import { containsKorean, translateJobTitle, quickTranslateTerms } from '../lib/translation'
import 'dotenv/config'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface KoreanJob {
  id: string
  title: string
  company: string
  description: string | null
  requirements: string | null
  responsibilities: string | null
  benefits: string | null
}

async function findKoreanJobs(): Promise<KoreanJob[]> {
  console.log('Scanning for Korean job content...\n')

  // Fetch all active jobs
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, description, requirements, responsibilities, benefits')
    .eq('isActive', true)
    .order('crawledAt', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  // Filter for jobs with Korean in any field
  const koreanJobs = (jobs || []).filter(job =>
    containsKorean(job.title) ||
    containsKorean(job.description) ||
    containsKorean(job.requirements) ||
    containsKorean(job.responsibilities) ||
    containsKorean(job.benefits)
  )

  console.log(`Found ${koreanJobs.length} jobs with Korean content out of ${jobs?.length || 0} total\n`)

  return koreanJobs
}

async function translateJobs(dryRun: boolean): Promise<void> {
  const koreanJobs = await findKoreanJobs()

  if (koreanJobs.length === 0) {
    console.log('No Korean job titles found. All done!')
    return
  }

  console.log(`${dryRun ? '[DRY RUN]' : '[APPLYING]'} Translating ${koreanJobs.length} job titles...\n`)
  console.log('─'.repeat(80))

  let successCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const job of koreanJobs) {
    const updates: Record<string, string> = {}
    let hasChanges = false

    // Translate title
    if (containsKorean(job.title)) {
      const translatedTitle = translateJobTitle(job.title)
      if (translatedTitle !== job.title && translatedTitle.length > 0) {
        updates.title = translatedTitle
        hasChanges = true
      }
    }

    // Translate description
    if (job.description && containsKorean(job.description)) {
      const translated = quickTranslateTerms(job.description)
        .replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
      updates.description = translated
      hasChanges = true
    }

    // Translate requirements
    if (job.requirements && containsKorean(job.requirements)) {
      const translated = quickTranslateTerms(job.requirements)
        .replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
      updates.requirements = translated
      hasChanges = true
    }

    // Translate responsibilities
    if (job.responsibilities && containsKorean(job.responsibilities)) {
      const translated = quickTranslateTerms(job.responsibilities)
        .replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
      updates.responsibilities = translated
      hasChanges = true
    }

    // Translate benefits
    if (job.benefits && containsKorean(job.benefits)) {
      const translated = quickTranslateTerms(job.benefits)
        .replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
      updates.benefits = translated
      hasChanges = true
    }

    if (!hasChanges) {
      skippedCount++
      continue
    }

    console.log(`[${job.company}]`)
    if (updates.title) {
      console.log(`  Title: ${job.title} → ${updates.title}`)
    }
    if (updates.description) {
      console.log(`  Description: translated`)
    }
    console.log('')

    if (!dryRun) {
      const { error } = await supabase
        .from('Job')
        .update(updates)
        .eq('id', job.id)

      if (error) {
        console.error(`  Error updating job ${job.id}:`, error.message)
        errorCount++
      } else {
        successCount++
      }
    } else {
      successCount++
    }
  }

  console.log('─'.repeat(80))
  console.log(`\nSummary:`)
  console.log(`  Translated: ${successCount}`)
  console.log(`  Skipped (no change): ${skippedCount}`)
  console.log(`  Errors: ${errorCount}`)

  if (dryRun) {
    console.log('\n[DRY RUN] No changes applied. Run with --apply to update database.')
  }
}

async function showStats(): Promise<void> {
  const { data: total, count: totalCount } = await supabase
    .from('Job')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)

  const { data: jobs } = await supabase
    .from('Job')
    .select('title')
    .eq('isActive', true)

  const koreanCount = (jobs || []).filter(j => containsKorean(j.title)).length

  console.log('\nJob Language Statistics:')
  console.log(`  Total active jobs: ${totalCount}`)
  console.log(`  Korean titles: ${koreanCount} (${((koreanCount / (totalCount || 1)) * 100).toFixed(1)}%)`)
  console.log(`  English/Other: ${(totalCount || 0) - koreanCount}`)
}

async function main() {
  const args = process.argv.slice(2)
  const applyChanges = args.includes('--apply')
  const statsOnly = args.includes('--stats')

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log(`Connected to Supabase: ${supabaseUrl}\n`)

  if (statsOnly) {
    await showStats()
  } else {
    await translateJobs(!applyChanges)
    await showStats()
  }
}

main().catch(console.error)
