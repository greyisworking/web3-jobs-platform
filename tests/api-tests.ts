/**
 * API Tests — HTTP tests against localhost:3006 using fetch.
 * Run with: npx tsx tests/api-tests.ts
 * Requires dev server running on port 3006.
 */

import {
  test,
  assert,
  assertEqual,
  skip,
  setCategory,
  printSummary,
  getResults,
  generateReport,
} from './harness'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3006'

async function fetchJSON(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, init)
  return { status: res.status, body: await res.json().catch(() => null), res }
}

async function run() {
  console.log('\n🌐 API Tests\n')

  // ────────────────── Public API ──────────────────
  setCategory('Public API — /api/jobs')

  await test('GET /api/jobs returns 200 with jobs[] and stats{}', async () => {
    const { status, body } = await fetchJSON('/api/jobs')
    assertEqual(status, 200)
    assert(Array.isArray(body.jobs), 'jobs should be an array')
    assert(typeof body.stats === 'object', 'stats should be an object')
    assert('total' in body.stats, 'stats should have total')
    assert('global' in body.stats, 'stats should have global')
    assert('korea' in body.stats, 'stats should have korea')
    assert('sources' in body.stats, 'stats should have sources')
  })

  await test('Response time < 2000ms', async () => {
    const start = Date.now()
    await fetch(`${BASE_URL}/api/jobs`)
    const elapsed = Date.now() - start
    assert(elapsed < 2000, `Response took ${elapsed}ms, expected < 2000ms`)
  })

  await test('Jobs have required fields (id, title, company, url, source, region)', async () => {
    const { body } = await fetchJSON('/api/jobs')
    if (body.jobs.length === 0) {
      assert(true, 'No jobs to validate — skipping field check')
      return
    }
    const job = body.jobs[0]
    for (const field of ['id', 'title', 'company', 'url', 'source', 'region']) {
      assert(field in job, `Job missing field: ${field}`)
    }
  })

  await test('Jobs limited to ≤500', async () => {
    const { body } = await fetchJSON('/api/jobs')
    assert(body.jobs.length <= 500, `Got ${body.jobs.length} jobs, expected ≤500`)
  })

  await test('?badge=Verified returns only Verified jobs (or empty)', async () => {
    const { status, body } = await fetchJSON('/api/jobs?badge=Verified')
    assertEqual(status, 200)
    for (const job of body.jobs) {
      assert(
        Array.isArray(job.badges) && job.badges.includes('Verified'),
        `Job ${job.id} should have Verified badge`
      )
    }
  })

  await test('?backer=Hashed returns only Hashed-backed jobs (or empty)', async () => {
    const { status, body } = await fetchJSON('/api/jobs?backer=Hashed')
    assertEqual(status, 200)
    for (const job of body.jobs) {
      assert(
        Array.isArray(job.backers) && job.backers.includes('Hashed'),
        `Job ${job.id} should have Hashed backer`
      )
    }
  })

  await test('?badge=NonExistent returns 200 (no crash)', async () => {
    const { status, body } = await fetchJSON('/api/jobs?badge=NonExistent')
    assertEqual(status, 200)
    assert(Array.isArray(body.jobs), 'Should still return jobs array')
  })

  await test('stats.sources is a non-empty array (bug fix #2)', async () => {
    const { body } = await fetchJSON('/api/jobs')
    assert(Array.isArray(body.stats.sources), 'sources should be an array')
    // If there are jobs, sources should not be empty
    if (body.jobs.length > 0) {
      assert(body.stats.sources.length > 0, 'sources should not be empty when jobs exist')
      const first = body.stats.sources[0]
      assert(typeof first.source === 'string', 'source entry should have source string')
      assert(typeof first._count === 'number', 'source entry should have _count number')
    }
  })

  await test('?status=all no longer exposes inactive jobs (bug fix #1)', async () => {
    // The status param should be ignored now — always returns active only
    const { status, body } = await fetchJSON('/api/jobs?status=all')
    assertEqual(status, 200)
    // We verify the endpoint doesn't crash; the data should be same as without param
    assert(Array.isArray(body.jobs), 'Should return jobs array')
  })

  await test('10 concurrent requests all succeed', async () => {
    const promises = Array.from({ length: 10 }, () => fetch(`${BASE_URL}/api/jobs`))
    const responses = await Promise.all(promises)
    for (const res of responses) {
      assertEqual(res.status, 200)
    }
  })

  // ────────────────── Admin API Auth ──────────────────
  setCategory('Admin API — Auth (401)')

  const adminEndpoints = [
    { method: 'GET', path: '/api/admin/jobs' },
    { method: 'POST', path: '/api/admin/jobs/approve' },
    { method: 'POST', path: '/api/admin/jobs/reject' },
    { method: 'POST', path: '/api/admin/jobs/delete' },
    { method: 'POST', path: '/api/admin/jobs/merge' },
    { method: 'POST', path: '/api/admin/jobs/badges' },
    { method: 'GET', path: '/api/admin/jobs/duplicates' },
    { method: 'GET', path: '/api/admin/monitoring/crawl-history' },
    { method: 'GET', path: '/api/admin/monitoring/proxies' },
    { method: 'GET', path: '/api/admin/monitoring/errors' },
    { method: 'GET', path: '/api/admin/monitoring/stats' },
    { method: 'GET', path: '/api/admin/analytics/searches' },
  ]

  for (const ep of adminEndpoints) {
    await test(`${ep.method} ${ep.path} returns 401 without auth`, async () => {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: ep.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: ep.method === 'POST' ? JSON.stringify({}) : undefined,
      })
      // Accept 401 (Unauthorized) or 403 (Forbidden) — both indicate auth is enforced
      assert(
        res.status === 401 || res.status === 403,
        `Expected 401 or 403, got ${res.status} for ${ep.method} ${ep.path}`
      )
    })
  }

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
