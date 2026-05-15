-- Migration: Create CrawlLog table + add lastSeenAt to Job
-- Date: 2026-04-09
-- Context: CrawlLog was defined in Prisma (SQLite) but never created in Supabase.
--          lastSeenAt enables stale job expiration.

-- 1. Create CrawlLog table
CREATE TABLE IF NOT EXISTS "CrawlLog" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source     TEXT NOT NULL,
  status     TEXT NOT NULL,  -- 'success' | 'failed'
  "jobCount" INTEGER NOT NULL DEFAULT 0,
  error      TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crawllog_source ON "CrawlLog" (source);
CREATE INDEX IF NOT EXISTS idx_crawllog_created_at ON "CrawlLog" ("createdAt");

-- 2. Add lastSeenAt to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMPTZ;

-- Backfill: set lastSeenAt = crawledAt for existing rows
UPDATE "Job" SET "lastSeenAt" = "crawledAt" WHERE "lastSeenAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_job_last_seen_at ON "Job" ("lastSeenAt");
