-- =============================================
-- 1. Bookmarks table for user saved jobs
-- =============================================

create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id text not null,
  created_at timestamptz default now() not null,
  unique(user_id, job_id)
);

-- Enable RLS
alter table bookmarks enable row level security;

-- Users can view their own bookmarks
create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

-- Users can insert their own bookmarks
create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

-- Users can delete their own bookmarks
create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists idx_bookmarks_user_id on bookmarks(user_id);
create index if not exists idx_bookmarks_job_id on bookmarks(job_id);

-- =============================================
-- 2. Add status and last_validated to Job table
-- =============================================

-- Add status column (active, expired, error)
alter table "Job" add column if not exists status text default 'active';

-- Add last_validated timestamp
alter table "Job" add column if not exists last_validated timestamptz;

-- Index for status filtering
create index if not exists idx_job_status on "Job"(status);
