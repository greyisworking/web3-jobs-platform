-- Migration: Create CrawlerQualityLog table for tracking crawler quality over time
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS "CrawlerQualityLog" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  jd_success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  company_success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  html_error_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  quality_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_crawler_quality_log_source ON "CrawlerQualityLog" (source);
CREATE INDEX IF NOT EXISTS idx_crawler_quality_log_created_at ON "CrawlerQualityLog" (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawler_quality_log_source_date ON "CrawlerQualityLog" (source, created_at DESC);

-- Enable RLS (optional, admin-only access)
ALTER TABLE "CrawlerQualityLog" ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read
CREATE POLICY "Allow authenticated read" ON "CrawlerQualityLog"
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can insert (for automated scripts)
CREATE POLICY "Allow service role insert" ON "CrawlerQualityLog"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE "CrawlerQualityLog" IS 'Daily crawler quality metrics for trend tracking';
