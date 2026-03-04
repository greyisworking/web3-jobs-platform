/**
 * Discord notification module for crawl pipeline
 *
 * Sends structured embed notifications via Discord webhook.
 * Silently skips if DISCORD_WEBHOOK_URL is not set.
 */
import axios from 'axios'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''
const BOT_USERNAME = 'Web3 Jobs Bot'
const BOT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png'
const FOOTER = 'Web3 Jobs Platform • GitHub Actions'

// ── Types ──

export interface CrawlResult {
  source: string
  status: 'success' | 'failed'
  jobCount: number
  newCount: number
  error?: string
}

export interface CrawlReport {
  results: CrawlResult[]
  duration: number       // seconds
  expiredCount: number   // jobs deactivated by expire cleanup
}

type Severity = 'ok' | 'warning' | 'critical'

// ── Internals ──

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
      avatar_url: BOT_AVATAR,
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
    console.error('❌ Failed to send Discord notification:', error)
  }
}

function determineSeverity(results: CrawlResult[]): Severity {
  const total = results.length
  const failedCount = results.filter(r => r.status === 'failed').length
  const failRate = failedCount / total

  if (failRate >= 0.5) return 'critical'
  if (failedCount > 0) return 'warning'
  return 'ok'
}

const SEVERITY_CONFIG: Record<Severity, { title: string; color: number }> = {
  ok:       { title: '✅ 크롤링 완료!',                color: 0x22c55e },
  warning:  { title: '⚠️ 크롤링 완료 (일부 오류 있음)', color: 0xffa500 },
  critical: { title: '🚨 크롤링 완료 (심각한 오류)',     color: 0xff0000 },
}

// ── Public API ──

/**
 * Send crawl-start notification
 */
export async function sendCrawlStart(sourceCount: number) {
  await sendEmbed(
    '🚀 크롤링 시작!',
    `${sourceCount}개 채용 사이트에서 공고를 수집하고 있어요.\n완료되면 다시 알려드릴게요!`,
    0x3498db,
  )
}

/**
 * Send crawl-complete report with full breakdown
 */
export async function sendCrawlReport(report: CrawlReport) {
  const { results, duration, expiredCount } = report

  const totalJobs = results.reduce((s, r) => s + r.jobCount, 0)
  const totalNew = results.reduce((s, r) => s + r.newCount, 0)
  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length
  const severity = determineSeverity(results)
  const { title, color } = SEVERITY_CONFIG[severity]

  // Description
  const descLines: string[] = []
  if (severity === 'critical') {
    descLines.push(`🚨 **${failedCount}/${results.length}개 소스 실패** — 즉시 확인이 필요해요!`)
  }
  descLines.push(`🆕 새 공고 **${totalNew}개** 추가됐어요.`)
  descLines.push(`(전체 ${totalJobs}개 처리)`)
  const description = descLines.join('\n')

  // Field 1: 요약
  const summaryLines = [
    `**🆕 새 공고**: ${totalNew}개`,
    `**📦 전체 처리**: ${totalJobs}개`,
    `**성공**: ${successCount}/${results.length}개 소스`,
    `**⏱️ 소요 시간**: ${duration.toFixed(1)}초`,
  ]
  if (expiredCount > 0) {
    summaryLines.push(`**🗑️ 만료 정리**: ${expiredCount}건`)
  }

  const fields: EmbedField[] = [
    { name: '📊 요약', value: summaryLines.join('\n'), inline: false },
  ]

  // Field 2: 수집 완료 소스
  const successList = results
    .filter(r => r.status === 'success' && r.jobCount > 0)
    .map(r => `✅ **${r.source}**: ${r.jobCount}개 (🆕 ${r.newCount}개)`)

  if (successList.length > 0) {
    // Discord embed field value max 1024 chars — truncate if needed
    const value = successList.join('\n').slice(0, 1024)
    fields.push({ name: '✅ 수집 완료', value, inline: false })
  }

  // Field 3: 오류 소스 + 에러 메시지
  const failedResults = results.filter(r => r.status === 'failed')
  if (failedResults.length > 0) {
    const failedLines = failedResults.map(r => {
      const errMsg = r.error ? `: ${r.error.slice(0, 80)}` : ''
      return `❌ **${r.source}**${errMsg}`
    })
    const value = failedLines.join('\n').slice(0, 1024)
    fields.push({ name: '❌ 오류 발생', value, inline: false })
  }

  // Field 4: 심각 경고 (50%+ 실패)
  if (severity === 'critical') {
    fields.push({
      name: '🚨 긴급 조치 필요',
      value: `전체 소스의 **${Math.round(failedCount / results.length * 100)}%**가 실패했어요.\n관리자 페이지에서 오류 로그를 확인해주세요.`,
      inline: false,
    })
  }

  await sendEmbed(title, description, color, fields)
}

/**
 * Send fatal error notification (entire crawl pipeline crashed)
 */
export async function sendFatalError(error: any) {
  await sendEmbed(
    '❌ 크롤링 실패',
    `크롤러가 중단됐어요.\n\n**원인**: ${error.message || error}\n\n**확인이 필요해요!**`,
    0xff0000,
    [
      {
        name: '🔍 오류 상세',
        value: `\`\`\`${(error.stack || String(error)).substring(0, 500)}\`\`\``,
        inline: false,
      },
      {
        name: '💡 조치 방법',
        value: '관리자 페이지에서 오류 로그를 확인해주세요.',
        inline: false,
      },
    ],
  )
}
