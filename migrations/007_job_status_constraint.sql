-- 상태값 제약 조건 추가 (데이터 무결성)
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS job_status_check;
ALTER TABLE "Job" ADD CONSTRAINT job_status_check
  CHECK (status IN ('pending', 'active', 'expired', 'hidden'));

-- 기본값을 'pending'으로 설정
ALTER TABLE "Job" ALTER COLUMN status SET DEFAULT 'pending';

-- 인덱스 (이미 존재할 수 있음)
CREATE INDEX IF NOT EXISTS idx_jobs_status ON "Job"(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON "Job"(status, "crawledAt" DESC);
