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
}

checkDB()
