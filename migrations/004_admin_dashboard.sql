-- Admin Dashboard Migration
-- Run this SQL in the Supabase SQL Editor

-- 1. Admins table
CREATE TABLE admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone DEFAULT now()
);

-- 2. New columns on jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES admins(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- 3. Index for status filtering
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at DESC);

-- 4. After running this SQL, insert your Supabase Auth user into admins:
-- INSERT INTO admins (id, email) VALUES ('<your-auth-user-id>', '<your-email>');
