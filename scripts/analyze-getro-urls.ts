import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Known priority companies (from lib/priority-companies.ts)
const PRIORITY_COMPANIES = new Set([
  'uniswap', 'alchemy', 'offchain labs', 'arbitrum foundation', 'base', 'aptos labs',
  'fireblocks', 'kraken', 'celestia', 'layerzero', 'ava labs', 'cosmos labs', 'phantom',
  'nansen', 'immutable', 'openzeppelin', 'helius', 'zora', 'aztec', 'quicknode',
  'anchorage digital', 'anchorage', 'li.fi', 'lifi'
])

function normalizeCompany(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return 'invalid'
  }
}

function categorizeUrl(url: string): string {
  const domain = extractDomain(url)
  if (domain.includes('greenhouse.io')) return 'greenhouse'
  if (domain.includes('lever.co')) return 'lever'
  if (domain.includes('ashbyhq.com')) return 'ashby'
  if (domain.includes('workday.com')) return 'workday'
  if (domain.includes('smartrecruiters.com')) return 'smartrecruiters'
  if (domain.includes('jobvite.com')) return 'jobvite'
  if (domain.includes('bamboohr.com')) return 'bamboohr'
  if (domain.includes('wellfound.com') || domain.includes('angel.co')) return 'wellfound'
  if (domain.includes('linkedin.com')) return 'linkedin'
  if (domain.includes('indeed.com')) return 'indeed'
  if (domain.includes('notion.site') || domain.includes('notion.so')) return 'notion'
  return 'custom'
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const getroSources = [
    'jobs.solana.com',
    'jobs.arbitrum.io',
    'jobs.avax.network',
    'jobs.sui.io'
  ]

  console.log('=' .repeat(70))
  console.log('📊 Getro 보드 URL 분석')
  console.log('='.repeat(70))

  for (const source of getroSources) {
    const { data: jobs } = await supabase
      .from('Job')
      .select('company, url, description')
      .eq('isActive', true)
      .eq('source', source)
      .limit(1000)

    if (!jobs || jobs.length === 0) continue

    console.log(`\n\n🌐 ${source} (${jobs.length} jobs)`)
    console.log('-'.repeat(50))

    // Category stats
    const categoryStats = new Map<string, { count: number; withDesc: number; companies: Map<string, number> }>()
    const companyStats = new Map<string, { count: number; category: string; withDesc: number; url: string }>()

    for (const job of jobs) {
      const category = categorizeUrl(job.url)
      const hasDesc = job.description && job.description.length > 50

      if (!categoryStats.has(category)) {
        categoryStats.set(category, { count: 0, withDesc: 0, companies: new Map() })
      }
      const catStat = categoryStats.get(category)!
      catStat.count++
      if (hasDesc) catStat.withDesc++

      const companyName = job.company
      if (!catStat.companies.has(companyName)) {
        catStat.companies.set(companyName, 0)
      }
      catStat.companies.set(companyName, catStat.companies.get(companyName)! + 1)

      if (!companyStats.has(companyName)) {
        companyStats.set(companyName, { count: 0, category, withDesc: 0, url: job.url })
      }
      companyStats.get(companyName)!.count++
      if (hasDesc) companyStats.get(companyName)!.withDesc++
    }

    // Print category summary
    console.log('\n📂 URL 카테고리별 분포:')
    const sortedCategories = Array.from(categoryStats.entries()).sort((a, b) => b[1].count - a[1].count)
    for (const [cat, stat] of sortedCategories) {
      const pct = ((stat.count / jobs.length) * 100).toFixed(0)
      const descPct = ((stat.withDesc / stat.count) * 100).toFixed(0)
      console.log(`  ${cat.padEnd(18)} ${String(stat.count).padStart(4)} jobs (${pct}%) | desc: ${descPct}%`)
    }

    // Companies NOT in priority list
    console.log('\n🔍 Priority에 없는 주요 회사 (공고수 5개 이상):')
    const sortedCompanies = Array.from(companyStats.entries())
      .filter(([name]) => !PRIORITY_COMPANIES.has(normalizeCompany(name)))
      .filter(([, stat]) => stat.count >= 5)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)

    for (const [company, stat] of sortedCompanies) {
      const descStatus = stat.withDesc > 0 ? '✅' : '❌'
      const domain = extractDomain(stat.url)
      console.log(`  ${descStatus} ${company.padEnd(30)} ${String(stat.count).padStart(3)} jobs | ${stat.category.padEnd(12)} | ${domain}`)
    }

    // Already covered by priority
    const coveredCompanies = Array.from(companyStats.entries())
      .filter(([name]) => PRIORITY_COMPANIES.has(normalizeCompany(name)))
      .sort((a, b) => b[1].count - a[1].count)

    if (coveredCompanies.length > 0) {
      console.log('\n✅ Priority로 이미 커버되는 회사:')
      for (const [company, stat] of coveredCompanies) {
        const descStatus = stat.withDesc > 0 ? '✅' : '❌'
        console.log(`  ${descStatus} ${company.padEnd(30)} ${String(stat.count).padStart(3)} jobs`)
      }
    }
  }

  // Summary: All companies across Getro boards that use supported ATS
  console.log('\n\n' + '='.repeat(70))
  console.log('📋 전체 Getro 보드에서 ATS 사용 회사 중 Priority 미등록')
  console.log('='.repeat(70))

  const { data: allGetroJobs } = await supabase
    .from('Job')
    .select('company, url, description, source')
    .eq('isActive', true)
    .in('source', getroSources)
    .limit(2000)

  if (allGetroJobs) {
    const allCompanyStats = new Map<string, { count: number; category: string; withDesc: number; url: string; sources: Set<string> }>()

    for (const job of allGetroJobs) {
      const category = categorizeUrl(job.url)
      const hasDesc = job.description && job.description.length > 50
      const companyName = job.company

      if (!allCompanyStats.has(companyName)) {
        allCompanyStats.set(companyName, { count: 0, category, withDesc: 0, url: job.url, sources: new Set() })
      }
      const stat = allCompanyStats.get(companyName)!
      stat.count++
      if (hasDesc) stat.withDesc++
      stat.sources.add(job.source)
    }

    // Filter: uses ATS, not in priority, 3+ jobs
    const atsCompanies = Array.from(allCompanyStats.entries())
      .filter(([name, stat]) =>
        !PRIORITY_COMPANIES.has(normalizeCompany(name)) &&
        ['greenhouse', 'lever', 'ashby'].includes(stat.category) &&
        stat.count >= 3
      )
      .sort((a, b) => b[1].count - a[1].count)

    console.log(`\n총 ${atsCompanies.length}개 회사 발견 (ATS 사용 & Priority 미등록 & 3+ jobs):\n`)

    for (const [company, stat] of atsCompanies.slice(0, 30)) {
      const descStatus = stat.withDesc > 0 ? '✅' : '❌'
      const _sources = Array.from(stat.sources).join(', ')

      // Extract board token from URL
      let token = ''
      try {
        const u = new URL(stat.url)
        if (stat.category === 'greenhouse') {
          // boards.greenhouse.io/{token}/jobs/xxx or job-boards.greenhouse.io/{token}/jobs/xxx
          const parts = u.pathname.split('/').filter(Boolean)
          token = parts[0] || ''
        } else if (stat.category === 'lever') {
          // jobs.lever.co/{token}/xxx
          const parts = u.pathname.split('/').filter(Boolean)
          token = parts[0] || ''
        } else if (stat.category === 'ashby') {
          // jobs.ashbyhq.com/{token}/xxx
          const parts = u.pathname.split('/').filter(Boolean)
          token = parts[0] || ''
        }
      } catch {}

      console.log(`  ${descStatus} ${company.padEnd(28)} ${String(stat.count).padStart(3)} jobs | ${stat.category.padEnd(10)} | token: ${token}`)
    }

    // Summary stats
    const totalGetro = allGetroJobs.length
    const withDesc = allGetroJobs.filter(j => j.description && j.description.length > 50).length
    const byAts = {
      greenhouse: allGetroJobs.filter(j => categorizeUrl(j.url) === 'greenhouse').length,
      lever: allGetroJobs.filter(j => categorizeUrl(j.url) === 'lever').length,
      ashby: allGetroJobs.filter(j => categorizeUrl(j.url) === 'ashby').length,
      custom: allGetroJobs.filter(j => categorizeUrl(j.url) === 'custom').length,
    }

    console.log('\n' + '-'.repeat(50))
    console.log('📊 전체 Getro 보드 통계:')
    console.log(`  총 공고: ${totalGetro}`)
    console.log(`  Description 있음: ${withDesc} (${((withDesc / totalGetro) * 100).toFixed(1)}%)`)
    console.log(`  Greenhouse: ${byAts.greenhouse} (${((byAts.greenhouse / totalGetro) * 100).toFixed(1)}%)`)
    console.log(`  Lever: ${byAts.lever} (${((byAts.lever / totalGetro) * 100).toFixed(1)}%)`)
    console.log(`  Ashby: ${byAts.ashby} (${((byAts.ashby / totalGetro) * 100).toFixed(1)}%)`)
    console.log(`  Custom/기타: ${byAts.custom} (${((byAts.custom / totalGetro) * 100).toFixed(1)}%)`)
  }
}

main().catch(console.error)
