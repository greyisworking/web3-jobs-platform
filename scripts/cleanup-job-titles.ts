/**
 * One-time script to clean up existing job titles in the database.
 * Applies cleanJobTitle and cleanCompanyName to all active jobs.
 *
 * Usage: npx ts-node scripts/cleanup-job-titles.ts
 */

import { createClient } from '@supabase/supabase-js'
import { cleanJobTitle, cleanCompanyName } from '../lib/clean-job-title'
import { normalizeEmploymentType, detectRegion } from './utils'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupJobTitles() {
  console.log('🧹 Starting job cleanup (title, company, type, region)...')

  // Fetch all active jobs
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, company, type, location, region')
    .eq('isActive', true)

  if (error) {
    console.error('❌ Failed to fetch jobs:', error.message)
    process.exit(1)
  }

  console.log(`📊 Found ${jobs?.length || 0} active jobs to process`)

  let updatedCount = 0
  let skippedCount = 0
  const batchSize = 50

  for (let i = 0; i < (jobs?.length || 0); i += batchSize) {
    const batch = jobs!.slice(i, i + batchSize)
    const updates: { id: string; title: string; company: string; type: string; region: string }[] = []

    for (const job of batch) {
      const cleanedTitle = cleanJobTitle(job.title, job.company)
      const cleanedCompany = cleanCompanyName(job.company)
      const normalizedType = normalizeEmploymentType(job.type, cleanedTitle)
      const detectedRegion = detectRegion(job.location)

      // Only update if something changed
      const titleChanged = cleanedTitle !== job.title
      const companyChanged = cleanedCompany !== job.company
      const typeChanged = normalizedType !== job.type
      const regionChanged = detectedRegion !== job.region

      if (titleChanged || companyChanged || typeChanged || regionChanged) {
        updates.push({
          id: job.id,
          title: cleanedTitle,
          company: cleanedCompany,
          type: normalizedType,
          region: detectedRegion,
        })
      } else {
        skippedCount++
      }
    }

    // Apply updates
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('Job')
        .update({
          title: update.title,
          company: update.company,
          type: update.type,
          region: update.region,
        })
        .eq('id', update.id)

      if (updateError) {
        console.error(`❌ Failed to update job ${update.id}:`, updateError.message)
      } else {
        updatedCount++
        // Log some examples
        if (updatedCount <= 15) {
          const originalJob = batch.find(j => j.id === update.id)
          if (originalJob) {
            const changes: string[] = []
            if (originalJob.title !== update.title) changes.push(`title: "${originalJob.title}" → "${update.title}"`)
            if (originalJob.type !== update.type) changes.push(`type: "${originalJob.type}" → "${update.type}"`)
            if (originalJob.region !== update.region) changes.push(`region: "${originalJob.region}" → "${update.region}"`)
            if (changes.length > 0) {
              console.log(`  📝 ${changes.join(', ')}`)
            }
          }
        }
      }
    }

    // Progress update
    const progress = Math.round(((i + batch.length) / (jobs?.length || 1)) * 100)
    process.stdout.write(`\r🔄 Progress: ${progress}% (${i + batch.length}/${jobs?.length || 0})`)
  }

  console.log(`\n\n✅ Cleanup complete!`)
  console.log(`   Updated: ${updatedCount} jobs`)
  console.log(`   Skipped: ${skippedCount} jobs (already clean)`)
}

cleanupJobTitles().catch(console.error)
