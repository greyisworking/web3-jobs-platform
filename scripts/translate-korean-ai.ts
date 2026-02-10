/**
 * AI-powered Korean to English translation for job postings
 * Uses Claude API for high-quality translation
 *
 * Usage:
 *   npx tsx scripts/translate-korean-ai.ts          # Dry run
 *   npx tsx scripts/translate-korean-ai.ts --apply  # Apply changes
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Check if text contains Korean
function containsKorean(text: string | null | undefined): boolean {
  if (!text) return false
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text)
}

interface KoreanJob {
  id: string
  title: string
  company: string
  description: string | null
  requirements: string | null
  responsibilities: string | null
  benefits: string | null
}

async function translateText(text: string): Promise<string> {
  if (!containsKorean(text)) return text

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Translate this Korean job posting text to professional English. Keep technical terms, company names, and proper nouns as-is. Output ONLY the translated text, no explanations.

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
  console.log('Scanning for Korean job postings...\n')

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
  const koreanJobs = (jobs || []).filter(
    (job) =>
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
      const updates: Record<string, string> = {}

      // Translate title
      if (containsKorean(job.title)) {
        const translatedTitle = await translateText(job.title)
        console.log(`  Title: ${job.title} → ${translatedTitle}`)
        updates.title = translatedTitle
      }

      // Translate description
      if (containsKorean(job.description)) {
        const translatedDesc = await translateText(job.description!)
        console.log(`  Description: translated (${job.description!.length} → ${translatedDesc.length} chars)`)
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
    } catch (err: any) {
      console.error(`  Error: ${err.message}`)
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

async function main() {
  const args = process.argv.slice(2)
  const applyChanges = args.includes('--apply')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is required for translation')
    process.exit(1)
  }

  console.log('🌐 AI Translation (Korean → English)\n')
  await translateJobs(!applyChanges)
}

main().catch(console.error)
