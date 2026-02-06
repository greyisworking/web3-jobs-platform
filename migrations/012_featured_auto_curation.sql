-- Featured Auto-Curation: Add scoring columns and index
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS featured_score INTEGER DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS featured_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_featured_composite
  ON "Job"(featured_pinned DESC, featured_score DESC) WHERE "isActive" = TRUE;
