/**
 * Test Orchestrator — runs all test categories in sequence, generates docs/test-report.md.
 * Run with: npx tsx tests/run-all-tests.ts
 */

import { execSync, ExecSyncOptions } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

interface SuiteResult {
  name: string
  exitCode: number
  output: string
  durationMs: number
}

const ROOT = path.resolve(__dirname, '..')
const opts: ExecSyncOptions = { cwd: ROOT, stdio: 'pipe', timeout: 120_000 }

function runSuite(name: string, cmd: string): SuiteResult {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Running: ${name}`)
  console.log('='.repeat(60))
  const start = Date.now()
  let output = ''
  let exitCode = 0
  try {
    const buf = execSync(cmd, opts)
    output = buf.toString()
    console.log(output)
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: Buffer; stderr?: Buffer }
    exitCode = e.status ?? 1
    output = (e.stdout?.toString() ?? '') + '\n' + (e.stderr?.toString() ?? '')
    console.log(output)
  }
  const dur = Date.now() - start
  return { name, exitCode, output, durationMs: dur }
}

function generateCombinedReport(suiteResults: SuiteResult[]) {
  const docsDir = path.join(ROOT, 'docs')
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  const reportPath = path.join(docsDir, 'test-report.md')
  const totalPassed = suiteResults.filter((s) => s.exitCode === 0).length
  const totalFailed = suiteResults.filter((s) => s.exitCode !== 0).length

  let md = `# Test Report\n\n`
  md += `**Generated**: ${new Date().toISOString()}\n\n`
  md += `## Overall Summary\n\n`
  md += `| Metric | Value |\n|--------|-------|\n`
  md += `| Suites Run | ${suiteResults.length} |\n`
  md += `| Suites Passed | ${totalPassed} |\n`
  md += `| Suites Failed | ${totalFailed} |\n`
  md += `| Total Duration | ${suiteResults.reduce((s, r) => s + r.durationMs, 0)}ms |\n\n`

  md += `## Suite Results\n\n`
  md += `| Suite | Status | Duration |\n|-------|--------|----------|\n`
  for (const s of suiteResults) {
    const icon = s.exitCode === 0 ? '✅ PASS' : '❌ FAIL'
    md += `| ${s.name} | ${icon} | ${s.durationMs}ms |\n`
  }
  md += '\n'

  for (const s of suiteResults) {
    md += `## ${s.name}\n\n`
    md += '```\n'
    // Truncate very long outputs
    const lines = s.output.split('\n')
    const shown = lines.slice(0, 200).join('\n')
    md += shown
    if (lines.length > 200) md += `\n... (${lines.length - 200} more lines)`
    md += '\n```\n\n'
  }

  fs.writeFileSync(reportPath, md, 'utf-8')
  console.log(`\n📄 Report written to ${reportPath}`)
}

async function main() {
  console.log('🚀 Running all test suites...\n')

  const results: SuiteResult[] = []

  // 1. Unit tests (always runnable)
  results.push(runSuite('Unit Tests', 'npx tsx tests/unit-tests.ts'))

  // 2. API tests (needs running server)
  results.push(runSuite('API Tests', 'npx tsx tests/api-tests.ts'))

  // 3. E2E tests (needs running server + puppeteer)
  results.push(runSuite('E2E Tests', 'npx tsx tests/e2e-tests.ts'))

  // 4. Data quality tests (needs running server)
  results.push(runSuite('Data Quality Tests', 'npx tsx tests/data-quality-tests.ts'))

  // Generate combined report
  generateCombinedReport(results)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('FINAL SUMMARY')
  console.log('='.repeat(60))
  for (const r of results) {
    const icon = r.exitCode === 0 ? '✅' : '❌'
    console.log(`  ${icon} ${r.name} (${r.durationMs}ms)`)
  }

  const anyFailed = results.some((r) => r.exitCode !== 0)
  console.log(`\n${anyFailed ? '❌ Some suites failed' : '✅ All suites passed'}`)

  process.exit(anyFailed ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
