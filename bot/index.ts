import 'dotenv/config'
import { Bot } from 'grammy'
import { searchJobs } from './search'
import { parseQuery } from './parse-query'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN이 .env에 설정되지 않았습니다.')
  console.error('BotFather에서 봇을 만들고 토큰을 .env에 넣어주세요.')
  process.exit(1)
}

const bot = new Bot(token)

// /start 명령어
bot.command('start', async (ctx) => {
  await ctx.reply(
    `안녕하세요! NEUN 채용봇이에요 🐾\n\n` +
    `Web3 채용 공고를 자연어로 검색할 수 있어요.\n\n` +
    `사용 예시:\n` +
    `• 커뮤니티 매니저 리모트 공고 보여줘\n` +
    `• remote senior solidity engineer\n` +
    `• 디자이너 채용 있어?\n` +
    `• DeFi protocol developer\n\n` +
    `아무 메시지나 보내면 검색합니다!`,
  )
})

// 일반 텍스트 → 검색
bot.on('message:text', async (ctx) => {
  const userMessage = ctx.message.text.trim()
  if (!userMessage) return

  await ctx.reply('🔍 검색 중...')

  try {
    // 1) LLM으로 자연어 파싱 시도
    const parsed = await parseQuery(userMessage)
    console.log('[bot] parsed:', JSON.stringify(parsed))

    // 2) DB 검색
    const { jobs, count } = await searchJobs(parsed)
    console.log('[bot] results:', count, '건')

    // 3) 응답 포맷
    if (count === 0) {
      await ctx.reply(
        `조건에 맞는 공고를 못 찾았어요.\n다른 키워드로 해보세요!`,
      )
      return
    }

    const summaryLabel = escapeHtml(parsed.roleKeyword || userMessage)
    let text = `🔍 "${summaryLabel}" 공고 ${count}건을 찾았어요\n`

    jobs.forEach((job, i) => {
      const remote = job.remoteType ? `🌐 ${job.remoteType}` : ''
      text += `\n${i + 1}. <b>${escapeHtml(job.title)}</b> — ${escapeHtml(job.company)}`
      if (remote) text += `\n   ${remote}`
      text += `\n   🔗 <a href="${job.url}">공고 보기</a>`
    })

    if (count > 3) {
      const q = encodeURIComponent(parsed.roleKeyword || userMessage)
      text += `\n\n전체 ${count}건 보기 → <a href="https://neun.wtf/jobs?q=${q}">neun.wtf</a>`
    }

    await ctx.reply(text, { parse_mode: 'HTML' })
  } catch (err) {
    console.error('검색 오류:', err)
    await ctx.reply('검색 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
  }
})

// HTML 이스케이프
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 시작
bot.start({
  onStart: () => {
    console.log('🤖 NEUN 채용봇 시작됨 (polling 모드)')
  },
})

// 종료 처리
const stop = () => {
  console.log('\n봇 종료 중...')
  bot.stop()
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
