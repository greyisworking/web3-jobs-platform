-- Company Dashboard Migration
-- Run this SQL in the Supabase SQL Editor

-- 1. Companies table (for company accounts)
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  website text,
  description text,
  industry text,
  size text, -- '1-10', '11-50', '51-200', '201-500', '500+'
  location text,
  founded_year integer,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Add company_id to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS apply_count integer DEFAULT 0;

-- 3. Job applications table (for tracking)
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  applicant_email text,
  applicant_name text,
  resume_url text,
  cover_letter text,
  status text DEFAULT 'pending', -- pending, reviewed, contacted, rejected
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Job views tracking (for analytics)
CREATE TABLE IF NOT EXISTS job_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  viewer_ip text,
  user_agent text,
  referrer text,
  viewed_at timestamp with time zone DEFAULT now()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_job_company_id ON "Job"(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at);

-- 6. RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- Companies: users can only see/edit their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job applications: company owners can see applications for their jobs
CREATE POLICY "Company owners can view applications" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Job" j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = job_applications.job_id
      AND c.user_id = auth.uid()
    )
  );

-- 7. Function to increment view count
CREATE OR REPLACE FUNCTION increment_job_view(p_job_id text)
RETURNS void AS $$
BEGIN
  UPDATE "Job" SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;
