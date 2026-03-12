-- Add wallet_address to profiles table for SIWE (Sign-In with Ethereum) support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address);
