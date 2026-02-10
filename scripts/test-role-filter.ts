/**
 * Test script for role classification and filter functionality
 *
 * Usage:
 *   npx ts-node scripts/test-role-filter.ts
 *
 * This script:
 * 1. Tests detectRole function with sample job titles
 * 2. Checks role distribution in existing database
 * 3. Verifies filter functionality
 */

import 'dotenv/config'
import { detectRole, type RoleCategory } from './utils'
import { supabase, isSupabaseConfigured } from '../lib/supabase-script'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Test cases for detectRole function
const TEST_CASES: Array<{ title: string; expected: RoleCategory }> = [
  // Engineering
  { title: 'Senior Software Engineer', expected: 'Engineering' },
  { title: 'Blockchain Developer', expected: 'Engineering' },
  { title: 'Smart Contract Engineer', expected: 'Engineering' },
  { title: 'Frontend Developer', expected: 'Engineering' },
  { title: 'Backend Engineer (Rust)', expected: 'Engineering' },
  { title: 'Full Stack Developer', expected: 'Engineering' },
  { title: 'DevOps Engineer', expected: 'Engineering' },
  { title: 'Protocol Engineer', expected: 'Engineering' },
  { title: 'QA Engineer', expected: 'Engineering' },
  { title: 'Data Engineer', expected: 'Engineering' },
  { title: '시니어 백엔드 개발자', expected: 'Engineering' },

  // Product
  { title: 'Product Manager', expected: 'Product' },
  { title: 'Senior Product Manager - DeFi', expected: 'Product' },
  { title: 'Technical Product Manager', expected: 'Product' },
  { title: 'Product Owner', expected: 'Product' },
  { title: 'Program Manager', expected: 'Product' },
  { title: '프로덕트 매니저', expected: 'Product' },

  // Design
  { title: 'UI/UX Designer', expected: 'Design' },
  { title: 'Product Designer', expected: 'Design' },
  { title: 'Senior Visual Designer', expected: 'Design' },
  { title: 'Brand Designer', expected: 'Design' },
  { title: 'UX Researcher', expected: 'Design' },
  { title: '디자이너', expected: 'Design' },

  // Marketing/Growth
  { title: 'Marketing Manager', expected: 'Marketing/Growth' },
  { title: 'Growth Lead', expected: 'Marketing/Growth' },
  { title: 'Content Writer', expected: 'Marketing/Growth' },
  { title: 'Social Media Manager', expected: 'Marketing/Growth' },
  { title: 'SEO Specialist', expected: 'Marketing/Growth' },
  { title: 'Performance Marketing Manager', expected: 'Marketing/Growth' },
  { title: '마케팅 매니저', expected: 'Marketing/Growth' },

  // Business Development
  { title: 'Business Development Manager', expected: 'Business Development' },
  { title: 'BD Lead', expected: 'Business Development' },
  { title: 'Partnerships Manager', expected: 'Business Development' },
  { title: 'Sales Manager', expected: 'Business Development' },
  { title: 'Account Executive', expected: 'Business Development' },
  { title: 'Enterprise Sales', expected: 'Business Development' },
  { title: '사업개발 매니저', expected: 'Business Development' },

  // Operations/HR
  { title: 'Operations Manager', expected: 'Operations/HR' },
  { title: 'People Operations', expected: 'Operations/HR' },
  { title: 'HR Manager', expected: 'Operations/HR' },
  { title: 'Talent Acquisition Specialist', expected: 'Operations/HR' },
  { title: 'Recruiter', expected: 'Operations/HR' },
  { title: 'Finance Manager', expected: 'Operations/HR' },
  { title: 'Legal Counsel', expected: 'Operations/HR' },
  { title: '인사 담당자', expected: 'Operations/HR' },

  // Community/Support
  { title: 'Community Manager', expected: 'Community/Support' },
  { title: 'Developer Relations', expected: 'Community/Support' },
  { title: 'Customer Success Manager', expected: 'Community/Support' },
  { title: 'Support Engineer', expected: 'Community/Support' },
  { title: 'Developer Advocate', expected: 'Community/Support' },
  { title: 'Technical Support Specialist', expected: 'Community/Support' },
  { title: '커뮤니티 매니저', expected: 'Community/Support' },
]

