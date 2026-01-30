-- ════════════════════════════════════════════════════════════════════════════
-- Community Trust System Schema
-- Vouch, Report, Vote, and TrustLog tables for decentralized moderation
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- VOUCH TABLE
-- Users can vouch for other users to increase their trust score
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vouches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_wallet TEXT NOT NULL,           -- Who is vouching
  vouchee_wallet TEXT NOT NULL,           -- Who is being vouched for
  message TEXT,                           -- Optional message
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate vouches
  UNIQUE(voucher_wallet, vouchee_wallet),

  -- Can't vouch for yourself
  CONSTRAINT no_self_vouch CHECK (voucher_wallet != vouchee_wallet)
);

CREATE INDEX idx_vouches_voucher ON vouches(voucher_wallet);
CREATE INDEX idx_vouches_vouchee ON vouches(vouchee_wallet);
CREATE INDEX idx_vouches_created ON vouches(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- REPORT TABLE
-- Users can report suspicious activity or scams
-- ────────────────────────────────────────────────────────────────────────────
CREATE TYPE report_category AS ENUM (
  'scam',
  'fake_job',
  'impersonation',
  'spam',
  'harassment',
  'other'
);

CREATE TYPE report_status AS ENUM (
  'pending',          -- Initial state
  'under_review',     -- Being reviewed
  'voting',           -- Community voting in progress
  'resolved_guilty',  -- Voted guilty, action taken
  'resolved_innocent', -- Voted not guilty
  'dismissed'         -- Report was invalid/false
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_wallet TEXT NOT NULL,          -- Who is reporting
  target_wallet TEXT NOT NULL,            -- Who/what is being reported
  target_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'job', 'company'
  target_id TEXT,                         -- Optional ID (job_id, etc.)
  category report_category NOT NULL,
  reason TEXT NOT NULL,
  evidence_urls TEXT[],                   -- Links to evidence
  status report_status DEFAULT 'pending',
  vote_id UUID,                           -- Reference to vote if voting started
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Can't report yourself
  CONSTRAINT no_self_report CHECK (reporter_wallet != target_wallet)
);

CREATE INDEX idx_reports_reporter ON reports(reporter_wallet);
CREATE INDEX idx_reports_target ON reports(target_wallet);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- VOTE TABLE
-- Community voting for disputed reports
-- ────────────────────────────────────────────────────────────────────────────
CREATE TYPE vote_decision AS ENUM ('guilty', 'not_guilty', 'abstain');

CREATE TABLE IF NOT EXISTS community_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_wallet TEXT NOT NULL,            -- Who is being voted on
  target_type TEXT NOT NULL DEFAULT 'user',
  report_ids UUID[] NOT NULL,             -- Which reports triggered this vote
  title TEXT NOT NULL,
  description TEXT,

  -- Voting period
  voting_starts_at TIMESTAMPTZ DEFAULT NOW(),
  voting_ends_at TIMESTAMPTZ NOT NULL,    -- Usually 48-72 hours

  -- Results
  votes_guilty INT DEFAULT 0,
  votes_not_guilty INT DEFAULT 0,
  votes_abstain INT DEFAULT 0,
  total_voters INT DEFAULT 0,

  -- Final result
  result vote_decision,
  result_finalized_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_votes_target ON community_votes(target_wallet);
CREATE INDEX idx_votes_active ON community_votes(voting_ends_at) WHERE result IS NULL;

-- Individual vote records
CREATE TABLE IF NOT EXISTS vote_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id UUID NOT NULL REFERENCES community_votes(id) ON DELETE CASCADE,
  voter_wallet TEXT NOT NULL,
  decision vote_decision NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One vote per person per vote
  UNIQUE(vote_id, voter_wallet)
);

CREATE INDEX idx_vote_records_vote ON vote_records(vote_id);
CREATE INDEX idx_vote_records_voter ON vote_records(voter_wallet);

-- ────────────────────────────────────────────────────────────────────────────
-- TRUST LOG TABLE
-- Audit log of all trust-related actions
-- ────────────────────────────────────────────────────────────────────────────
CREATE TYPE trust_action AS ENUM (
  'vouch_given',
  'vouch_received',
  'vouch_removed',
  'report_filed',
  'report_received',
  'vote_started',
  'vote_cast',
  'vote_guilty',
  'vote_not_guilty',
  'blacklisted',
  'unblacklisted',
  'score_increased',
  'score_decreased'
);

CREATE TABLE IF NOT EXISTS trust_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet TEXT NOT NULL,
  action trust_action NOT NULL,
  related_wallet TEXT,                    -- Other party involved
  related_id UUID,                        -- Related vote/report/vouch ID
  reason TEXT,
  score_change INT DEFAULT 0,             -- How much trust score changed
  metadata JSONB DEFAULT '{}',            -- Additional data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_logs_wallet ON trust_logs(wallet);
CREATE INDEX idx_trust_logs_action ON trust_logs(action);
CREATE INDEX idx_trust_logs_created ON trust_logs(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- BLACKLIST TABLE
-- Users who have been blacklisted by community vote
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  vote_id UUID REFERENCES community_votes(id),
  blacklisted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                 -- NULL = permanent
  lifted_at TIMESTAMPTZ,
  lifted_reason TEXT
);

