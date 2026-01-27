/**
 * Minimal test harness — no npm dependencies required.
 * Provides test(), assert(), assertEqual(), result collection, and Markdown report generation.
 */

import * as fs from 'fs'
import * as path from 'path'

export interface TestResult {
  name: string
  category: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  error?: string
  durationMs?: number
}

const results: TestResult[] = []
let currentCategory = 'default'

export function setCategory(name: string) {
  currentCategory = name
}

export class AssertionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssertionError'
  }
}

export function assert(condition: unknown, msg = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new AssertionError(msg)
  }
}

export function assertEqual<T>(actual: T, expected: T, msg?: string) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    throw new AssertionError(msg ?? `Expected ${e}, got ${a}`)
  }
}

export function assertIncludes(arr: unknown[], value: unknown, msg?: string) {
  if (!arr.includes(value)) {
    throw new AssertionError(msg ?? `Expected array to include ${JSON.stringify(value)}`)
  }
}

export function assertNotIncludes(arr: unknown[], value: unknown, msg?: string) {
  if (arr.includes(value)) {
    throw new AssertionError(msg ?? `Expected array NOT to include ${JSON.stringify(value)}`)
  }
}

export function assertThrows(fn: () => void, msg?: string) {
  try {
    fn()
  } catch {
    return // expected
  }
  throw new AssertionError(msg ?? 'Expected function to throw')
}

export function assertMatch(str: string, regex: RegExp, msg?: string) {
  if (!regex.test(str)) {
    throw new AssertionError(msg ?? `Expected "${str}" to match ${regex}`)
  }
}

export async function test(name: string, fn: () => void | Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    const dur = Date.now() - start
    results.push({ name, category: currentCategory, status: 'PASS', durationMs: dur })
    console.log(`  \x1b[32m✓\x1b[0m ${name} (${dur}ms)`)
  } catch (err: unknown) {
    const dur = Date.now() - start
    const message = err instanceof Error ? err.message : String(err)
    results.push({ name, category: currentCategory, status: 'FAIL', error: message, durationMs: dur })
    console.log(`  \x1b[31m✗\x1b[0m ${name} — ${message}`)
  }
}

export function skip(name: string, reason = '') {
  results.push({ name, category: currentCategory, status: 'SKIP', error: reason })
  console.log(`  \x1b[33m⊘\x1b[0m ${name} (SKIPPED${reason ? ': ' + reason : ''})`)
}

export function getResults(): TestResult[] {
  return [...results]
}

export function clearResults() {
  results.length = 0
}

export function printSummary() {
  const pass = results.filter((r) => r.status === 'PASS').length
  const fail = results.filter((r) => r.status === 'FAIL').length
  const skipped = results.filter((r) => r.status === 'SKIP').length
  console.log('')
  console.log(`\x1b[1mResults: ${pass} passed, ${fail} failed, ${skipped} skipped out of ${results.length}\x1b[0m`)
  if (fail > 0) {
    console.log('\x1b[31mFailing tests:\x1b[0m')
    for (const r of results.filter((r) => r.status === 'FAIL')) {
      console.log(`  - ${r.name}: ${r.error}`)
    }
  }
}

export function generateReport(outputPath?: string): string {
  const filePath = outputPath ?? path.join(process.cwd(), 'docs', 'test-report.md')

  const pass = results.filter((r) => r.status === 'PASS').length
  const fail = results.filter((r) => r.status === 'FAIL').length
  const skipped = results.filter((r) => r.status === 'SKIP').length

  // Group by category
  const categories = new Map<string, TestResult[]>()
  for (const r of results) {
    const cat = r.category
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(r)
  }

  const statusIcon = (s: string) => (s === 'PASS' ? '✅' : s === 'FAIL' ? '❌' : '⏭️')

  let md = `# Test Report\n\n`
  md += `**Generated**: ${new Date().toISOString()}\n\n`
  md += `## Summary\n\n`
  md += `| Metric | Count |\n|--------|-------|\n`
  md += `| Total | ${results.length} |\n`
  md += `| Passed | ${pass} |\n`
  md += `| Failed | ${fail} |\n`
  md += `| Skipped | ${skipped} |\n`
  md += `| Pass Rate | ${results.length > 0 ? ((pass / results.length) * 100).toFixed(1) : 0}% |\n\n`

  for (const [cat, tests] of categories) {
    const catPass = tests.filter((t) => t.status === 'PASS').length
    const catFail = tests.filter((t) => t.status === 'FAIL').length
    md += `## ${cat} (${catPass}/${tests.length} passed)\n\n`
    md += `| Status | Test | Duration | Error |\n|--------|------|----------|-------|\n`
    for (const t of tests) {
      const dur = t.durationMs != null ? `${t.durationMs}ms` : '-'
      const err = t.error ? t.error.replace(/\|/g, '\\|').replace(/\n/g, ' ') : ''
      md += `| ${statusIcon(t.status)} ${t.status} | ${t.name} | ${dur} | ${err} |\n`
    }
    md += '\n'
  }

  if (fail > 0) {
    md += `## Failed Tests Details\n\n`
    for (const r of results.filter((r) => r.status === 'FAIL')) {
      md += `### ${r.name}\n- **Category**: ${r.category}\n- **Error**: ${r.error}\n\n`
    }
  }

  // Ensure directory exists
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filePath, md, 'utf-8')
  console.log(`\nReport written to ${filePath}`)
  return filePath
}
