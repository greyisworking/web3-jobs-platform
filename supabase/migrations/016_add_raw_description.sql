-- Add raw_description column to preserve original description text
-- The description field will contain the formatted/cleaned version
-- The raw_description field preserves the original for reference

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS raw_description TEXT;

-- Create index for jobs that have raw_description (for migration tracking)
CREATE INDEX IF NOT EXISTS idx_job_has_raw_description
ON "Job" ((raw_description IS NOT NULL))
WHERE raw_description IS NOT NULL;

COMMENT ON COLUMN "Job".raw_description IS 'Original unformatted job description text (preserved for reference)';
COMMENT ON COLUMN "Job".description IS 'Formatted/cleaned job description in markdown format';
