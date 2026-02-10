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

  const durationMinutes = (summary.duration / 60).toFixed(1)

  // 성공한 크롤러들
  const successList = summary.results
    .filter((r) => r.status === 'success')
    .map((r) => `✅ **${r.source}**: ${r.jobCount}개`)
    .join('\n')

  // 실패한 크롤러들
  const failedList = summary.results
    .filter((r) => r.status === 'failed')
    .map((r) => `❌ **${r.source}**: ${r.error || '알 수 없는 오류'}`)
    .join('\n')

  // 친절한 한글 메시지
  const title = summary.failedCount === 0
    ? '✅ 크롤링 완료!'
    : '⚠️ 크롤링 완료 (일부 오류 있음)'

  const description = summary.failedCount === 0
    ? `새 공고 ${summary.totalJobs}개 수집했어요!\n홈페이지에 반영 완료!`
    : `새 공고 ${summary.totalJobs}개 수집했어요.\n일부 소스에서 오류가 발생했어요.`

  const embed = {
    title,
    description,
    color: summary.failedCount === 0 ? 0x22c55e : 0xffa500, // Green or Orange
    fields: [
      {
        name: '📊 요약',
        value: `**총 공고 수**: ${summary.totalJobs}개\n**성공**: ${summary.successCount}/${summary.results.length}개 소스\n**소요 시간**: ${durationMinutes}분`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'NEUN 채용 플랫폼',
    },
  }

  // 성공 목록 추가
  if (successList) {
    embed.fields.push({
      name: '✅ 수집 완료',
      value: successList,
      inline: false,
    })
  }

  // 실패 목록 추가
  if (failedList) {
    embed.fields.push({
      name: '❌ 오류 발생 (확인 필요)',
      value: failedList,
      inline: false,
    })
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'NEUN 봇',
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
    title: '❌ 크롤링 실패',
    description: `${message}\n\n**확인이 필요해요!**`,
    color: 0xff0000, // Red
    fields: [
      {
        name: '🔍 오류 내용',
        value: `\`\`\`${error?.message || error}\`\`\``,
        inline: false,
      },
      {
        name: '💡 조치 방법',
        value: '관리자 페이지에서 오류 로그를 확인해주세요.\n지속적으로 발생하면 개발팀에 문의해주세요.',
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'NEUN 채용 플랫폼',
    },
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'NEUN 봇',
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
    title: '🚀 크롤링 시작!',
    description: '12개 채용 사이트에서 공고를 수집하고 있어요.\n완료되면 다시 알려드릴게요!',
    color: 0x3498db, // Blue
    timestamp: new Date().toISOString(),
    footer: {
      text: 'NEUN 채용 플랫폼',
    },
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'NEUN 봇',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png',
      embeds: [embed],
    })
  } catch (error) {
    console.error('❌ Failed to send start notification:', error)
  }
}
