/**
 * Migrate ALL Korean content to English (term-based, fast)
 *
 * Translates: title, company, location, salary, tags, description,
 * requirements, responsibilities, benefits
 *
 * Usage:
 *   npx tsx scripts/translate-korean-jobs.ts          # Dry run (preview changes)
 *   npx tsx scripts/translate-korean-jobs.ts --apply  # Apply changes
 *   npx tsx scripts/translate-korean-jobs.ts --stats  # Show stats only
 */

import { createClient } from '@supabase/supabase-js'
import {
  containsKorean,
  translateJobTitle,
  translateCompanyName,
  translateLocation,
  translateSalary,
  translateTags,
  translateFullField,
} from '../lib/translation'
import 'dotenv/config'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface KoreanJob {
  id: string
  title: string
  company: string
  location: string
  salary: string | null
  tags: string | null
  description: string | null
  requirements: string | null
  responsibilities: string | null
  benefits: string | null
}

async function findKoreanJobs(): Promise<KoreanJob[]> {
  console.log('Scanning ALL fields for Korean content...\n')

  // Fetch all active jobs
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, location, salary, tags, description, requirements, responsibilities, benefits')
    .eq('isActive', true)
    .order('crawledAt', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  // Filter for jobs with Korean in any field
  const koreanJobs = (jobs || []).filter(job =>
    containsKorean(job.title) ||
    containsKorean(job.company) ||
    containsKorean(job.location) ||
    containsKorean(job.salary) ||
    containsKorean(job.tags) ||
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
    console.log('No Korean job content found. All done!')
    return
  }

  console.log(`${dryRun ? '[DRY RUN]' : '[APPLYING]'} Translating ${koreanJobs.length} jobs...\n`)
  console.log('─'.repeat(80))

  let successCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const job of koreanJobs) {
    const updates: Record<string, string | null> = {}
    let hasChanges = false

    // Translate title
    if (containsKorean(job.title)) {
      const translated = translateJobTitle(job.title)
      if (translated !== job.title && translated.length > 0) {
        updates.title = translated
        hasChanges = true
      }
    }

    // Translate company name
    if (containsKorean(job.company)) {
      const translated = translateCompanyName(job.company)
      if (translated !== job.company && translated.length > 0) {
        updates.company = translated
        hasChanges = true
      }
    }

    // Translate location
    if (containsKorean(job.location)) {
      const translated = translateLocation(job.location)
      if (translated !== job.location && translated.length > 0) {
        updates.location = translated
        hasChanges = true
      }
    }

    // Translate salary
    if (containsKorean(job.salary)) {
      const translated = translateSalary(job.salary)
      if (translated && translated !== job.salary) {
        updates.salary = translated
        hasChanges = true
      }
    }

    // Translate tags
    if (containsKorean(job.tags)) {
      try {
        const parsedTags = JSON.parse(job.tags!)
        if (Array.isArray(parsedTags)) {
          const translated = translateTags(parsedTags)
          const translatedStr = JSON.stringify(translated)
          if (translatedStr !== job.tags) {
            updates.tags = translatedStr
            hasChanges = true
          }
        }
      } catch {
        // tags might not be valid JSON
      }
    }

    // Translate description
    if (job.description && containsKorean(job.description)) {
      const translated = translateFullField(job.description)
      if (translated && translated !== job.description) {
        updates.description = translated
        hasChanges = true
      }
    }

    // Translate requirements
    if (job.requirements && containsKorean(job.requirements)) {
      const translated = translateFullField(job.requirements)
      if (translated && translated !== job.requirements) {
        updates.requirements = translated
        hasChanges = true
      }
    }

    // Translate responsibilities
    if (job.responsibilities && containsKorean(job.responsibilities)) {
      const translated = translateFullField(job.responsibilities)
      if (translated && translated !== job.responsibilities) {
        updates.responsibilities = translated
        hasChanges = true
      }
    }

    // Translate benefits
    if (job.benefits && containsKorean(job.benefits)) {
      const translated = translateFullField(job.benefits)
      if (translated && translated !== job.benefits) {
        updates.benefits = translated
        hasChanges = true
      }
    }

    if (!hasChanges) {
      skippedCount++
      continue
    }

    console.log(`[${job.company}]`)
    for (const [field, value] of Object.entries(updates)) {
      if (field === 'description' || field === 'requirements' || field === 'responsibilities' || field === 'benefits') {
        console.log(`  ${field}: translated`)
      } else {
        const original = (job as any)[field]
        console.log(`  ${field}: ${original} -> ${value}`)
      }
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
  const { data: jobs } = await supabase
    .from('Job')
    .select('title, company, location, salary, tags, description, requirements, responsibilities, benefits')
    .eq('isActive', true)

  const total = jobs?.length || 0
  const fields = ['title', 'company', 'location', 'salary', 'tags', 'description', 'requirements', 'responsibilities', 'benefits'] as const

  console.log('\nKorean Content Statistics:')
  console.log(`  Total active jobs: ${total}`)
  console.log('')

  for (const field of fields) {
    const count = (jobs || []).filter(j => containsKorean(j[field])).length
    const pct = ((count / (total || 1)) * 100).toFixed(1)
    if (count > 0) {
      console.log(`  ${field.padEnd(20)} ${count} (${pct}%)`)
    }
  }

  const anyKorean = (jobs || []).filter(j =>
    fields.some(f => containsKorean(j[f]))
  ).length
  console.log(`\n  ANY Korean content: ${anyKorean} (${((anyKorean / (total || 1)) * 100).toFixed(1)}%)`)
  console.log(`  100% English:       ${total - anyKorean} (${(((total - anyKorean) / (total || 1)) * 100).toFixed(1)}%)`)
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
