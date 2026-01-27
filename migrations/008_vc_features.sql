-- ============================================================================
-- Migration 008: VC-Based Job Platform Differentiation Features
-- ============================================================================
-- Run this migration in Supabase SQL Editor
--
-- Purpose: Add backers, sector, office_location, and badges columns
--          to enable VC-backed company tracking and badge-based filtering
-- ============================================================================

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS backers TEXT[] DEFAULT '{}';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS office_location TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_jobs_sector ON "Job"(sector);
CREATE INDEX IF NOT EXISTS idx_jobs_badges ON "Job" USING GIN(badges);
CREATE INDEX IF NOT EXISTS idx_jobs_backers ON "Job" USING GIN(backers);
