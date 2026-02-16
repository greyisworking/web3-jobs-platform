/**
 * Migration: Clean existing job descriptions
 *
 * Decodes HTML entities and strips HTML tags from all job descriptions.
 * This fixes legacy data that wasn't properly cleaned when saved.
 *
 * Usage:
 *   npx tsx scripts/migrate-clean-descriptions.ts --dry-run  # Preview changes
 *   npx tsx scripts/migrate-clean-descriptions.ts            # Apply changes
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { cleanHtml, hasUndecodedEntities, hasHtmlTags } from './utils/htmlParser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DRY_RUN = process.argv.includes('--dry-run')
const BATCH_SIZE = 50

async function main() {
  console.log('🧹 Migration: Clean Job Descriptions')
  console.log('=' .repeat(50))
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✏️  APPLY CHANGES'}`)
  console.log('')

  // Get all jobs with descriptions
  let offset = 0
  let totalProcessed = 0
  let totalCleaned = 0
  let totalSkipped = 0

  while (true) {
    const { data: jobs, error } = await supabase
      .from('Job')
      .select('id, title, description, source')
      .not('description', 'is', null)
      .range(offset, offset + BATCH_SIZE - 1)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
      break
    }

    if (!jobs || jobs.length === 0) {
      break
    }

    for (const job of jobs) {
      totalProcessed++

      // Check if description needs cleaning
      const entityCheck = hasUndecodedEntities(job.description)
      const tagCheck = hasHtmlTags(job.description)

      if (entityCheck.valid && tagCheck.valid) {
        // Description is already clean
        totalSkipped++
        continue
      }

      // Clean the description
      const cleanedDescription = cleanHtml(job.description)

      // Skip if cleaning results in same content
      if (cleanedDescription === job.description) {
        totalSkipped++
        continue
      }

      // Show what would change
      const issues: string[] = []
      if (!entityCheck.valid) {
        issues.push(`Entities: ${entityCheck.entities.slice(0, 3).join(', ')}`)
      }
      if (!tagCheck.valid) {
        issues.push(`Tags: ${tagCheck.tags.slice(0, 3).join(', ')}`)
      }

      console.log(`\n📝 ${job.title} (${job.source})`)
      console.log(`   Issues: ${issues.join(' | ')}`)
      console.log(`   Before: ${job.description.substring(0, 100)}...`)
      console.log(`   After:  ${cleanedDescription.substring(0, 100)}...`)

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('Job')
          .update({ description: cleanedDescription })
          .eq('id', job.id)

        if (updateError) {
          console.log(`   ❌ Error: ${updateError.message}`)
        } else {
          console.log(`   ✅ Updated`)
          totalCleaned++
        }
      } else {
        console.log(`   ⏭️  Would update (dry run)`)
        totalCleaned++
      }
    }

    offset += BATCH_SIZE
    process.stdout.write(`\rProcessed ${totalProcessed} jobs...`)
  }

  console.log('\n\n' + '=' .repeat(50))
  console.log('📊 Summary')
  console.log(`   Total processed: ${totalProcessed}`)
  console.log(`   Already clean:   ${totalSkipped}`)
  console.log(`   ${DRY_RUN ? 'Would clean' : 'Cleaned'}:   ${totalCleaned}`)

  if (DRY_RUN && totalCleaned > 0) {
    console.log('\n💡 Run without --dry-run to apply changes')
  }
}

main().catch(console.error)
