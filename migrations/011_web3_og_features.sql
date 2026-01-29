-- Web3 OG Features Migration
-- Run this SQL in the Supabase SQL Editor

-- 1. On-chain Reputation / Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  badge_type text NOT NULL, -- 'og_degen', 'nft_collector', 'dao_contributor', 'defi_native', 'builder'
  badge_data jsonb DEFAULT '{}', -- Store badge-specific data
  earned_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone,
  UNIQUE(wallet_address, badge_type)
);

-- 2. User Profiles (Web3 enhanced)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  ens_name text,
  farcaster_username text,
  farcaster_fid integer,
  lens_handle text,
  display_name text,
  bio text,
  avatar_url text,
  twitter_handle text,
  github_username text,
  first_tx_date timestamp with time zone, -- For OG calculation
  total_tx_count integer DEFAULT 0,
  nft_count integer DEFAULT 0,
  dao_votes integer DEFAULT 0,
  defi_protocols_used integer DEFAULT 0,
  contracts_deployed integer DEFAULT 0,
  reputation_score integer DEFAULT 0,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Token Gating
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS token_gate jsonb;
-- Format: { "type": "erc20|erc721|erc1155", "contract": "0x...", "minBalance": 1, "chainId": 1 }
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS is_alpha boolean DEFAULT false;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS holder_only_until timestamp with time zone;

-- 4. Bounties
CREATE TABLE IF NOT EXISTS bounties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  reward_amount numeric NOT NULL,
  reward_token text DEFAULT 'ETH', -- ETH, USDC, etc.
  reward_chain_id integer DEFAULT 1,
  poster_address text NOT NULL,
  poster_ens text,
  escrow_tx_hash text,
  escrow_contract text,
  status text DEFAULT 'open', -- 'open', 'in_progress', 'submitted', 'completed', 'cancelled'
  category text, -- 'development', 'design', 'content', 'research', 'other'
  skills text[],
  deadline timestamp with time zone,
  submissions_count integer DEFAULT 0,
  winner_address text,
  payout_tx_hash text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bounty_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid REFERENCES bounties(id) ON DELETE CASCADE,
  hunter_address text NOT NULL,
  hunter_ens text,
  submission_url text,
  description text,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  UNIQUE(bounty_id, hunter_address)
);

-- Bounty hunter stats
CREATE TABLE IF NOT EXISTS bounty_hunters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  ens_name text,
  bounties_completed integer DEFAULT 0,
  total_earned numeric DEFAULT 0,
  success_rate numeric DEFAULT 0,
  rank integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. DAO Jobs
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS is_dao_job boolean DEFAULT false;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS dao_name text;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS dao_logo text;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS snapshot_space text;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS min_votes_required integer;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS min_proposals_required integer;

-- 6. POAP / Credentials
CREATE TABLE IF NOT EXISTS user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  credential_type text NOT NULL, -- 'poap', 'neun_badge'
  credential_id text, -- POAP event ID or internal badge ID
  title text NOT NULL,
  description text,
  image_url text,
  metadata jsonb DEFAULT '{}',
  issued_at timestamp with time zone DEFAULT now(),
  UNIQUE(wallet_address, credential_type, credential_id)
);

-- NEUN Application tracking for POAPs
CREATE TABLE IF NOT EXISTS job_applications_web3 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  applicant_address text NOT NULL,
  applicant_ens text,
  cover_letter text,
  resume_url text,
  portfolio_url text,
  status text DEFAULT 'applied', -- 'applied', 'reviewing', 'interviewed', 'offered', 'rejected'
  applied_at timestamp with time zone DEFAULT now(),
  poap_issued boolean DEFAULT false,
  UNIQUE(job_id, applicant_address)
);

-- 7. Social connections (Farcaster/Lens)
CREATE TABLE IF NOT EXISTS user_socials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  platform text NOT NULL, -- 'farcaster', 'lens'
  profile_id text,
  username text,
  display_name text,
  avatar_url text,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  verified boolean DEFAULT false,
  connected_at timestamp with time zone DEFAULT now(),
  UNIQUE(wallet_address, platform)
);

-- Mutual connections cache
CREATE TABLE IF NOT EXISTS mutual_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address text NOT NULL,
  company_id uuid,
  mutual_address text NOT NULL,
  mutual_ens text,
  platform text, -- 'farcaster', 'lens'
  relationship text, -- 'follows', 'followed_by', 'mutual'
  cached_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_address, company_id, mutual_address, platform)
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_wallet ON user_badges(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_poster ON bounties(poster_address);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_bounty ON bounty_submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_hunters_rank ON bounty_hunters(rank);
CREATE INDEX IF NOT EXISTS idx_user_credentials_wallet ON user_credentials(wallet_address);
CREATE INDEX IF NOT EXISTS idx_job_applications_web3_applicant ON job_applications_web3(applicant_address);
CREATE INDEX IF NOT EXISTS idx_user_socials_wallet ON user_socials(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mutual_connections_user ON mutual_connections(user_address);

-- 9. Functions
CREATE OR REPLACE FUNCTION update_bounty_hunter_stats(p_address text)
RETURNS void AS $$
BEGIN
  INSERT INTO bounty_hunters (wallet_address, bounties_completed, total_earned)
  SELECT
    p_address,
    COUNT(*) FILTER (WHERE bs.status = 'approved'),
    COALESCE(SUM(b.reward_amount) FILTER (WHERE bs.status = 'approved'), 0)
  FROM bounty_submissions bs
  JOIN bounties b ON b.id = bs.bounty_id
  WHERE bs.hunter_address = p_address
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    bounties_completed = EXCLUDED.bounties_completed,
    total_earned = EXCLUDED.total_earned,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Update bounty hunter rankings
CREATE OR REPLACE FUNCTION update_bounty_rankings()
RETURNS void AS $$
BEGIN
  WITH ranked AS (
    SELECT wallet_address, ROW_NUMBER() OVER (ORDER BY bounties_completed DESC, total_earned DESC) as new_rank
    FROM bounty_hunters
    WHERE bounties_completed > 0
  )
  UPDATE bounty_hunters bh
  SET rank = r.new_rank
  FROM ranked r
  WHERE bh.wallet_address = r.wallet_address;
END;
$$ LANGUAGE plpgsql;
