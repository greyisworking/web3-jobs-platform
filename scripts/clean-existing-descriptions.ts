/**
 * Clean existing job descriptions in database (no re-crawling)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function cleanDescription(text: string): string {
  if (!text) return ''

  const junkPatterns = [
    // Similar/Related jobs sections
    /similar\s*jobs?\s*[:\n]?[\s\S]*?(?=\n\n|\z)/gi,
    /related\s*jobs?\s*[:\n]?[\s\S]*?(?=\n\n|\z)/gi,
    /recommended\s*(?:jobs?|for you)\s*[:\n]?[\s\S]*?(?=\n\n|\z)/gi,
    // Share/social patterns (remoteok, etc.)
    /share\s*this\s*job:?\s*/gi,
    /get\s*a\s*\w+\.?\w*\s*short\s*link/gi,
    /(?:^|\n)\s*\w+\.com\s*(?:\n|$)/gim,
    // "Company is hiring" patterns
    /\w+\s+is\s+hiring\s+a\s*\n/gi,
    /remote\s+\w+\s*\n\s*\n/gi,
    // Navigation elements
    /(?:^|\n)\s*(?:share|tweet|post|email)\s*(?:this)?(?:\s*job)?:?\s*(?:\n|$)/gim,
    // Backslash n (literal)
    /\\n/g,
    // Email pattern cleanup
    /\[email\s*protected\]/gi,
    // Excessive spacing
    /\n{4,}/g,
  ]

  let cleaned = text
  for (const pattern of junkPatterns) {
    cleaned = cleaned.replace(pattern, '\n\n')
  }

  return cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .replace(/[ \t]+/g, ' ')
}

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

  for (const job of jobs || []) {
    const cleaned = cleanDescription(job.description)
    if (cleaned !== job.description && cleaned.length > 50) {
      const { error: updateError } = await supabase
        .from('Job')
        .update({ description: cleaned })
        .eq('id', job.id)

      if (!updateError) {
        updated++
        if (updated <= 5) {
          console.log(`✅ Cleaned: ${job.title?.substring(0, 40)}...`)
        }
      }
    } else {
      unchanged++
    }
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️ Unchanged: ${unchanged}`)
  console.log('═'.repeat(50))
}

main().catch(console.error)
