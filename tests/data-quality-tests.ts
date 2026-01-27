/**
 * Data Quality Tests — analyze API response data quality.
 * Run with: npx tsx tests/data-quality-tests.ts
 * Requires dev server running on port 3006.
 */

import {
  test,
  assert,
  setCategory,
  printSummary,
  getResults,
  generateReport,
} from './harness'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3006'

const KNOWN_BADGES = ['Verified', 'Web3 Perks', 'Pre-IPO', 'Remote', 'Active', 'English']

interface Job {
  id: string
  title: string | null
  company: string | null
  url: string | null
  location: string | null
  type: string | null
  source: string | null
  region: string | null
  badges: string[] | null
  backers: string[] | null
}

let jobs: Job[] = []
let stats: { total: number; global: number; korea: number; sources: { source: string; _count: number }[] }

async function fetchData() {
  const res = await fetch(`${BASE_URL}/api/jobs`)
  const data = await res.json()
  jobs = data.jobs ?? []
  stats = data.stats
}

async function run() {
  console.log('\n📊 Data Quality Tests\n')

  setCategory('Data Quality')

  try {
    await fetchData()
  } catch (err) {
    console.error('Failed to fetch data from API. Is the dev server running?', err)
    process.exit(1)
  }

  console.log(`  Fetched ${jobs.length} jobs for analysis\n`)

  await test('No null/empty titles', () => {
    const bad = jobs.filter((j) => !j.title || j.title.trim() === '')
    assert(bad.length === 0, `Found ${bad.length} jobs with null/empty title`)
  })

  await test('No null/empty companies', () => {
    const bad = jobs.filter((j) => !j.company || j.company.trim() === '')
    assert(bad.length === 0, `Found ${bad.length} jobs with null/empty company`)
  })

  await test('All URLs valid (start with http)', () => {
    const bad = jobs.filter((j) => !j.url || !j.url.startsWith('http'))
    assert(bad.length === 0, `Found ${bad.length} jobs with invalid URL`)
  })

  await test('No duplicate URLs', () => {
    const urls = jobs.map((j) => j.url).filter(Boolean)
    const unique = new Set(urls)
    const dupes = urls.length - unique.size
    assert(dupes === 0, `Found ${dupes} duplicate URLs`)
  })

  await test('All regions are "Global" or "Korea"', () => {
    const validRegions = ['Global', 'Korea']
    const bad = jobs.filter((j) => j.region && !validRegions.includes(j.region))
    assert(bad.length === 0, `Found ${bad.length} jobs with invalid region: ${bad.map((j) => j.region).join(', ')}`)
  })

  await test('No empty type fields', () => {
    const bad = jobs.filter((j) => !j.type || j.type.trim() === '')
    assert(bad.length === 0, `Found ${bad.length} jobs with empty type`)
  })

  await test('No empty source fields', () => {
    const bad = jobs.filter((j) => !j.source || j.source.trim() === '')
    assert(bad.length === 0, `Found ${bad.length} jobs with empty source`)
  })

  await test('All badge values are from known set', () => {
    const unknownBadges = new Set<string>()
    for (const job of jobs) {
      if (job.badges) {
        for (const b of job.badges) {
          if (!KNOWN_BADGES.includes(b)) {
            unknownBadges.add(b)
          }
        }
      }
    }
    assert(
      unknownBadges.size === 0,
      `Unknown badges found: ${Array.from(unknownBadges).join(', ')}`
    )
  })

  // ────────────────── Distribution Reports ──────────────────
  setCategory('Data Distribution')

  await test('Source distribution report', () => {
    const dist = new Map<string, number>()
    for (const j of jobs) {
      const s = j.source ?? 'unknown'
      dist.set(s, (dist.get(s) ?? 0) + 1)
    }
    console.log('\n    Source Distribution:')
    const sorted = [...dist.entries()].sort((a, b) => b[1] - a[1])
    for (const [source, count] of sorted) {
      console.log(`      ${source}: ${count}`)
    }
    assert(true) // Report only — always passes
  })

  await test('Region distribution report', () => {
    const dist = new Map<string, number>()
    for (const j of jobs) {
      const r = j.region ?? 'unknown'
      dist.set(r, (dist.get(r) ?? 0) + 1)
    }
    console.log('\n    Region Distribution:')
    for (const [region, count] of [...dist.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`      ${region}: ${count}`)
    }
    assert(true)
  })

  await test('Badge distribution report', () => {
    const dist = new Map<string, number>()
    for (const j of jobs) {
      if (j.badges) {
        for (const b of j.badges) {
          dist.set(b, (dist.get(b) ?? 0) + 1)
        }
      }
    }
    console.log('\n    Badge Distribution:')
    for (const [badge, count] of [...dist.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`      ${badge}: ${count}`)
    }
    assert(true)
  })

  await test('Job type distribution report', () => {
    const dist = new Map<string, number>()
    for (const j of jobs) {
      const t = j.type ?? 'unknown'
      dist.set(t, (dist.get(t) ?? 0) + 1)
    }
    console.log('\n    Job Type Distribution:')
    for (const [type, count] of [...dist.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`      ${type}: ${count}`)
    }
    assert(true)
  })

  await test('Count priority-company jobs (source starts with priority:)', () => {
    const priorityJobs = jobs.filter((j) => j.source?.startsWith('priority:'))
    console.log(`\n    Priority company jobs: ${priorityJobs.length}`)
    if (priorityJobs.length > 0) {
      const bySource = new Map<string, number>()
      for (const j of priorityJobs) {
        bySource.set(j.source!, (bySource.get(j.source!) ?? 0) + 1)
      }
      for (const [src, count] of [...bySource.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`      ${src}: ${count}`)
      }
    }
    assert(true) // Report only
  })

  await test('Stats totals are consistent', () => {
    assert(typeof stats.total === 'number', 'stats.total should be a number')
    assert(typeof stats.global === 'number', 'stats.global should be a number')
    assert(typeof stats.korea === 'number', 'stats.korea should be a number')
    // global + korea should roughly equal total (may not be exact due to null regions)
    const sum = stats.global + stats.korea
    // Allow some tolerance for jobs without region
    assert(
      sum <= stats.total + 10,
      `global(${stats.global}) + korea(${stats.korea}) = ${sum} should be <= total(${stats.total}) + tolerance`
    )
  })

  // ──────── Summary ────────
  printSummary()

  const results = getResults()
  const failCount = results.filter((r) => r.status === 'FAIL').length

  if (process.argv.includes('--report')) {
    generateReport()
  }

  process.exit(failCount > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
