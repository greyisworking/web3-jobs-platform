/**
 * Test AI Summarizer with specific jobs
 *
 * Usage:
 *   npx tsx scripts/test-ai-summarizer.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { summarizeJobDescription, estimateCost, type JobContext } from '../lib/ai-summarizer'
import { createSafeLikePattern } from '../lib/sanitize'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function getJob(companyName: string) {
  const { data } = await supabase
    .from('Job')
    .select('*')
    .ilike('company', createSafeLikePattern(companyName))
    .not('raw_description', 'is', null)
    .limit(1)
    .single()

  return data
}

async function getKoreanJob() {
  const { data } = await supabase
    .from('Job')
    .select('*')
    .eq('source', 'web3kr.jobs')
    .not('raw_description', 'is', null)
    .limit(1)
    .single()

  return data
}

async function testJob(job: any, label: string) {
  console.log('\n' + '='.repeat(80))
  console.log(`🧪 TEST: ${label}`)
  console.log('='.repeat(80))
  console.log(`📌 ${job.title}`)
  console.log(`   ${job.company} | ${job.source}`)
  if (job.backers && job.backers.length > 0) {
    console.log(`   🏦 VC Backers: ${job.backers.join(', ')}`)
  }

  console.log('\n📝 RAW DESCRIPTION (first 800 chars):')
  console.log('─'.repeat(40))
  console.log((job.raw_description || job.description)?.substring(0, 800))
  console.log('...(truncated)')

  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('\n⚠️  ANTHROPIC_API_KEY not set - showing estimate only')
    const estimate = estimateCost(1, job.raw_description?.length || 3000)
    console.log(`   Estimated cost: $${estimate.estimatedCostUsd.toFixed(4)}`)
    return
  }

  console.log('\n🤖 Generating AI summary...')

  const context: JobContext = {
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    backers: job.backers,
    sector: job.sector,
    tags: job.tags,
    source: job.source,
    type: job.type,
    remoteType: job.remoteType,
    experienceLevel: job.experienceLevel,
  }

  const startTime = Date.now()
  const result = await summarizeJobDescription(job.raw_description || job.description, context)
  const elapsed = Date.now() - startTime

  if (result.success) {
    console.log(`\n✨ AI SUMMARY (${elapsed}ms, ${result.tokensUsed} tokens, $${result.costUsd?.toFixed(4)}):`)
    console.log('─'.repeat(40))
    console.log(result.summary)
  } else {
    console.log(`\n❌ Error: ${result.error}`)
  }
}

async function main() {
  console.log('🧪 AI Summarizer Test Suite')
  console.log('Testing with 3 different job types:\n')

  // 1. VC-backed job (Binance or similar)
  let vcJob = await getJob('Binance')
  if (!vcJob) {
    vcJob = await getJob('Fireblocks')
  }
  if (!vcJob) {
    vcJob = await getJob('Alchemy')
  }

  if (vcJob) {
    await testJob(vcJob, 'VC-BACKED JOB')
  } else {
    console.log('⚠️  No VC-backed job found for testing')
  }

  // Small delay between API calls
  await new Promise(r => setTimeout(r, 1000))

  // 2. Regular job (Somnia or similar)
  const regularJob = await getJob('Somnia')
  if (regularJob) {
    await testJob(regularJob, 'REGULAR JOB')
  } else {
    console.log('⚠️  No Somnia job found for testing')
  }

  // Small delay between API calls
  await new Promise(r => setTimeout(r, 1000))

  // 3. Korean job
  const koreanJob = await getKoreanJob()
  if (koreanJob) {
    await testJob(koreanJob, 'KOREAN JOB (web3kr.jobs)')
  } else {
    console.log('⚠️  No Korean job found for testing')
  }

  // Cost estimate for full batch
  console.log('\n' + '='.repeat(80))
  console.log('💰 COST ESTIMATE FOR FULL BATCH')
  console.log('='.repeat(80))

  const fullEstimate = estimateCost(1000, 4000)
  console.log(`For 1000 jobs (avg 4000 chars):`)
  console.log(`  Input tokens: ~${fullEstimate.estimatedInputTokens.toLocaleString()}`)
  console.log(`  Output tokens: ~${fullEstimate.estimatedOutputTokens.toLocaleString()}`)
  console.log(`  Estimated cost: $${fullEstimate.estimatedCostUsd.toFixed(2)} USD`)
}

main().catch(console.error)
