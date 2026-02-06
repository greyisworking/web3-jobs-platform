import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { fetchFallbackDescription } from './utils/fallback-description'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Skip these domains - they don't work well with scraping
const SKIP_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'wellfound.com',
  'angel.co',
  'notion.site',
  'notion.so',
]

function shouldSkipUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return SKIP_DOMAINS.some(domain => hostname.includes(domain))
  } catch {
    return true
  }
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get sources to process
  const sources = process.argv[2]?.split(',') || [
    'jobs.solana.com',
    'jobs.arbitrum.io',
    'jobs.avax.network',
    'jobs.sui.io',
  ]

  const maxPerSource = parseInt(process.argv[3] || '50', 10)

  console.log('📄 Fetching fallback descriptions for missing jobs\n')
  console.log(`Sources: ${sources.join(', ')}`)
  console.log(`Max per source: ${maxPerSource}\n`)

  let totalUpdated = 0
  let totalFailed = 0
  let totalSkipped = 0

  for (const source of sources) {
    console.log(`\n🔍 Processing ${source}...`)

    // Get jobs without description
    const { data: jobs, error } = await supabase
      .from('Job')
      .select('id, url, title, company')
      .eq('isActive', true)
      .eq('source', source)
      .or('description.is.null,description.eq.')
      .limit(maxPerSource * 2)  // Get more to account for skipped

    if (error) {
      console.error(`  ❌ Error fetching jobs: ${error.message}`)
      continue
    }

    if (!jobs || jobs.length === 0) {
      console.log('  No jobs without description found')
      continue
    }

    console.log(`  Found ${jobs.length} jobs without description`)

    let sourceUpdated = 0
    let sourceFailed = 0
    let sourceSkipped = 0

    for (const job of jobs) {
      if (sourceUpdated >= maxPerSource) break

      if (shouldSkipUrl(job.url)) {
        sourceSkipped++
        continue
      }

      try {
        const result = await fetchFallbackDescription(job.url)

        if (result.description && result.description.length > 50) {
          // Update the job
          const { error: updateError } = await supabase
            .from('Job')
            .update({ description: result.description })
            .eq('id', job.id)

          if (updateError) {
            console.log(`  ❌ Failed to update "${job.title}" - ${updateError.message}`)
            sourceFailed++
          } else {
            console.log(`  ✅ ${job.company}: "${job.title.substring(0, 40)}..." (${result.source}, ${result.description.length} chars)`)
            sourceUpdated++
          }
        } else {
          sourceFailed++
        }

        // Rate limiting - 500ms delay
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error: any) {
        console.log(`  ❌ Error: ${job.title} - ${error.message}`)
        sourceFailed++
      }
    }

    console.log(`  📊 ${source}: ${sourceUpdated} updated, ${sourceFailed} failed, ${sourceSkipped} skipped`)
    totalUpdated += sourceUpdated
    totalFailed += sourceFailed
    totalSkipped += sourceSkipped
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`  ✅ Updated: ${totalUpdated}`)
  console.log(`  ❌ Failed: ${totalFailed}`)
  console.log(`  ⏭️  Skipped: ${totalSkipped}`)
}

main().catch(console.error)
