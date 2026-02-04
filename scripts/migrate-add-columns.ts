import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  console.log('🚀 Starting migration to add enhanced job columns...')

  const columns = [
    { name: 'requirements', type: 'TEXT' },
    { name: 'responsibilities', type: 'TEXT' },
    { name: 'benefits', type: 'TEXT' },
    { name: 'salaryMin', type: 'INTEGER' },
    { name: 'salaryMax', type: 'INTEGER' },
    { name: 'salaryCurrency', type: 'TEXT' },
    { name: 'deadline', type: 'TIMESTAMPTZ' },
    { name: 'experienceLevel', type: 'TEXT' },
    { name: 'remoteType', type: 'TEXT' },
    { name: 'companyLogo', type: 'TEXT' },
    { name: 'companyWebsite', type: 'TEXT' },
  ]

  // Generate SQL
  const sql = columns.map(col =>
    `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};`
  ).join('\n')

  console.log('\n📝 SQL to execute:')
  console.log(sql)
  console.log('\n⚠️  Please run this SQL in Supabase Dashboard > SQL Editor')
  console.log('URL: https://supabase.com/dashboard/project/wulqajhurkvsvdvcvsmo/sql/new')
}

migrate()
