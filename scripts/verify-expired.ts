import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

async function verifyExpired() {
  // Get sample of inactive jobs
  const { data: inactiveJobs } = await supabase
    .from('Job')
    .select('id, title, company, url, isActive')
    .eq('isActive', false)
    .limit(10)

  console.log('🔍 Verifying inactive jobs URLs...\n')

  for (const job of inactiveJobs || []) {
    try {
      const response = await axios.head(job.url, {
        timeout: 10000,
        headers: { 'User-Agent': USER_AGENT },
        maxRedirects: 5,
        validateStatus: () => true,
      })

      const status = response.status
      const isGone = status === 404 || status === 410

      console.log(`${isGone ? '✅' : '⚠️'} [${status}] ${job.company} | ${job.title?.substring(0, 30)}`)
      console.log(`   ${job.url.substring(0, 60)}...`)
    } catch (error: any) {
      console.log(`❌ [ERR] ${job.company} | ${job.title?.substring(0, 30)}`)
      console.log(`   Error: ${error.message}`)
    }
  }

  console.log('\n---\n')

  // Also verify a few active jobs
  const { data: activeJobs } = await supabase
    .from('Job')
    .select('id, title, company, url, isActive')
    .eq('isActive', true)
    .limit(5)

  console.log('🔍 Verifying active jobs URLs...\n')

  for (const job of activeJobs || []) {
    try {
      const response = await axios.head(job.url, {
        timeout: 10000,
        headers: { 'User-Agent': USER_AGENT },
        maxRedirects: 5,
        validateStatus: () => true,
      })

      const status = response.status
      const isOk = status >= 200 && status < 400

      console.log(`${isOk ? '✅' : '⚠️'} [${status}] ${job.company} | ${job.title?.substring(0, 30)}`)
      console.log(`   ${job.url.substring(0, 60)}...`)
    } catch (error: any) {
      console.log(`❌ [ERR] ${job.company} | ${job.title?.substring(0, 30)}`)
      console.log(`   Error: ${error.message}`)
    }
  }
}

verifyExpired()
