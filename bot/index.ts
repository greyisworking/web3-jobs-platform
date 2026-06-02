import 'dotenv/config'
import { Bot } from 'grammy'
import { PrismaClient } from '@prisma/client'
import { searchJobs } from './search'
import { parseQuery } from './parse-query'
import { escapeHtml } from '../lib/escape-html'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN이 .env에 설정되지 않았습니다.')
  process.exit(1)
}

const bot = new Bot(token)
const prisma = new PrismaClient()

// /start
bot.command('start', async (ctx) => {
  await ctx.reply(
    `Hi! I'm the NEUN job bot 🐾\n\n` +
    `Search Web3 jobs in natural language.\n\n` +
    `Examples:\n` +
    `• community manager remote\n` +
    `• 백엔드 개발자 리모트\n` +
    `• DeFi protocol developer\n\n` +
    `Commands:\n` +
    `/subscribe <keyword> — get alerts for new jobs\n` +
    `/subscriptions — view your alerts\n` +
    `/unsubscribe <keyword> — remove an alert`,
  )
})

// /subscribe <keyword>
bot.command('subscribe', async (ctx) => {
  const raw = ctx.match?.trim()
  if (!raw) {
    await ctx.reply('Usage: /subscribe <keyword>\nExample: /subscribe solidity developer')
    return
  }

  const parsed = await parseQuery(raw)
  const keyword = parsed.roleKeyword || raw
  const chatId = String(ctx.chat.id)

  try {
    await prisma.telegramSubscription.upsert({
      where: { chatId_keyword: { chatId, keyword } },
      update: { keywordRaw: raw },
      create: { chatId, keyword, keywordRaw: raw },
    })
    await ctx.reply(`✅ Subscribed to "${keyword}"\nYou'll get alerts when new matching jobs are posted.`)
  } catch (err) {
    console.error('subscribe error:', err)
    await ctx.reply('Failed to subscribe. Try again.')
  }
})

// /subscriptions
bot.command('subscriptions', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const subs = await prisma.telegramSubscription.findMany({ where: { chatId } })

  if (subs.length === 0) {
    await ctx.reply('No active subscriptions.\nUse /subscribe <keyword> to start.')
    return
  }

  let text = `📋 Your subscriptions (${subs.length}):\n`
  subs.forEach((s, i) => {
    text += `\n${i + 1}. ${s.keyword}`
    if (s.keywordRaw !== s.keyword) text += ` (${s.keywordRaw})`
  })
  text += '\n\nUse /unsubscribe <keyword> to remove.'
  await ctx.reply(text)
})

// /unsubscribe <keyword>
bot.command('unsubscribe', async (ctx) => {
  const raw = ctx.match?.trim()
  if (!raw) {
    await ctx.reply('Usage: /unsubscribe <keyword>')
    return
  }

  const parsed = await parseQuery(raw)
  const keyword = parsed.roleKeyword || raw
  const chatId = String(ctx.chat.id)

  try {
    await prisma.telegramSubscription.delete({
      where: { chatId_keyword: { chatId, keyword } },
    })
    await ctx.reply(`🗑 Unsubscribed from "${keyword}"`)
  } catch {
    await ctx.reply(`No subscription found for "${keyword}"`)
  }
})

// 일반 텍스트 → 검색
bot.on('message:text', async (ctx) => {
  const userMessage = ctx.message.text.trim()
  if (!userMessage) return

  await ctx.reply('🔍 Searching...')

  try {
    const parsed = await parseQuery(userMessage)
    console.log('[bot] parsed:', JSON.stringify(parsed))

    const { jobs, count } = await searchJobs(parsed)
    console.log('[bot] results:', count)

    if (count === 0) {
      await ctx.reply('No matching jobs found. Try different keywords!')
      return
    }

    const summaryLabel = escapeHtml(parsed.roleKeyword || userMessage)
    let text = `🔍 "${summaryLabel}" — ${count} jobs found\n`

    jobs.forEach((job, i) => {
      const remote = job.remoteType ? `🌐 ${job.remoteType}` : ''
      text += `\n${i + 1}. <b>${escapeHtml(job.title)}</b> — ${escapeHtml(job.company)}`
      if (remote) text += `\n   ${remote}`
      text += `\n   🔗 <a href="${job.url}">View job</a>`
    })

    if (count > 3) {
      const q = encodeURIComponent(parsed.roleKeyword || userMessage)
      text += `\n\nView all ${count} → <a href="https://neun.wtf/jobs?q=${q}">neun.wtf</a>`
    }

    await ctx.reply(text, { parse_mode: 'HTML' })
  } catch (err) {
    console.error('search error:', err)
    await ctx.reply('Something went wrong. Try again.')
  }
})

bot.start({ onStart: () => console.log('🤖 NEUN bot started (polling)') })

const stop = () => { console.log('\nStopping bot...'); bot.stop() }
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
