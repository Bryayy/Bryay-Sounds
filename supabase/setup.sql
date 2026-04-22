-- ============================================
-- BRYAYSOUNDS DATABASE SETUP
-- Run this ENTIRE script in Supabase SQL Editor
-- Go to: SQL Editor (left sidebar) → New Query → Paste this → Click "Run"
-- ============================================

-- 1. PROFILES TABLE
-- Stores user info linked to Supabase Auth
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  plan text default 'free' check (plan in ('free', 'basic', 'premium')),
  billing_cycle text default null check (billing_cycle in ('monthly', 'annual', null)),
  credits_remaining integer default 0,
  credits_reset_date timestamp with time zone,
  stripe_customer_id text,
  stripe_subscription_id text,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. BEATS TABLE
-- Stores all beat metadata
create table public.beats (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  genre text not null,
  bpm integer not null,
  key text not null,
  duration text not null,
  is_hot boolean default false,
  is_exclusive_only boolean default false,
  exclusive_sold boolean default false,
  exclusive_buyer_id uuid references public.profiles(id),
  tagged_file_url text,
  clean_file_url text,
  stems_file_url text,
  artwork_url text,
  play_count integer default 0,
  download_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. DOWNLOADS TABLE
-- Tracks every beat download / credit usage
create table public.downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  beat_id uuid references public.beats(id) on delete cascade not null,
  license_tier text not null check (license_tier in ('basic', 'premium')),
  license_id text not null,
  stream_cap_audio integer not null,
  stream_cap_video integer not null,
  license_upgraded boolean default false,
  downloaded_at timestamp with time zone default now()
);

-- 4. TRANSACTIONS TABLE
-- Tracks all payments and financial events
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('subscription', 'upgrade', 'exclusive', 'refund')),
  amount decimal(10,2) not null,
  stripe_payment_id text,
  description text,
  created_at timestamp with time zone default now()
);

-- 5. Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.beats enable row level security;
alter table public.downloads enable row level security;
alter table public.transactions enable row level security;

-- 6. RLS POLICIES

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Beats: everyone can view beats (even non-logged in for browsing)
create policy "Anyone can view beats"
  on public.beats for select
  using (true);

-- Beats: only admins can insert/update/delete
create policy "Admins can manage beats"
  on public.beats for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Downloads: users can view their own downloads
create policy "Users can view own downloads"
  on public.downloads for select
  using (auth.uid() = user_id);

-- Downloads: users can insert their own downloads (when using credits)
create policy "Users can create own downloads"
  on public.downloads for insert
  with check (auth.uid() = user_id);

-- Transactions: users can view their own transactions
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- This function runs whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. SET YOUR ADMIN ACCOUNT
-- After you sign up on the site, run this to make yourself admin:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'brayantcruzg@hotmail.com';
