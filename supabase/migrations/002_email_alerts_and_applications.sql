-- Email Alerts: Users can subscribe to job alerts based on filters
CREATE TABLE IF NOT EXISTS job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  -- Alert filters (optional - null means "any")
  keywords TEXT[], -- e.g., ['solidity', 'rust', 'defi']
  categories TEXT[], -- e.g., ['Engineering', 'Product']
  regions TEXT[], -- e.g., ['Global', 'Korea']
  min_salary INT, -- minimum salary filter
  -- Alert settings
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'instant')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Tracking
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for job_alerts
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON job_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
  ON job_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON job_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON job_alerts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX idx_job_alerts_is_active ON job_alerts(is_active);
CREATE INDEX idx_job_alerts_frequency ON job_alerts(frequency);

-- Application Tracking: Users can track their job applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL, -- References Job table
  -- Application status
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN (
    'interested', -- saved/interested but not applied
    'applied', -- submitted application
    'phone_screen', -- phone screen scheduled/completed
    'interview', -- interview stage
    'offer', -- received offer
    'accepted', -- accepted offer
    'rejected', -- rejected by company
    'withdrawn' -- withdrawn by user
  )),
  -- Application details
  applied_at TIMESTAMPTZ,
  notes TEXT, -- user's personal notes
  resume_url TEXT, -- uploaded resume for this application
  cover_letter TEXT,
  -- Interview tracking
  next_step TEXT, -- e.g., "Technical interview on 2/25"
  next_step_date TIMESTAMPTZ,
  -- Outcome
  salary_offered TEXT,
  rejection_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Ensure one entry per user per job
  UNIQUE(user_id, job_id)
);

-- RLS for job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON job_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON job_applications FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at);

-- Application history/timeline for tracking status changes
CREATE TABLE IF NOT EXISTS application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_application_history_app_id ON application_history(application_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_job_alerts_updated_at
  BEFORE UPDATE ON job_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log application status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_history (application_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_application_status
  AFTER UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_application_status_change();
