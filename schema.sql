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

-- Sequences for listing IDs (optional, using UUID here instead but keeping consistency if they want custom IDs)
CREATE SEQUENCE IF NOT EXISTS listing_id_seq START 1;

-- Waste Listings Table
CREATE TABLE IF NOT EXISTS waste_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_id TEXT DEFAULT 'LST' || TO_CHAR(nextval('listing_id_seq'), 'FM000000'),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  brand TEXT,
  model_code TEXT,
  manufacturing_year TEXT,
  condition TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  
  -- AI Analysis Data
  ai_suggestions JSONB DEFAULT '{}'::jsonb,
  
  -- Eco Classification (cached from AI or manually set)
  material_type TEXT,
  recyclability TEXT,
  reusability TEXT,
  waste_category TEXT,
  hazardous_material BOOLEAN DEFAULT false,
  
  -- Pricing
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT '₹',
  price_type TEXT DEFAULT 'Fixed',
  min_acceptable_price NUMERIC,
  bulk_purchase_allowed BOOLEAN DEFAULT false,
  bulk_price NUMERIC,
  
  -- Availability
  start_date TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ NOT NULL,
  
  -- Location
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  location_pincode TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  
  -- Seller Preferences
  preferred_buyer TEXT DEFAULT 'Both',
  transaction_type TEXT DEFAULT 'Both',
  
  -- Status
  status TEXT DEFAULT 'available',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for waste_listings
ALTER TABLE waste_listings ENABLE ROW LEVEL SECURITY;

-- Policies for waste_listings
CREATE POLICY "Anyone can view active waste listings" ON waste_listings
  FOR SELECT USING (
    status = 'available' AND deadline >= NOW()
  );

CREATE POLICY "Sellers can view their own listings regardless of status" ON waste_listings
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own listings" ON waste_listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings" ON waste_listings
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own listings" ON waste_listings
  FOR DELETE USING (auth.uid() = seller_id);

-- Triggers for 'updated_at' on waste_listings
DROP TRIGGER IF EXISTS set_updated_at_waste_listings ON waste_listings;
CREATE TRIGGER set_updated_at_waste_listings
  BEFORE UPDATE ON waste_listings
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Set up storage for listing images
-- Note: You may need to create the bucket 'listing_images' manually in the Supabase Dashboard
-- if your pg_role doesn't have privileges, but here is the SQL to attempt it:
INSERT INTO storage.buckets (id, name, public) VALUES ('listing_images', 'listing_images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Listing images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing_images');

CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own listing images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'listing_images' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own listing images" ON storage.objects
  FOR DELETE USING (bucket_id = 'listing_images' AND auth.uid() = owner);
