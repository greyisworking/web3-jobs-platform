/**
 * Fix Job Descriptions - Retroactive HTML cleanup
 *
 * This script cleans up HTML artifacts from existing job descriptions.
 * Run with: npx tsx scripts/fix-job-descriptions.ts
 * Dry run: npx tsx scripts/fix-job-descriptions.ts --dry-run
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const isDryRun = process.argv.includes('--dry-run')

/**
 * Clean HTML artifacts from text
 */
function cleanHtmlArtifacts(text: string | null): string | null {
  if (!text) return text

  let cleaned = text

  // 1. Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&hellip;/gi, '...')
    .replace(/&bull;/gi, '•')
    .replace(/&#8211;/gi, '–')
    .replace(/&#8212;/gi, '—')
    .replace(/&#8216;/gi, "'")
    .replace(/&#8217;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/&#\d+;/g, '')

  // 2. Convert HTML tags to markdown/text
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    .replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**')
    .replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?(?:ul|ol|div|span|a|u|table|tr|td|th)[^>]*>/gi, '')

  // 3. Clean up bullet points
  cleaned = cleaned
    .replace(/^[●•◦‣⁃]\s*/gm, '- ')
    .replace(/\n[●•◦‣⁃]\s*/g, '\n- ')

  // 4. Normalize whitespace
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim()

  return cleaned
}

/**
 * Check if text has HTML artifacts that need cleaning
 */
function hasHtmlArtifacts(text: string | null): boolean {
  if (!text) return false

  const patterns = [
    /&nbsp;/i,
    /&amp;/i,
    /&lt;/i,
    /&gt;/i,
    /&quot;/i,
    /&#\d+;/,
    /<br\s*\/?>/i,
    /<\/?p[^>]*>/i,
    /<\/?div[^>]*>/i,
    /<\/?span[^>]*>/i,
    /<\/?strong[^>]*>/i,
    /<\/?b>/i,
    /<\/?em>/i,
    /<\/?i>/i,
    /<\/?li>/i,
    /<\/?ul>/i,
    /<\/?ol>/i,
  ]

  return patterns.some(pattern => pattern.test(text))
}

async function main() {
  console.log('🔧 Job Description Cleanup Script')
  console.log('='.repeat(50))

  if (isDryRun) {
    console.log('🏃 DRY RUN MODE - No changes will be made\n')
  }

  // Fetch all jobs
  console.log('📥 Fetching jobs...')
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, description, raw_description')
    .eq('isActive', true)

  if (error) {
    console.error('❌ Error fetching jobs:', error)
    process.exit(1)
  }

  console.log(`📊 Found ${jobs?.length || 0} active jobs\n`)

  let needsFixCount = 0
  let fixedCount = 0
  const jobsToFix: { id: string; title: string; company: string }[] = []

  for (const job of jobs || []) {
    const descNeedsFix = hasHtmlArtifacts(job.description)
    const rawNeedsFix = hasHtmlArtifacts(job.raw_description)

    if (descNeedsFix || rawNeedsFix) {
      needsFixCount++
      jobsToFix.push({ id: job.id, title: job.title, company: job.company })

      if (!isDryRun) {
        const updates: Record<string, string | null> = {}

        if (descNeedsFix && job.description) {
          updates.description = cleanHtmlArtifacts(job.description)
        }
        if (rawNeedsFix && job.raw_description) {
          updates.raw_description = cleanHtmlArtifacts(job.raw_description)
        }

        const { error: updateError } = await supabase
          .from('Job')
          .update(updates)
          .eq('id', job.id)

        if (updateError) {
          console.error(`❌ Failed to update ${job.company} - ${job.title}:`, updateError.message)
        } else {
          fixedCount++
          console.log(`✅ Fixed: ${job.company} - ${job.title}`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary')
  console.log(`   Total jobs scanned: ${jobs?.length || 0}`)
  console.log(`   Jobs needing fix: ${needsFixCount}`)

  if (isDryRun) {
    console.log('\n📋 Jobs that need fixing:')
    for (const job of jobsToFix.slice(0, 20)) {
      console.log(`   - ${job.company}: ${job.title}`)
    }
    if (jobsToFix.length > 20) {
      console.log(`   ... and ${jobsToFix.length - 20} more`)
    }
    console.log('\n💡 Run without --dry-run to apply fixes')
  } else {
    console.log(`   Jobs fixed: ${fixedCount}`)
  }
}

main().catch(console.error)
