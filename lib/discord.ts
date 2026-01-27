import axios from 'axios'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''

interface CrawlResult {
  source: string
  status: 'success' | 'failed'
  jobCount: number
  error?: string
}

interface CrawlSummary {
  totalJobs: number
  successCount: number
  failedCount: number
  duration: number
  results: CrawlResult[]
}

export async function sendDiscordNotification(summary: CrawlSummary) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('⚠️  Discord webhook URL not configured')
    return
  }

  const successEmoji = summary.failedCount === 0 ? '🎉' : '⚠️'
  const durationMinutes = (summary.duration / 60).toFixed(1)

  // 성공한 크롤러들
  const successList = summary.results
    .filter((r) => r.status === 'success')
    .map((r) => `✅ **${r.source}**: ${r.jobCount} jobs`)
    .join('\n')

  // 실패한 크롤러들
  const failedList = summary.results
    .filter((r) => r.status === 'failed')
    .map((r) => `❌ **${r.source}**: ${r.error || 'Unknown error'}`)
    .join('\n')

  const embed = {
    title: `${successEmoji} Web3 Jobs Crawl Complete`,
    color: summary.failedCount === 0 ? 0x00ff00 : 0xffa500, // Green or Orange
    fields: [
      {
        name: '📊 Summary',
        value: `**Total Jobs**: ${summary.totalJobs}\n**Success**: ${summary.successCount}/${summary.results.length}\n**Duration**: ${durationMinutes} min`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Web3 Jobs Platform',
    },
  }

  // 성공 목록 추가
  if (successList) {
    embed.fields.push({
      name: '✅ Successful Crawls',
      value: successList,
      inline: false,
    })
  }

  // 실패 목록 추가
  if (failedList) {
    embed.fields.push({
      name: '❌ Failed Crawls',
      value: failedList,
      inline: false,
    })
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'Web3 Jobs Bot',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png',
      embeds: [embed],
    })
    console.log('✅ Discord notification sent!')
  } catch (error) {
    console.error('❌ Failed to send Discord notification:', error)
  }
}

export async function sendDiscordError(message: string, error: any) {
  if (!DISCORD_WEBHOOK_URL) return

  const embed = {
    title: '🚨 Crawl Error',
    description: message,
    color: 0xff0000, // Red
    fields: [
      {
        name: 'Error Details',
        value: `\`\`\`${error?.message || error}\`\`\``,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Web3 Jobs Platform',
    },
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'Web3 Jobs Bot',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png',
      embeds: [embed],
    })
  } catch (err) {
    console.error('❌ Failed to send error notification:', err)
  }
}

export async function sendDiscordStartNotification() {
  if (!DISCORD_WEBHOOK_URL) return

  const embed = {
    title: '🚀 Starting Web3 Jobs Crawl',
    description: 'Crawling 11 job sites...',
    color: 0x3498db, // Blue
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Web3 Jobs Platform',
    },
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'Web3 Jobs Bot',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png',
      embeds: [embed],
    })
  } catch (error) {
    console.error('❌ Failed to send start notification:', error)
  }
}
