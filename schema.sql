-- Drop existing table if migrating from earlier schema
DROP TABLE IF EXISTS user_profiles;
DROP TYPE IF EXISTS account_type;

-- Sequences for custom IDs
CREATE SEQUENCE IF NOT EXISTS individual_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS business_id_seq START 1;

-- Individual Profiles Table
CREATE TABLE IF NOT EXISTS individual_profiles (
  custom_id TEXT PRIMARY KEY DEFAULT 'IU' || TO_CHAR(nextval('individual_id_seq'), 'FM000'),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  pincode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Business Profiles Table
CREATE TABLE IF NOT EXISTS business_profiles (
  custom_id TEXT PRIMARY KEY DEFAULT 'BU' || TO_CHAR(nextval('business_id_seq'), 'FM000'),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  pincode TEXT,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  business_category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE individual_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for individual_profiles
CREATE POLICY "Users can view their own individual profile" ON individual_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own individual profile" ON individual_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own individual profile" ON individual_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Policies for business_profiles
CREATE POLICY "Users can view their own business profile" ON business_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own business profile" ON business_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own business profile" ON business_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Function to automatically update 'updated_at'
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for 'updated_at'
DROP TRIGGER IF EXISTS set_updated_at_individual ON individual_profiles;
CREATE TRIGGER set_updated_at_individual
  BEFORE UPDATE ON individual_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_business ON business_profiles;
CREATE TRIGGER set_updated_at_business
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
