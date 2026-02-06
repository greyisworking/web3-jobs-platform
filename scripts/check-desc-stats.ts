import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('\n📊 Description 통계\n')

  const { count: totalActive } = await supabase
    .from('Job')
    .select('id', { count: 'exact', head: true })
    .eq('isActive', true)

  const { count: withDesc } = await supabase
    .from('Job')
    .select('id', { count: 'exact', head: true })
    .eq('isActive', true)
    .not('description', 'is', null)
    .neq('description', '')

  console.log(`Total active: ${totalActive}`)
  console.log(`With description: ${withDesc} (${((withDesc || 0) / (totalActive || 1) * 100).toFixed(1)}%)`)
  console.log(`Without description: ${(totalActive || 0) - (withDesc || 0)}`)

  console.log('\n📦 Source별 description 보유 현황:\n')

  const { data: allJobs } = await supabase
    .from('Job')
    .select('source, description')
    .eq('isActive', true)
    .limit(3000)

  if (allJobs) {
    const sourceStats = new Map<string, { total: number; withDesc: number }>()
    for (const job of allJobs) {
      const src = job.source || 'unknown'
      if (!sourceStats.has(src)) {
        sourceStats.set(src, { total: 0, withDesc: 0 })
      }
      const stat = sourceStats.get(src)!
      stat.total++
      if (job.description && job.description.length > 10) {
        stat.withDesc++
      }
    }

    const sorted = Array.from(sourceStats.entries()).sort((a, b) => b[1].total - a[1].total)
    for (const [source, stat] of sorted) {
      const pct = ((stat.withDesc / stat.total) * 100).toFixed(0)
      const bar = '█'.repeat(Math.round(stat.withDesc / stat.total * 20)) + '░'.repeat(20 - Math.round(stat.withDesc / stat.total * 20))
      console.log(`  ${source.padEnd(22)} ${String(stat.withDesc).padStart(3)}/${String(stat.total).padStart(3)} ${bar} ${pct}%`)
    }
  }
}

main().catch(console.error)
