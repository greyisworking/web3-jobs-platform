/**
 * Debug script to check job data and sorting
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('\n📊 Top 10 Jobs by postedDate DESC:\n')

  const { data: jobs, error } = await supabase
    .from('Job')
    .select('title, company, postedDate, crawledAt, source')
    .eq('isActive', true)
    .order('postedDate', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  jobs?.forEach((j, i) => {
    const title = j.title ? j.title.slice(0, 35) : 'N/A'
    console.log(`${i + 1}. ${j.postedDate || 'null'} | ${j.company} | ${title}`)
  })

  // Description stats
  const { count: total } = await supabase
    .from('Job')
    .select('id', { count: 'exact', head: true })
    .eq('isActive', true)

  const { count: withDesc } = await supabase
    .from('Job')
    .select('id', { count: 'exact', head: true })
    .eq('isActive', true)
    .not('description', 'is', null)
    .neq('description', '')

  console.log('\n📈 Description Stats:')
  console.log(`Total active: ${total}`)
  console.log(`With description: ${withDesc}`)
  console.log(`Without: ${(total || 0) - (withDesc || 0)}`)
  console.log(`Coverage: ${(((withDesc || 0) / (total || 1)) * 100).toFixed(1)}%`)

  // Check unique postedDate values
  const { data: dates } = await supabase
    .from('Job')
    .select('postedDate')
    .eq('isActive', true)
    .order('postedDate', { ascending: false })
    .limit(100)

  const uniqueDates = new Set(dates?.map(d => d.postedDate?.split('T')[0]))
  console.log(`\n📅 Unique posted dates (in top 100): ${uniqueDates.size}`)
  console.log('Sample dates:', Array.from(uniqueDates).slice(0, 5).join(', '))
}

main().catch(console.error)
