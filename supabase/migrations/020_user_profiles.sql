-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  twitter TEXT,
  github TEXT,
  linkedin TEXT,
  skills TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  is_open_to_work BOOLEAN DEFAULT false,
  preferred_roles TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public profiles (open to work) are visible to all
CREATE POLICY "Public profiles visible"
  ON profiles FOR SELECT
  USING (is_open_to_work = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_open_to_work ON profiles(is_open_to_work);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING GIN(skills);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
