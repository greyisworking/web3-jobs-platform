/**
 * Migration script to add 'role' column to the Job table
 *
 * Usage:
 *   npx ts-node scripts/migrate-add-role.ts
 *
 * For Supabase, run this SQL in the dashboard:
 *
 * ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "role" TEXT;
 * CREATE INDEX IF NOT EXISTS "Job_role_idx" ON "Job"("role");
 *
 * For Prisma/SQLite:
 *   npx prisma migrate dev --name add-role-field
 */

import 'dotenv/config'

console.log(`
=============================================================
📋 Migration: Add 'role' column to Job table
=============================================================

For SUPABASE, run this SQL in your Supabase dashboard:

  ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "role" TEXT;
  CREATE INDEX IF NOT EXISTS "Job_role_idx" ON "Job"("role");

For PRISMA/SQLite, run:

  npx prisma migrate dev --name add-role-field

After migration, run the backfill script:

  npx ts-node scripts/test-role-filter.ts --backfill

=============================================================
`)
