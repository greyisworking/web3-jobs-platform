-- Create JobReport table for job reporting functionality
CREATE TABLE IF NOT EXISTS "JobReport" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "jobId" UUID NOT NULL REFERENCES "Job"(id) ON DELETE CASCADE,
    "reporterWallet" TEXT,
    "reporterIp" TEXT,
    reason TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_job_report_job_id ON "JobReport"("jobId");
CREATE INDEX IF NOT EXISTS idx_job_report_reporter_wallet ON "JobReport"("reporterWallet");
CREATE INDEX IF NOT EXISTS idx_job_report_created_at ON "JobReport"("createdAt");

-- Add comment
COMMENT ON TABLE "JobReport" IS 'Job reports submitted by users';
