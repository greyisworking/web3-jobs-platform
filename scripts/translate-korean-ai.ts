/**
 * AI-powered Korean to English translation for job postings
 * Uses Claude API for high-quality translation of ALL fields
 * Ensures 100% English output for NEUN platform
 *
 * Usage:
 *   npx tsx scripts/translate-korean-ai.ts          # Dry run
 *   npx tsx scripts/translate-korean-ai.ts --apply  # Apply changes
 *   npx tsx scripts/translate-korean-ai.ts --stats  # Show stats only
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { containsKorean, translateCompanyName, translateLocation, translateSalary, translateTags } from '../lib/translation'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

async function translateText(text: string, field: string = 'general'): Promise<string> {
  if (!containsKorean(text)) return text

  const fieldContext = field === 'title'
    ? 'This is a job title. Translate to a concise professional English job title.'
    : field === 'company'
    ? 'This is a company name. Provide the official English name if known, or romanize it.'
    : 'This is from a job posting.'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Translate this Korean job posting text to professional English. ${fieldContext} Keep technical terms and proper nouns as-is. Output ONLY the translated text, no explanations.

Text to translate:
${text}`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type === 'text') {
    return content.text.trim()
  }
  return text
}

async function findKoreanJobs(): Promise<KoreanJob[]> {
  console.log('Scanning ALL fields for Korean content...\n')

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, location, salary, tags, description, requirements, responsibilities, benefits')
    .eq('isActive', true)
    .order('crawledAt', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  // Filter for jobs with Korean in ANY field
  const koreanJobs = (jobs || []).filter(
    (job) =>
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

  // Show breakdown
  const breakdown = {
    title: (jobs || []).filter(j => containsKorean(j.title)).length,
    company: (jobs || []).filter(j => containsKorean(j.company)).length,
    location: (jobs || []).filter(j => containsKorean(j.location)).length,
    salary: (jobs || []).filter(j => containsKorean(j.salary)).length,
    tags: (jobs || []).filter(j => containsKorean(j.tags)).length,
    description: (jobs || []).filter(j => containsKorean(j.description)).length,
    requirements: (jobs || []).filter(j => containsKorean(j.requirements)).length,
    responsibilities: (jobs || []).filter(j => containsKorean(j.responsibilities)).length,
    benefits: (jobs || []).filter(j => containsKorean(j.benefits)).length,
  }
  console.log('Breakdown by field:')
  for (const [field, count] of Object.entries(breakdown)) {
    if (count > 0) console.log(`  ${field}: ${count}`)
  }
  console.log('')

  return koreanJobs
}

async function translateJobs(dryRun: boolean): Promise<void> {
  const koreanJobs = await findKoreanJobs()

  if (koreanJobs.length === 0) {
    console.log('No Korean jobs found. All done!')
    return
  }

  console.log(`${dryRun ? '[DRY RUN]' : '[APPLYING]'} Translating ${koreanJobs.length} jobs...\n`)
  console.log('─'.repeat(80))

  let successCount = 0
  let errorCount = 0

  for (const job of koreanJobs) {
    console.log(`\n[${job.company}] ${job.title.slice(0, 50)}...`)

    try {
      const updates: Record<string, string | null> = {}

      // Translate title (AI for quality)
      if (containsKorean(job.title)) {
        const translatedTitle = await translateText(job.title, 'title')
        console.log(`  Title: ${job.title} -> ${translatedTitle}`)
        updates.title = translatedTitle
      }

      // Translate company (dictionary first, then AI fallback)
      if (containsKorean(job.company)) {
        let translatedCompany = translateCompanyName(job.company)
        // If still contains Korean after dictionary, use AI
        if (containsKorean(translatedCompany)) {
          translatedCompany = await translateText(job.company, 'company')
        }
        console.log(`  Company: ${job.company} -> ${translatedCompany}`)
        updates.company = translatedCompany
      }

      // Translate location (dictionary-based, fast)
      if (containsKorean(job.location)) {
        const translatedLoc = translateLocation(job.location)
        console.log(`  Location: ${job.location} -> ${translatedLoc}`)
        updates.location = translatedLoc
      }

      // Translate salary (dictionary-based, fast)
      if (containsKorean(job.salary)) {
        const translatedSal = translateSalary(job.salary)
        console.log(`  Salary: ${job.salary} -> ${translatedSal}`)
        updates.salary = translatedSal
      }

      // Translate tags (dictionary-based, fast)
      if (containsKorean(job.tags)) {
        try {
          const parsedTags = JSON.parse(job.tags!)
          if (Array.isArray(parsedTags)) {
            const translatedT = translateTags(parsedTags)
            console.log(`  Tags: translated`)
            updates.tags = JSON.stringify(translatedT)
          }
        } catch {
          // tags might not be valid JSON
        }
      }

      // Translate description (AI for quality)
      if (containsKorean(job.description)) {
        const translatedDesc = await translateText(job.description!)
        console.log(`  Description: translated (${job.description!.length} -> ${translatedDesc.length} chars)`)
        updates.description = translatedDesc
      }

      // Translate requirements
      if (containsKorean(job.requirements)) {
        const translated = await translateText(job.requirements!)
        console.log(`  Requirements: translated`)
        updates.requirements = translated
      }

      // Translate responsibilities
      if (containsKorean(job.responsibilities)) {
        const translated = await translateText(job.responsibilities!)
        console.log(`  Responsibilities: translated`)
        updates.responsibilities = translated
      }

      // Translate benefits
      if (containsKorean(job.benefits)) {
        const translated = await translateText(job.benefits!)
        console.log(`  Benefits: translated`)
        updates.benefits = translated
      }

      if (Object.keys(updates).length > 0 && !dryRun) {
        const { error } = await supabase.from('Job').update(updates).eq('id', job.id)

        if (error) {
          console.error(`  Error updating: ${error.message}`)
          errorCount++
        } else {
          successCount++
        }
      } else if (Object.keys(updates).length > 0) {
        successCount++
      }

      // Rate limit: wait 500ms between jobs
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Error: ${message}`)
      errorCount++
    }
  }

  console.log('\n' + '─'.repeat(80))
  console.log(`\nSummary:`)
  console.log(`  Translated: ${successCount}`)
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
    console.log(`  ${field.padEnd(20)} ${count} (${pct}%)`)
  }

  const anyKorean = (jobs || []).filter(j =>
    fields.some(f => containsKorean(j[f]))
  ).length
  console.log(`\n  ANY Korean content: ${anyKorean} (${((anyKorean / (total || 1)) * 100).toFixed(1)}%)`)
}

async function main() {
  const args = process.argv.slice(2)
  const applyChanges = args.includes('--apply')
  const statsOnly = args.includes('--stats')

  if (!statsOnly && !process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is required for translation')
    process.exit(1)
  }

  console.log('AI Translation (Korean -> English) - NEUN Full English\n')

  if (statsOnly) {
    await showStats()
  } else {
    await translateJobs(!applyChanges)
    await showStats()
  }
}

main().catch(console.error)
