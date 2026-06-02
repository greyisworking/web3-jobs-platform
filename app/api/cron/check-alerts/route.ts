import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Auth: CRON_SECRET via Bearer header
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 })
  }

  try {
    // Get all subscriptions
    const subs = await prisma.telegramSubscription.findMany()
    if (subs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscriptions' })
    }

    let totalSent = 0

    for (const sub of subs) {
      // Find jobs posted after last notification
      const words = sub.keyword.split(/\s+/).filter(w => w.length >= 2)

      const conditions = words.map(word => ({
        OR: [
          { title: { contains: word, mode: 'insensitive' as const } },
          { role: { contains: word, mode: 'insensitive' as const } },
          { category: { contains: word, mode: 'insensitive' as const } },
        ],
      }))

      const newJobs = await prisma.job.findMany({
        where: {
          isActive: true,
          postedDate: { gt: sub.lastNotifiedAt },
          AND: conditions,
        },
        orderBy: { postedDate: 'desc' },
        take: 5,
        select: { title: true, company: true, url: true, remoteType: true },
      })

      if (newJobs.length === 0) continue

      // Build message
      const count = newJobs.length
      let text = `🔔 <b>${count} new job${count > 1 ? 's' : ''}</b> matching "${escapeHtml(sub.keyword)}"\n`

      newJobs.forEach((job, i) => {
        text += `\n${i + 1}. <b>${escapeHtml(job.title)}</b> — ${escapeHtml(job.company)}`
        if (job.remoteType) text += ` 🌐 ${job.remoteType}`
        text += `\n   <a href="${job.url}">View job</a>`
      })

      // Send via Telegram Bot API (no bot process needed)
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: sub.chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      })

      if (res.ok) {
        totalSent++
        // Update last notified timestamp
        await prisma.telegramSubscription.update({
          where: { id: sub.id },
          data: { lastNotifiedAt: new Date() },
        })
      } else {
        const err = await res.json()
        console.error(`Failed to send to ${sub.chatId}:`, err)
      }
    }

    return NextResponse.json({ sent: totalSent, subscriptions: subs.length })
  } catch (error) {
    console.error('check-alerts error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
