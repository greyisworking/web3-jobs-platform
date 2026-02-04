/**
 * Clean existing job descriptions in database (no re-crawling)
 * Uses shared cleanDescriptionText() from lib/clean-description.ts
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { cleanDescriptionText } from '../lib/clean-description'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🧹 Cleaning existing descriptions...\n')

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, description')
    .eq('isActive', true)
    .not('description', 'is', null)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`📦 Found ${jobs?.length || 0} jobs with descriptions\n`)

  let updated = 0
  let unchanged = 0
  let cleared = 0

  for (const job of jobs || []) {
    const cleaned = cleanDescriptionText(job.description)
    if (cleaned !== job.description) {
      if (cleaned.length > 50) {
        const { error: updateError } = await supabase
          .from('Job')
          .update({ description: cleaned })
          .eq('id', job.id)

        if (!updateError) {
          updated++
          if (updated <= 10) {
            const diff = job.description.length - cleaned.length
            console.log(`✅ Cleaned: ${job.title?.substring(0, 40)}... (removed ${diff} chars)`)
          }
        }
      } else {
        // Cleaned to almost nothing — set to null so detail page shows "view original"
        const { error: updateError } = await supabase
          .from('Job')
          .update({ description: null })
          .eq('id', job.id)

        if (!updateError) {
          cleared++
          if (cleared <= 5) {
            console.log(`🗑️ Cleared (all noise): ${job.title?.substring(0, 40)}...`)
          }
        }
      }
    } else {
      unchanged++
    }
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Updated: ${updated}`)
  console.log(`🗑️ Cleared (all noise): ${cleared}`)
  console.log(`⏭️ Unchanged: ${unchanged}`)
  console.log('═'.repeat(50))
}

main().catch(console.error)
