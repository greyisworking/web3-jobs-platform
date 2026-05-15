import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const INTERVAL_MS = 15_000 // 15초마다 체크
const EXPECTED_TABLES = ['Job', 'JobReport', 'bookmarks']

async function check(): Promise<boolean> {
  const results: string[] = []

  for (const table of EXPECTED_TABLES) {
    // Use select with limit 1 — returns PGRST205 if table truly missing
    const { data, error } = await sb
      .from(table)
      .select('*')
      .limit(1)

    if (error) {
      results.push(`  ❌ ${table}: ${error.code} - ${error.message}`)
    } else {
      // Table exists — now get count
      const { count } = await sb.from(table).select('*', { count: 'exact', head: true })
      results.push(`  ✅ ${table}: ${count ?? 0} rows`)
    }
  }

  const now = new Date().toLocaleTimeString('ko-KR')
  const allOk = results.every((r) => r.includes('✅'))

  console.log(`\n[${now}] DB Restore Check:`)
  results.forEach((r) => console.log(r))

  if (allOk) {
    console.log('\n🎉 All tables restored! Ready to go.')

    // Bonus: show last crawled job
    const { data } = await sb
      .from('Job')
      .select('title, company, source, crawledAt')
      .order('crawledAt', { ascending: false })
      .limit(1)

    if (data?.[0]) {
      console.log(`\n📋 Last job: [${data[0].source}] ${data[0].company} - ${data[0].title}`)
      console.log(`   crawledAt: ${data[0].crawledAt}`)
    }
  }

  return allOk
}

async function poll() {
  console.log('🔄 Polling for DB restore... (Ctrl+C to stop)')
  console.log(`   Checking every ${INTERVAL_MS / 1000}s for tables: ${EXPECTED_TABLES.join(', ')}`)

  const done = await check()
  if (done) return

  const timer = setInterval(async () => {
    const done = await check()
    if (done) {
      clearInterval(timer)
      process.exit(0)
    }
  }, INTERVAL_MS)
}

poll()
