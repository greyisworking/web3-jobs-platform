/**
 * Unit Tests — pure function tests, no server needed.
 * Run with: npx tsx tests/unit-tests.ts
 */

import {
  test,
  assert,
  assertEqual,
  assertIncludes,
  assertNotIncludes,
  assertThrows,
  setCategory,
  printSummary,
  getResults,
  generateReport,
} from './harness'
import { computeBadges } from '../lib/badges'
import { findPriorityCompany } from '../lib/priority-companies'
import { jobSchema } from '../lib/validations/job'

async function run() {
  console.log('\n🧪 Unit Tests\n')

  // ────────────────── computeBadges ──────────────────
  setCategory('computeBadges')

  await test('Verified badge with Hashed backer', () => {
    const badges = computeBadges({ backers: ['Hashed'] })
    assertIncludes(badges, 'Verified')
  })

  await test('Verified badge with a16z backer (case-insensitive)', () => {
    const badges = computeBadges({ backers: ['A16Z'] })
    assertIncludes(badges, 'Verified')
  })

  await test('Verified badge with Paradigm backer', () => {
    const badges = computeBadges({ backers: ['Paradigm'] })
    assertIncludes(badges, 'Verified')
  })

  await test('No Verified badge for non-matching backer (Kakao)', () => {
    const badges = computeBadges({ backers: ['Kakao'] })
    assertNotIncludes(badges, 'Verified')
  })

  await test('No Verified badge when backers is null', () => {
    const badges = computeBadges({ backers: null })
    assertNotIncludes(badges, 'Verified')
  })

  await test('Web3 Perks badge with hasToken: true', () => {
    const badges = computeBadges({ hasToken: true })
    assertIncludes(badges, 'Web3 Perks')
  })

  await test('Web3 Perks badge when description mentions equity', () => {
    const badges = computeBadges({ description: 'We offer equity and competitive salary for all engineers' })
    assertIncludes(badges, 'Web3 Perks')
  })

  await test('Web3 Perks badge when description mentions vesting', () => {
    const badges = computeBadges({ description: 'Token vesting schedule over 4 years with cliff' })
    assertIncludes(badges, 'Web3 Perks')
  })

  await test('Pre-IPO badge for Seed stage', () => {
    const badges = computeBadges({ stage: 'Seed' })
    assertIncludes(badges, 'Pre-IPO')
  })

  await test('Pre-IPO badge for Series A stage', () => {
    const badges = computeBadges({ stage: 'Series A' })
    assertIncludes(badges, 'Pre-IPO')
  })

  await test('No Pre-IPO badge for Established stage', () => {
    const badges = computeBadges({ stage: 'Established' })
    assertNotIncludes(badges, 'Pre-IPO')
  })

  await test('Remote badge when location contains "remote"', () => {
    const badges = computeBadges({ location: 'Remote - Anywhere' })
    assertIncludes(badges, 'Remote')
  })

  await test('No Remote badge for Seoul location', () => {
    const badges = computeBadges({ location: 'Seoul, South Korea' })
    assertNotIncludes(badges, 'Remote')
  })

  await test('Active badge for job posted within 30 days', () => {
    const recent = new Date()
    recent.setDate(recent.getDate() - 5)
    const badges = computeBadges({ postedDate: recent })
    assertIncludes(badges, 'Active')
  })

  await test('No Active badge for job posted 60 days ago', () => {
    const old = new Date()
    old.setDate(old.getDate() - 60)
    const badges = computeBadges({ postedDate: old })
    assertNotIncludes(badges, 'Active')
  })

  await test('English badge for >70% ASCII description', () => {
    const desc = 'We are looking for a senior blockchain developer with experience in Solidity and Rust programming.'
    const badges = computeBadges({ description: desc })
    assertIncludes(badges, 'English')
  })

  await test('No English badge for Korean text', () => {
    const desc = '우리는 블록체인 개발자를 찾고 있습니다. 솔리디티와 러스트 프로그래밍 경험이 있는 시니어 개발자를 모집합니다.'
    const badges = computeBadges({ description: desc })
    assertNotIncludes(badges, 'English')
  })

  await test('No English badge for short text (<= 20 chars)', () => {
    const badges = computeBadges({ description: 'Short' })
    assertNotIncludes(badges, 'English')
  })

  await test('Multiple badges at once', () => {
    const recent = new Date()
    recent.setDate(recent.getDate() - 2)
    const badges = computeBadges({
      backers: ['Hashed'],
      hasToken: true,
      stage: 'Series A',
      location: 'Remote',
      postedDate: recent,
      description: 'Join our team to build the next generation blockchain infrastructure. We offer token equity and great compensation.',
    })
    assertIncludes(badges, 'Verified')
    assertIncludes(badges, 'Web3 Perks')
    assertIncludes(badges, 'Pre-IPO')
    assertIncludes(badges, 'Remote')
    assertIncludes(badges, 'Active')
    assertIncludes(badges, 'English')
    assertEqual(badges.length, 6)
  })

  await test('Empty job returns no badges', () => {
    const badges = computeBadges({})
    assertEqual(badges.length, 0)
  })

  // ────────────────── findPriorityCompany ──────────────────
  setCategory('findPriorityCompany')

  await test('Find by exact name (Hashed)', () => {
    const result = findPriorityCompany('Hashed')
    assert(result !== null, 'Should find Hashed')
    assertEqual(result!.name, 'Hashed')
  })

  await test('Find by alias (DSRV Labs)', () => {
    const result = findPriorityCompany('DSRV Labs')
    assert(result !== null, 'Should find DSRV')
    assertEqual(result!.name, 'DSRV')
  })

  await test('Case-insensitive search (hashed)', () => {
    const result = findPriorityCompany('hashed')
    assert(result !== null, 'Should find Hashed case-insensitively')
    assertEqual(result!.name, 'Hashed')
  })

  await test('Returns null for unknown company', () => {
    const result = findPriorityCompany('NonExistentCompany')
    assertEqual(result, null)
  })

  await test('Returns null for empty string', () => {
    const result = findPriorityCompany('')
    assertEqual(result, null)
  })

  // ────────────────── Zod jobSchema ──────────────────
  setCategory('Zod jobSchema')

  await test('Valid minimal job passes, defaults applied', () => {
    const result = jobSchema.safeParse({
      title: 'Blockchain Developer',
      company: 'CryptoQuant',
      url: 'https://example.com/job/1',
      source: 'web3.career',
    })
    assert(result.success, 'Valid job should pass')
    if (result.success) {
      assertEqual(result.data.location, 'Remote')
      assertEqual(result.data.type, 'Full-time')
      assertEqual(result.data.region, 'Global')
    }
  })

  await test('Missing title fails', () => {
    const result = jobSchema.safeParse({
      company: 'CryptoQuant',
      url: 'https://example.com/job/1',
      source: 'web3.career',
    })
    assert(!result.success, 'Missing title should fail')
  })

  await test('Missing company fails', () => {
    const result = jobSchema.safeParse({
      title: 'Blockchain Developer',
      url: 'https://example.com/job/1',
      source: 'web3.career',
    })
    assert(!result.success, 'Missing company should fail')
  })

  await test('Missing url fails', () => {
    const result = jobSchema.safeParse({
      title: 'Blockchain Developer',
      company: 'CryptoQuant',
      source: 'web3.career',
    })
    assert(!result.success, 'Missing url should fail')
  })

  await test('Missing source fails', () => {
    const result = jobSchema.safeParse({
      title: 'Blockchain Developer',
      company: 'CryptoQuant',
      url: 'https://example.com/job/1',
    })
    assert(!result.success, 'Missing source should fail')
  })

  await test('Short title (1 char) fails', () => {
    const result = jobSchema.safeParse({
      title: 'X',
      company: 'CryptoQuant',
      url: 'https://example.com/job/1',
      source: 'web3.career',
    })
    assert(!result.success, 'Title with 1 char should fail (min 2)')
  })

  await test('Invalid URL fails', () => {
    const result = jobSchema.safeParse({
      title: 'Blockchain Developer',
      company: 'CryptoQuant',
      url: 'not-a-url',
      source: 'web3.career',
    })
    assert(!result.success, 'Bad URL should fail')
  })

  // ──────── Summary ────────
  printSummary()

  const res = getResults()
  const failCount = res.filter((r) => r.status === 'FAIL').length

  // If running standalone, generate report
  if (process.argv.includes('--report')) {
    generateReport()
  }

  process.exit(failCount > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
