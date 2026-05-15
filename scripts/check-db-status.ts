import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDB() {
  // Total count
  const { count: total } = await supabase.from('Job').select('*', { count: 'exact', head: true })

  // Active count
  const { count: active } = await supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true)

  // Inactive count
  const { count: inactive } = await supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', false)

  console.log('📊 DB Status:')
  console.log('  Total jobs:', total)
  console.log('  Active (isActive=true):', active)
  console.log('  Inactive (isActive=false):', inactive)

  // Get sample of active jobs
  const { data: activeSample } = await supabase
    .from('Job')
    .select('id, title, company, isActive')
    .eq('isActive', true)
    .limit(5)

  console.log('\n✅ Active jobs sample:')
  activeSample?.forEach(j => {
    console.log('  -', j.company, '|', j.title?.substring(0, 40))
  })

  // Get sample of inactive jobs
  const { data: inactiveSample } = await supabase
    .from('Job')
    .select('id, title, company, isActive')
    .eq('isActive', false)
    .limit(5)

  console.log('\n❌ Inactive jobs sample:')
  inactiveSample?.forEach(j => {
    console.log('  -', j.company, '|', j.title?.substring(0, 40))
  })

  // Last crawled job (most recent by crawledAt)
  const { data: lastCrawled } = await supabase
    .from('Job')
    .select('title, company, source, crawledAt, postedDate')
    .order('crawledAt', { ascending: false })
    .limit(3)

  console.log('\n🕐 Last crawled jobs:')
  lastCrawled?.forEach(j => {
    console.log(`  - [${j.source}] ${j.company} | ${j.title?.substring(0, 40)}`)
    console.log(`    crawledAt: ${j.crawledAt} | postedDate: ${j.postedDate}`)
  })

  // Last crawled per source
  const sources = ['web3.career', 'cryptocurrencyjobs', 'remote3', 'cryptojobs', 'remoteok', 'wanted', 'rocketpunch', 'web3kr', 'jobstash']
  console.log('\n📡 Last crawl per source:')
  for (const src of sources) {
    const { data } = await supabase
      .from('Job')
      .select('crawledAt')
      .ilike('source', `%${src}%`)
      .order('crawledAt', { ascending: false })
      .limit(1)
    const lastDate = data?.[0]?.crawledAt ?? 'no data'
    console.log(`  ${src.padEnd(22)} → ${lastDate}`)
  }
}

checkDB()
