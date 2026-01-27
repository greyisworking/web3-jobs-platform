-- Monitoring Dashboard Migration
-- Run this SQL in the Supabase SQL Editor

-- 1. Error logs table (separate from CrawlLog for structured error tracking)
CREATE TABLE error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamp with time zone DEFAULT now(),
  level text NOT NULL DEFAULT 'ERROR',
  message text NOT NULL,
  crawler_name text,
  stack_trace text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_level ON error_logs(level);
CREATE INDEX idx_error_logs_crawler ON error_logs(crawler_name);

-- 2. Proxy status table
CREATE TABLE proxy_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proxy_url text NOT NULL,
  status text DEFAULT 'active',
  latency_ms integer,
  success_rate decimal,
  last_used timestamp with time zone,
  last_checked timestamp with time zone DEFAULT now(),
  total_requests integer DEFAULT 0,
  failed_requests integer DEFAULT 0
);

CREATE INDEX idx_proxy_status_status ON proxy_status(status);

-- 3. Crawl runs table
CREATE TABLE crawl_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status text DEFAULT 'running',
  jobs_found integer DEFAULT 0,
  jobs_saved integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  crawler_name text
);

CREATE INDEX idx_crawl_runs_started ON crawl_runs(started_at DESC);
CREATE INDEX idx_crawl_runs_status ON crawl_runs(status);
CREATE INDEX idx_crawl_runs_crawler ON crawl_runs(crawler_name);
