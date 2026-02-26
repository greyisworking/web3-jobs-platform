/**
 * Run SQL migration against Supabase
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function runMigration(migrationFile: string) {
  const filePath = path.resolve(migrationFile)

  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(filePath, 'utf8')

  console.log(`Running migration: ${path.basename(filePath)}`)
  console.log('---')

  // Split by semicolons but keep CREATE FUNCTION blocks intact
  const statements = sql
    .split(/;(?=\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|--|\n\n|$))/i)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const statement of statements) {
    if (!statement || statement.startsWith('--')) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

      if (error) {
        // Check if it's a "already exists" error - that's okay
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate key')) {
          console.log(`⏭️  Skipped (already exists): ${statement.substring(0, 60)}...`)
          skipCount++
        } else {
          console.error(`❌ Error: ${error.message}`)
          console.error(`   Statement: ${statement.substring(0, 100)}...`)
          errorCount++
        }
      } else {
        console.log(`✅ Success: ${statement.substring(0, 60)}...`)
        successCount++
      }
    } catch (err) {
      // Direct SQL execution if rpc doesn't exist
      const { error: _error } = await supabase.from('_migrations').select().limit(0)
      console.error(`Error executing: ${statement.substring(0, 60)}...`)
      errorCount++
    }
  }

  console.log('---')
  console.log(`Migration complete: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`)
}

const migrationFile = process.argv[2] || 'supabase/migrations/002_email_alerts_and_applications.sql'
runMigration(migrationFile)