async function testDetectRole(): Promise<void> {
  console.log('🧪 Testing detectRole function...\n')
  console.log('='.repeat(70))

  let passed = 0
  let failed = 0

  for (const { title, expected } of TEST_CASES) {
    const result = detectRole(title)
    const status = result === expected ? '✅' : '❌'

    if (result === expected) {
      passed++
    } else {
      failed++
      console.log(`${status} "${title}"`)
      console.log(`   Expected: ${expected}, Got: ${result}`)
    }
  }

  console.log('='.repeat(70))
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${TEST_CASES.length} tests`)

  if (failed === 0) {
    console.log('🎉 All tests passed!\n')
  } else {
    console.log('⚠️  Some tests failed. Check the detectRole function.\n')
  }
}

async function checkRoleDistribution(): Promise<void> {
  console.log('\n📈 Checking role distribution in database...\n')

  if (isSupabaseConfigured) {
    // Supabase: Get all active jobs and compute role distribution
    const { data: jobs, error } = await supabase
      .from('Job')
      .select('title, role')
      .eq('isActive', true)
      .limit(1000)

    if (error) {
      console.error('❌ Error fetching jobs from Supabase:', error.message)
      return
    }

    if (!jobs || jobs.length === 0) {
      console.log('ℹ️  No jobs found in database')
      return
    }

    // Count by role
    const roleCounts: Record<string, number> = {}
    const needsUpdate: string[] = []

    for (const job of jobs) {
      const role = job.role || detectRole(job.title)
      roleCounts[role] = (roleCounts[role] || 0) + 1

      if (!job.role) {
        needsUpdate.push(job.title)
      }
    }

    console.log('📊 Role Distribution:')
    console.log('-'.repeat(40))

    const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])
    for (const [role, count] of sortedRoles) {
      const percentage = ((count / jobs.length) * 100).toFixed(1)
      const bar = '█'.repeat(Math.round(count / jobs.length * 30))
      console.log(`${role.padEnd(22)} ${String(count).padStart(4)} (${percentage.padStart(5)}%) ${bar}`)
    }

    console.log('-'.repeat(40))
    console.log(`Total: ${jobs.length} jobs`)

    if (needsUpdate.length > 0) {
      console.log(`\n⚠️  ${needsUpdate.length} jobs need role field update`)
      console.log('Sample titles needing update:')
      for (const title of needsUpdate.slice(0, 5)) {
        console.log(`  - ${title} → ${detectRole(title)}`)
      }
    }

  } else {
    // Prisma/SQLite fallback
    try {
      const jobs = await prisma.job.findMany({
        where: { isActive: true },
        select: { title: true, role: true },
        take: 1000,
      })

      if (jobs.length === 0) {
        console.log('ℹ️  No jobs found in database')
        return
      }

      const roleCounts: Record<string, number> = {}
      const needsUpdate: string[] = []

      for (const job of jobs) {
        const role = job.role || detectRole(job.title)
        roleCounts[role] = (roleCounts[role] || 0) + 1

        if (!job.role) {
          needsUpdate.push(job.title)
        }
      }

      console.log('📊 Role Distribution:')
      console.log('-'.repeat(40))

      const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])
      for (const [role, count] of sortedRoles) {
        const percentage = ((count / jobs.length) * 100).toFixed(1)
        const bar = '█'.repeat(Math.round(count / jobs.length * 30))
        console.log(`${role.padEnd(22)} ${String(count).padStart(4)} (${percentage.padStart(5)}%) ${bar}`)
      }

      console.log('-'.repeat(40))
      console.log(`Total: ${jobs.length} jobs`)

      if (needsUpdate.length > 0) {
        console.log(`\n⚠️  ${needsUpdate.length} jobs need role field update`)
      }

    } catch (error) {
      console.error('❌ Error fetching jobs from Prisma:', error)
    }
  }
}

async function backfillRoles(): Promise<void> {
  console.log('\n🔄 Backfilling roles for existing jobs...\n')

  if (!isSupabaseConfigured) {
    console.log('⚠️  Backfill only supported for Supabase. Run npx prisma migrate for SQLite.')
    return
  }

  // Get jobs without role
  const { data: jobs, error } = await supabase
    .from('Job')
    .select('id, title, role')
    .is('role', null)
    .eq('isActive', true)
    .limit(500)

  if (error) {
    console.error('❌ Error fetching jobs:', error.message)
    return
  }

  if (!jobs || jobs.length === 0) {
    console.log('✅ All jobs already have roles assigned')
    return
  }

  console.log(`Found ${jobs.length} jobs without role. Updating...`)

  let updated = 0
  for (const job of jobs) {
    const role = detectRole(job.title)
    const { error: updateError } = await supabase
      .from('Job')
      .update({ role })
      .eq('id', job.id)

    if (updateError) {
      console.error(`❌ Failed to update ${job.id}:`, updateError.message)
    } else {
      updated++
    }
  }

  console.log(`✅ Updated ${updated}/${jobs.length} jobs with roles`)
}

async function main(): Promise<void> {
  console.log('🚀 Role Filter Test Script\n')

  const args = process.argv.slice(2)

  // Test detectRole function
  await testDetectRole()

  // Check current distribution
  await checkRoleDistribution()

  // Optional: backfill roles for existing jobs
  if (args.includes('--backfill')) {
    await backfillRoles()
  } else {
    console.log('\n💡 Tip: Run with --backfill flag to update existing jobs without roles')
  }

  console.log('\n✨ Done!')
  process.exit(0)
}

main().catch((error) => {
  console.error('🚨 Fatal error:', error)
  process.exit(1)
})
