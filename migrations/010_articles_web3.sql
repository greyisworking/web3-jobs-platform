-- Articles Web3 Upgrade Migration
-- Run this SQL in the Supabase SQL Editor

-- 1. Add Web3 columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_address text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_ens text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags text[]; -- Array of tags
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time integer DEFAULT 1;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_minted boolean DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS mint_contract text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS mint_token_id text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS collect_count integer DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tip_amount numeric DEFAULT 0;

-- 2. Article collectors table (who collected/supported)
CREATE TABLE IF NOT EXISTS article_collectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  collector_address text NOT NULL,
  collector_ens text,
  amount numeric DEFAULT 0, -- tip amount in ETH
  tx_hash text,
  collected_at timestamp with time zone DEFAULT now(),
  UNIQUE(article_id, collector_address)
);

-- 3. Article remixes/replies
CREATE TABLE IF NOT EXISTS article_remixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  remix_article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_articles_author_address ON articles(author_address);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_article_collectors_article ON article_collectors(article_id);
CREATE INDEX IF NOT EXISTS idx_article_collectors_address ON article_collectors(collector_address);

-- 5. Function to increment collect count
CREATE OR REPLACE FUNCTION increment_article_collect(p_article_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE articles SET collect_count = COALESCE(collect_count, 0) + 1 WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to add tip amount
CREATE OR REPLACE FUNCTION add_article_tip(p_article_id uuid, p_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE articles SET tip_amount = COALESCE(tip_amount, 0) + p_amount WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql;
