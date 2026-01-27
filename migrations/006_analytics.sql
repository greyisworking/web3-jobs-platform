-- Search Query Analytics & Audit Trail
-- Run this SQL in the Supabase SQL Editor

-- 1. Search queries table
CREATE TABLE search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  user_id uuid,
  session_id text,
  results_count integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_search_queries_created ON search_queries(created_at DESC);
CREATE INDEX idx_search_queries_query ON search_queries(query);

-- 2. Admin audit trail
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admins(id),
  action text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
