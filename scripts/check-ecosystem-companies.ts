import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get top companies from jobs.solana.com
  const { data: solanaJobs } = await supabase
    .from('Job')
    .select('company, url')
    .eq('isActive', true)
    .eq('source', 'jobs.solana.com')
    .limit(500)

  if (solanaJobs) {
    const companyCount = new Map<string, { count: number; sampleUrl: string }>()
    for (const job of solanaJobs) {
      const company = job.company
      if (!companyCount.has(company)) {
        companyCount.set(company, { count: 0, sampleUrl: job.url })
      }
      companyCount.get(company)!.count++
    }

    const sorted = Array.from(companyCount.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)

    console.log('🌐 jobs.solana.com Top Companies:\n')
    for (const [company, info] of sorted) {
      console.log(`  ${company.padEnd(35)} ${String(info.count).padStart(3)} jobs`)
    }
  }

  // Get top companies from jobs.arbitrum.io
  const { data: arbJobs } = await supabase
    .from('Job')
    .select('company, url')
    .eq('isActive', true)
    .eq('source', 'jobs.arbitrum.io')
    .limit(200)

  if (arbJobs) {
    console.log('\n🔵 jobs.arbitrum.io Top Companies:\n')
    const companyCount = new Map<string, { count: number; sampleUrl: string }>()
    for (const job of arbJobs) {
      const company = job.company
      if (!companyCount.has(company)) {
        companyCount.set(company, { count: 0, sampleUrl: job.url })
      }
      companyCount.get(company)!.count++
    }

    const sorted = Array.from(companyCount.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)

    for (const [company, info] of sorted) {
      console.log(`  ${company.padEnd(35)} ${String(info.count).padStart(3)} jobs`)
    }
  }
}

main().catch(console.error)
