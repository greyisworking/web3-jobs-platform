/**
 * Test Script: Description Formatter
 *
 * Tests the description formatter with jobs from different sources.
 *
 * Usage:
 *   npx tsx scripts/test-formatter.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { formatJobDescription } from '../lib/description-formatter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function getTestJobs() {
  // Get jobs from different sources for testing
  const testQueries = [
    // Binance job (specific)
    supabase
      .from('Job')
      .select('id, title, company, source, description')
      .ilike('title', '%Financial Shared Services Lead%')
      .single(),

    // web3.career job
    supabase
      .from('Job')
      .select('id, title, company, source, description')
      .eq('source', 'web3.career')
      .not('description', 'is', null)
      .limit(1)
      .single(),

    // cryptojobslist job
    supabase
      .from('Job')
      .select('id, title, company, source, description')
      .eq('source', 'cryptojobslist.com')
      .not('description', 'is', null)
      .limit(1)
      .single(),

    // Greenhouse job
    supabase
      .from('Job')
      .select('id, title, company, source, description')
      .eq('source', 'priority:greenhouse')
      .not('description', 'is', null)
      .limit(1)
      .single(),

    // Lever job
    supabase
      .from('Job')
      .select('id, title, company, source, description')
      .eq('source', 'priority:lever')
      .not('description', 'is', null)
      .limit(1)
      .single(),

    // Ashby job
    supabase
      .from('Job')
      .select('id, title, company, source, description')
      .eq('source', 'priority:ashby')
      .not('description', 'is', null)
      .limit(1)
      .single(),
  ]

  const results = await Promise.all(testQueries)
  return results.map(r => r.data).filter(Boolean)
}

function displayComparison(job: any) {
  console.log('\n' + '='.repeat(80))
  console.log(`📌 ${job.title}`)
  console.log(`   ${job.company} | ${job.source}`)
  console.log('='.repeat(80))

  if (!job.description) {
    console.log('❌ No description available')
    return
  }

  // Format the description
  const result = formatJobDescription(job.description)

  // Stats
  console.log('\n📊 Stats:')
  console.log(`   Original length: ${job.description.length} chars`)
  console.log(`   Formatted length: ${result.formatted.length} chars`)
  console.log(`   Word count: ${result.metadata.wordCount}`)
  console.log(`   Reading time: ~${result.metadata.estimatedReadingTime} min`)
  console.log(`   Has structured sections: ${result.metadata.hasStructuredSections ? 'Yes' : 'No'}`)

  if (result.sections.techStack && result.sections.techStack.length > 0) {
    console.log(`   Tech stack detected: ${result.sections.techStack.slice(0, 5).join(', ')}${result.sections.techStack.length > 5 ? '...' : ''}`)
  }

  // Before (first 500 chars)
  console.log('\n📝 BEFORE (raw, first 500 chars):')
  console.log('─'.repeat(40))
  console.log(job.description.substring(0, 500))
  if (job.description.length > 500) console.log('...(truncated)')

  // After (first 800 chars)
  console.log('\n✨ AFTER (formatted, first 800 chars):')
  console.log('─'.repeat(40))
  console.log(result.formatted.substring(0, 800))
  if (result.formatted.length > 800) console.log('...(truncated)')
}

async function main() {
  console.log('🧪 Description Formatter Test')
  console.log('Testing with jobs from different sources...\n')

  const jobs = await getTestJobs()

  if (jobs.length === 0) {
    console.log('❌ No test jobs found')
    return
  }

  console.log(`Found ${jobs.length} test jobs`)

  for (const job of jobs) {
    displayComparison(job)
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Test complete!')
}

main().catch(console.error)
