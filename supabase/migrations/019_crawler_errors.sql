-- Crawler Errors table for monitoring and debugging
CREATE TABLE IF NOT EXISTS "CrawlerErrors" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  error_type TEXT NOT NULL CHECK (error_type IN ('network', 'parse', 'validation', 'auth', 'rate_limit', 'unknown')),
  message TEXT NOT NULL,
  url TEXT,
  status_code INT,
  stack TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by source and time
CREATE INDEX IF NOT EXISTS idx_crawler_errors_source ON "CrawlerErrors"(source);
CREATE INDEX IF NOT EXISTS idx_crawler_errors_created_at ON "CrawlerErrors"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawler_errors_type ON "CrawlerErrors"(error_type);

-- Auto-cleanup old errors (keep 7 days)
-- Run periodically via cron or edge function
CREATE OR REPLACE FUNCTION cleanup_old_crawler_errors()
RETURNS void AS $$
BEGIN
  DELETE FROM "CrawlerErrors"
  WHERE created_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