CREATE INDEX idx_blacklist_wallet ON blacklist(wallet);
CREATE INDEX idx_blacklist_active ON blacklist(wallet) WHERE lifted_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- TRUST SCORE CACHE
-- Cached trust scores for quick lookup
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trust_scores (
  wallet TEXT PRIMARY KEY,
  score INT DEFAULT 50,                   -- Base score is 50
  vouch_count INT DEFAULT 0,
  vouched_by_count INT DEFAULT 0,
  reports_filed INT DEFAULT 0,
  reports_against INT DEFAULT 0,
  votes_participated INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ────────────────────────────────────────────────────────────────────────────

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(p_wallet TEXT)
RETURNS INT AS $$
DECLARE
  v_score INT := 50;  -- Base score
  v_vouches_received INT;
  v_vouches_given INT;
  v_reports_against INT;
  v_successful_reports INT;
  v_is_blacklisted BOOLEAN;
BEGIN
  -- Check if blacklisted
  SELECT EXISTS(
    SELECT 1 FROM blacklist
    WHERE wallet = p_wallet AND lifted_at IS NULL
  ) INTO v_is_blacklisted;

  IF v_is_blacklisted THEN
    RETURN 0;
  END IF;

  -- Count vouches received (+5 per vouch, max +50)
  SELECT COUNT(*) INTO v_vouches_received
  FROM vouches WHERE vouchee_wallet = p_wallet;
  v_score := v_score + LEAST(v_vouches_received * 5, 50);

  -- Count vouches given (+1 per vouch, max +10)
  SELECT COUNT(*) INTO v_vouches_given
  FROM vouches WHERE voucher_wallet = p_wallet;
  v_score := v_score + LEAST(v_vouches_given, 10);

  -- Count reports against (-10 per pending/voting, -20 per guilty)
  SELECT COUNT(*) INTO v_reports_against
  FROM reports
  WHERE target_wallet = p_wallet
    AND status IN ('pending', 'under_review', 'voting');
  v_score := v_score - (v_reports_against * 10);

  -- Successful reports filed (+2 per report that led to action)
  SELECT COUNT(*) INTO v_successful_reports
  FROM reports
  WHERE reporter_wallet = p_wallet
    AND status = 'resolved_guilty';
  v_score := v_score + LEAST(v_successful_reports * 2, 20);

  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- Function to check if voting should start (5+ reports)
CREATE OR REPLACE FUNCTION check_voting_threshold()
RETURNS TRIGGER AS $$
DECLARE
  v_report_count INT;
  v_vote_id UUID;
BEGIN
  -- Count pending reports against this target
  SELECT COUNT(*) INTO v_report_count
  FROM reports
  WHERE target_wallet = NEW.target_wallet
    AND target_type = NEW.target_type
    AND status = 'pending';

  -- If 5+ reports, start community voting
  IF v_report_count >= 5 THEN
    -- Create vote
    INSERT INTO community_votes (
      target_wallet,
      target_type,
      report_ids,
      title,
      description,
      voting_ends_at
    )
    SELECT
      NEW.target_wallet,
      NEW.target_type,
      ARRAY_AGG(id),
      'Community Review: ' || NEW.target_wallet,
      'This account has received multiple reports and requires community review.',
      NOW() + INTERVAL '48 hours'
    FROM reports
    WHERE target_wallet = NEW.target_wallet
      AND target_type = NEW.target_type
      AND status = 'pending'
    RETURNING id INTO v_vote_id;

    -- Update all pending reports to voting status
    UPDATE reports
    SET status = 'voting', vote_id = v_vote_id, updated_at = NOW()
    WHERE target_wallet = NEW.target_wallet
      AND target_type = NEW.target_type
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_voting_threshold
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_voting_threshold();

-- Function to update trust score cache
CREATE OR REPLACE FUNCTION update_trust_score_cache(p_wallet TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO trust_scores (wallet, score, last_calculated_at, updated_at)
  VALUES (
    p_wallet,
    calculate_trust_score(p_wallet),
    NOW(),
    NOW()
  )
  ON CONFLICT (wallet) DO UPDATE
  SET
    score = calculate_trust_score(p_wallet),
    vouch_count = (SELECT COUNT(*) FROM vouches WHERE voucher_wallet = p_wallet),
    vouched_by_count = (SELECT COUNT(*) FROM vouches WHERE vouchee_wallet = p_wallet),
    reports_filed = (SELECT COUNT(*) FROM reports WHERE reporter_wallet = p_wallet),
    reports_against = (SELECT COUNT(*) FROM reports WHERE target_wallet = p_wallet),
    is_blacklisted = EXISTS(SELECT 1 FROM blacklist WHERE wallet = p_wallet AND lifted_at IS NULL),
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;

-- Public read access for transparency
CREATE POLICY "Public read vouches" ON vouches FOR SELECT USING (true);
CREATE POLICY "Public read reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Public read votes" ON community_votes FOR SELECT USING (true);
CREATE POLICY "Public read vote_records" ON vote_records FOR SELECT USING (true);
CREATE POLICY "Public read trust_logs" ON trust_logs FOR SELECT USING (true);
CREATE POLICY "Public read blacklist" ON blacklist FOR SELECT USING (true);
CREATE POLICY "Public read trust_scores" ON trust_scores FOR SELECT USING (true);

-- Insert policies (will be handled by API with wallet verification)
CREATE POLICY "Authenticated insert vouches" ON vouches FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert vote_records" ON vote_records FOR INSERT WITH CHECK (true);
