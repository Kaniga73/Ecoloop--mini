-- =========================================================
-- ECOLOOP SUPABASE DATABASE SCHEMA
-- =========================================================

-- Sequences for custom profile IDs
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

-- Enable RLS for Profiles
ALTER TABLE individual_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for individual_profiles
DROP POLICY IF EXISTS "Users can view their own individual profile" ON individual_profiles;
CREATE POLICY "Users can view their own individual profile" ON individual_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can insert their own individual profile" ON individual_profiles;
CREATE POLICY "Users can insert their own individual profile" ON individual_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update their own individual profile" ON individual_profiles;
CREATE POLICY "Users can update their own individual profile" ON individual_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Policies for business_profiles
DROP POLICY IF EXISTS "Users can view their own business profile" ON business_profiles;
CREATE POLICY "Users can view their own business profile" ON business_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can insert their own business profile" ON business_profiles;
CREATE POLICY "Users can insert their own business profile" ON business_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update their own business profile" ON business_profiles;
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


-- =========================================================
-- 1. LISTINGS
-- =========================================================

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),

  seller_id uuid not null
    references auth.users(id) on delete cascade,

  title text not null,
  price numeric,
  image_url text,

  created_at timestamptz not null default now()
);


-- =========================================================
-- 2. CONVERSATIONS
-- =========================================================

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),

  listing_id uuid not null
    references listings(id) on delete cascade,

  listing_title text not null,
  listing_price text,
  listing_image text,

  buyer_id uuid not null
    references auth.users(id) on delete cascade,

  buyer_company text not null,
  buyer_name text not null,

  seller_id uuid not null
    references auth.users(id) on delete cascade,

  seller_company text not null,
  seller_name text not null,

  last_message text,
  last_message_time timestamptz,

  created_at timestamptz not null default now(),

  -- Prevent duplicate conversations for
  -- the same listing, buyer and seller
  constraint unique_listing_buyer_seller
    unique (listing_id, buyer_id, seller_id)
);


-- =========================================================
-- 3. MESSAGES
-- =========================================================

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),

  conversation_id uuid not null
    references conversations(id) on delete cascade,

  sender_id uuid not null
    references auth.users(id) on delete cascade,

  sender_name text not null,

  sender_role text not null
    check (sender_role in ('buyer', 'seller', 'system')),

  text text not null,

  created_at timestamptz not null default now()
);


-- =========================================================
-- 4. DEAL OFFERS
-- =========================================================

create table if not exists deal_offers (
  id uuid primary key default gen_random_uuid(),

  conversation_id uuid not null
    references conversations(id) on delete cascade,

  message_id uuid
    references messages(id) on delete set null,

  offered_price_per_unit numeric not null
    check (offered_price_per_unit >= 0),

  offered_quantity numeric not null
    check (offered_quantity > 0),

  unit text not null,

  currency text not null default '$',

  incoterm text not null,

  total_offer_amount numeric not null
    check (total_offer_amount >= 0),

  notes text,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'accepted',
        'countered',
        'declined',
        'withdrawn',
        'expired'
      )
    ),

  created_at timestamptz not null default now()
);


-- =========================================================
-- 5. INDEXES
-- =========================================================

create index if not exists idx_listings_seller
  on listings(seller_id);

create index if not exists idx_conversations_buyer
  on conversations(buyer_id);

create index if not exists idx_conversations_seller
  on conversations(seller_id);

create index if not exists idx_conversations_listing
  on conversations(listing_id);

create index if not exists idx_conversations_last_message
  on conversations(last_message_time desc);

create index if not exists idx_messages_conversation
  on messages(conversation_id);

create index if not exists idx_messages_created_at
  on messages(created_at);

create index if not exists idx_deal_offers_conversation
  on deal_offers(conversation_id);

create index if not exists idx_deal_offers_message
  on deal_offers(message_id);


-- =========================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table listings enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table deal_offers enable row level security;


-- =========================================================
-- 7. LISTINGS POLICIES
-- =========================================================

drop policy if exists "Users can view listings" on listings;

create policy "Users can view listings"
on listings
for select
to authenticated
using (true);


drop policy if exists "Users can create their own listings" on listings;

create policy "Users can create their own listings"
on listings
for insert
to authenticated
with check (seller_id = auth.uid());


drop policy if exists "Users can update their own listings" on listings;

create policy "Users can update their own listings"
on listings
for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());


drop policy if exists "Users can delete their own listings" on listings;

create policy "Users can delete their own listings"
on listings
for delete
to authenticated
using (seller_id = auth.uid());


-- =========================================================
-- 8. CONVERSATION POLICIES
-- =========================================================

drop policy if exists "Users can view their conversations" on conversations;

create policy "Users can view their conversations"
on conversations
for select
to authenticated
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
);


drop policy if exists "Users can create conversations" on conversations;

create policy "Users can create conversations"
on conversations
for insert
to authenticated
with check (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
);


drop policy if exists "Users can update their conversations" on conversations;

create policy "Users can update their conversations"
on conversations
for update
to authenticated
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
)
with check (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
);


-- =========================================================
-- 9. MESSAGE POLICIES
-- =========================================================

drop policy if exists "Users can view conversation messages"
on messages;

create policy "Users can view conversation messages"
on messages
for select
to authenticated
using (
  exists (
    select 1
    from conversations c
    where c.id = messages.conversation_id
      and (
        c.buyer_id = auth.uid()
        or c.seller_id = auth.uid()
      )
  )
);


drop policy if exists "Users can send messages"
on messages;

create policy "Users can send messages"
on messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from conversations c
    where c.id = messages.conversation_id
      and (
        c.buyer_id = auth.uid()
        or c.seller_id = auth.uid()
      )
  )
);


-- =========================================================
-- 10. DEAL OFFER POLICIES
-- =========================================================

drop policy if exists "Users can view deal offers"
on deal_offers;

create policy "Users can view deal offers"
on deal_offers
for select
to authenticated
using (
  exists (
    select 1
    from conversations c
    where c.id = deal_offers.conversation_id
      and (
        c.buyer_id = auth.uid()
        or c.seller_id = auth.uid()
      )
  )
);


drop policy if exists "Users can create deal offers"
on deal_offers;

create policy "Users can create deal offers"
on deal_offers
for insert
to authenticated
with check (
  exists (
    select 1
    from conversations c
    where c.id = deal_offers.conversation_id
      and (
        c.buyer_id = auth.uid()
        or c.seller_id = auth.uid()
      )
  )
);


drop policy if exists "Users can update deal offers"
on deal_offers;

create policy "Users can update deal offers"
on deal_offers
for update
to authenticated
using (
  exists (
    select 1
    from conversations c
    where c.id = deal_offers.conversation_id
      and (
        c.buyer_id = auth.uid()
        or c.seller_id = auth.uid()
      )
  )
)
with check (
  exists (
    select 1
    from conversations c
    where c.id = deal_offers.conversation_id
      and (
        c.buyer_id = auth.uid()
        or c.seller_id = auth.uid()
      )
  )
);


-- =========================================================
-- 11. SUPABASE REALTIME
-- =========================================================

alter publication supabase_realtime
add table messages;

alter publication supabase_realtime
add table deal_offers;
