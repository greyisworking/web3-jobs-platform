/**
 * Discord notification module for crawl pipeline (한국어 — 내부 ops용)
 */
import axios from 'axios'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''
const BOT_USERNAME = 'NEUN 크롤러'
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
    console.error('Discord 알림 전송 실패:', error)
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

  if (totalJobs === 0) return 'critical'
  if (coreResults.length > 0 && coreFailures === coreResults.length) return 'critical'
  if (coreFailures > 0) return 'warning'
  return 'ok'
}

const SEVERITY_CONFIG: Record<Severity, { title: string; color: number }> = {
  ok:       { title: '✅ 크롤링 완료',                     color: 0x22c55e },
  warning:  { title: '⚠️ 크롤링 완료 (핵심 소스 문제)',      color: 0xffa500 },
  critical: { title: '🚨 크롤링 실패',                     color: 0xff0000 },
}

export async function sendCrawlStart(sourceCount: number) {
  await sendEmbed(
    '🚀 크롤링 시작',
    `${sourceCount}개 소스에서 공고 수집 중...`,
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

  const description = `🆕 새 공고 **${totalNew}개** 추가 (전체 ${totalJobs}개 처리)`

  const summaryLines = [
    `**🆕 새 공고**: ${totalNew}개`,
    `**📦 전체 처리**: ${totalJobs}개`,
    `**소스**: ${successCount}/${results.length}개 성공`,
    `**⏱️ 소요**: ${duration.toFixed(0)}초`,
  ]
  if (expiredCount > 0) summaryLines.push(`**🗑️ 만료 정리**: ${expiredCount}건`)

  const fields: EmbedField[] = [
    { name: '📊 요약', value: summaryLines.join('\n'), inline: false },
  ]

  const successList = results
    .filter(r => r.status === 'success' && r.jobCount > 0)
    .map(r => `${r.source}: ${r.jobCount}개 (🆕 ${r.newCount})`)

  if (successList.length > 0) {
    fields.push({ name: '✅ 수집 완료', value: successList.join('\n').slice(0, 1024), inline: false })
  }

  if (failedResults.length > 0) {
    const failedLines = failedResults.map(r => {
      const isCore = CORE_SOURCES.has(r.source)
      const prefix = isCore ? '🔴' : '⏱️'
      const errMsg = r.error ? ` — ${r.error.slice(0, 60)}` : ''
      return `${prefix} ${r.source}${errMsg}`
    })
    fields.push({ name: '⏱️ 타임아웃 / 실패', value: failedLines.join('\n').slice(0, 1024), inline: false })
  }

  if (severity === 'critical') {
    fields.push({
      name: '🚨 조치 필요',
      value: totalJobs === 0
        ? 'DB 저장 0건 — DATABASE_URL과 크롤러 로그 확인 필요'
        : '핵심 소스 전부 실패 — 엔드포인트 상태 확인 필요',
      inline: false,
    })
  }

  await sendEmbed(title, description, color, fields)
}

export async function sendFatalError(error: any) {
  await sendEmbed(
    '❌ 크롤러 크래시',
    `**오류**: ${error.message || error}`,
    0xff0000,
    [{
      name: '스택 트레이스',
      value: `\`\`\`${(error.stack || String(error)).substring(0, 500)}\`\`\``,
      inline: false,
    }],
  )
}
