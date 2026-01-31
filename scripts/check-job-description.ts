import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Get a specific job with description
  const { data: jobs } = await supabase
    .from('Job')
    .select('id, title, company, description')
    .eq('isActive', true)
    .not('description', 'is', null)
    .limit(3)

  console.log('=== JOBS WITH DESCRIPTION ===\n')

  for (const job of jobs || []) {
    console.log('ID:', job.id)
    console.log('Title:', job.title)
    console.log('Company:', job.company)
    console.log('Description type:', typeof job.description)
    console.log('Description length:', job.description?.length || 0)
    console.log('Has content:', job.description && job.description.length > 0 ? 'YES' : 'NO')
    console.log('First 150 chars:', job.description?.substring(0, 150))
    console.log('---\n')
  }
}

check()
