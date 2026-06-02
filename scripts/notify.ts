/**
 * Discord notification module for crawl pipeline
 */
import axios from 'axios'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''
const BOT_USERNAME = 'NEUN Crawler'
const FOOTER = 'NEUN · GitHub Actions'

export interface CrawlResult {
  source: string
  status: 'success' | 'failed'
  jobCount: number
  newCount: number
  error?: string
}

export interface CrawlReport {
  results: CrawlResult[]
  duration: number
  expiredCount: number
}

type Severity = 'ok' | 'warning' | 'critical'

interface EmbedField {
  name: string
  value: string
  inline: boolean
}

async function sendEmbed(title: string, description: string, color: number, fields: EmbedField[] = []) {
  if (!DISCORD_WEBHOOK_URL) return
  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: BOT_USERNAME,
      embeds: [{
        title,
        description,
        color,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: FOOTER },
      }],
    })
  } catch (error) {
    console.error('Failed to send Discord notification:', error)
  }
}

// Core sources that must succeed for "ok" status
const CORE_SOURCES = new Set([
  'remoteok.com',
  'cryptojobslist.com',
  'jobs.sui.io',
  'remote3.co',
  'rocketpunch.com',
])

function determineSeverity(results: CrawlResult[]): Severity {
  const totalJobs = results.reduce((s, r) => s + r.jobCount, 0)
  const coreResults = results.filter(r => CORE_SOURCES.has(r.source))
  const coreFailures = coreResults.filter(r => r.status === 'failed').length

  // Critical: zero jobs saved OR all core sources failed
  if (totalJobs === 0) return 'critical'
  if (coreResults.length > 0 && coreFailures === coreResults.length) return 'critical'

  // Warning: any core source failed
  if (coreFailures > 0) return 'warning'

  // Ok: jobs saved + core sources healthy (flaky source timeouts are fine)
  return 'ok'
}

const SEVERITY_CONFIG: Record<Severity, { title: string; color: number }> = {
  ok:       { title: '✅ Crawl complete',                   color: 0x22c55e },
  warning:  { title: '⚠️ Crawl complete (core source issue)', color: 0xffa500 },
  critical: { title: '🚨 Crawl failed',                      color: 0xff0000 },
}

export async function sendCrawlStart(sourceCount: number) {
  await sendEmbed(
    '🚀 Crawl started',
    `Scanning ${sourceCount} sources...`,
    0x3498db,
  )
}

export async function sendCrawlReport(report: CrawlReport) {
  const { results, duration, expiredCount } = report

  const totalJobs = results.reduce((s, r) => s + r.jobCount, 0)
  const totalNew = results.reduce((s, r) => s + r.newCount, 0)
  const successCount = results.filter(r => r.status === 'success').length
  const failedResults = results.filter(r => r.status === 'failed')
  const severity = determineSeverity(results)
  const { title, color } = SEVERITY_CONFIG[severity]

  const description = `**${totalNew}** new jobs added (${totalJobs} total processed)`

  const summaryLines = [
    `**New**: ${totalNew}`,
    `**Processed**: ${totalJobs}`,
    `**Sources**: ${successCount}/${results.length} ok`,
    `**Duration**: ${duration.toFixed(0)}s`,
  ]
  if (expiredCount > 0) summaryLines.push(`**Expired**: ${expiredCount} cleaned`)

  const fields: EmbedField[] = [
    { name: 'Summary', value: summaryLines.join('\n'), inline: false },
  ]

  // Successful sources (compact)
  const successList = results
    .filter(r => r.status === 'success' && r.jobCount > 0)
    .map(r => `${r.source}: ${r.jobCount} (${r.newCount} new)`)

  if (successList.length > 0) {
    fields.push({ name: 'Sources', value: successList.join('\n').slice(0, 1024), inline: false })
  }

  // Failed sources (only if any)
  if (failedResults.length > 0) {
    const failedLines = failedResults.map(r => {
      const isCore = CORE_SOURCES.has(r.source)
      const prefix = isCore ? '🔴' : '⏱️'
      const errMsg = r.error ? ` — ${r.error.slice(0, 60)}` : ''
      return `${prefix} ${r.source}${errMsg}`
    })
    fields.push({ name: 'Timeouts / Failures', value: failedLines.join('\n').slice(0, 1024), inline: false })
  }

  // Critical alert only when truly broken
  if (severity === 'critical') {
    fields.push({
      name: '🚨 Action needed',
      value: totalJobs === 0
        ? 'Zero jobs saved — check DATABASE_URL and crawler logs.'
        : 'All core sources failed — check endpoint availability.',
      inline: false,
    })
  }

  await sendEmbed(title, description, color, fields)
}

export async function sendFatalError(error: any) {
  await sendEmbed(
    '❌ Crawler crashed',
    `**Error**: ${error.message || error}`,
    0xff0000,
    [{
      name: 'Stack',
      value: `\`\`\`${(error.stack || String(error)).substring(0, 500)}\`\`\``,
      inline: false,
    }],
  )
}
