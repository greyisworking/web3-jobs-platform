/**
 * Translate Korean job descriptions for wanted.co.kr postings.
 * - Backs up originals to scripts/backup-wanted-descriptions.json
 * - Only touches wanted.co.kr source with Korean in description
 * - Skips English-only descriptions
 * - On failure, keeps original
 *
 * Usage:
 *   npx tsx scripts/translate-wanted-descriptions.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import translate from 'google-translate-api-x'
import { writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

function containsKorean(text: string): boolean {
  return /[\uAC00-\uD7AF]/.test(text)
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  // 1. Fetch all wanted.co.kr jobs
  const jobs = await prisma.job.findMany({
    where: { source: 'wanted.co.kr' },
    select: { id: true, title: true, company: true, description: true },
  })

  console.log(`wanted.co.kr 전체: ${jobs.length}건`)

  // Filter to Korean descriptions only
  const targets = jobs.filter(j => j.description && containsKorean(j.description))
  const skipped = jobs.length - targets.length
  console.log(`한글 JD: ${targets.length}건 (영문/빈 JD skip: ${skipped}건)\n`)

  if (targets.length === 0) {
    console.log('번역 대상 없음.')
    await prisma.$disconnect()
    return
  }

  // 2. Backup originals
  const backup = targets.map(j => ({
    id: j.id,
    title: j.title,
    company: j.company,
    description_ko: j.description,
  }))
  const backupPath = join(__dirname, 'backup-wanted-descriptions.json')
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8')
  console.log(`백업 저장: ${backupPath} (${targets.length}건)\n`)
  console.log('─'.repeat(70))

  // 3. Translate each
  let success = 0
  let failed = 0
  const errors: { title: string; error: string }[] = []

  for (let i = 0; i < targets.length; i++) {
    const job = targets[i]
    const label = `[${i + 1}/${targets.length}] ${job.company} — ${job.title}`

    try {
      const res = await translate(job.description!, { from: 'ko', to: 'en' })
      const translated = res.text

      await prisma.job.update({
        where: { id: job.id },
        data: { description: translated },
      })

      console.log(`✅ ${label}`)
      console.log(`   ${job.description!.length}자 → ${translated.length}자`)
      success++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`❌ ${label}`)
      console.log(`   에러: ${msg}`)
      errors.push({ title: job.title, error: msg })
      failed++
    }

    // Rate limit: 1.5s between requests
    if (i < targets.length - 1) await delay(1500)
  }

  // 4. Summary
  console.log('\n' + '═'.repeat(70))
  console.log(`완료: 성공 ${success}건 / 실패 ${failed}건 / skip ${skipped}건`)
  console.log(`전체 DB 영향: wanted.co.kr ${jobs.length}건만 (나머지 미접촉)`)
  if (errors.length > 0) {
    console.log('\n실패 목록:')
    errors.forEach(e => console.log(`  - ${e.title}: ${e.error}`))
  }

  await prisma.$disconnect()
}
main()
