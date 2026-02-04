-- Asthi Net Worth Tracker - Initial Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create asset_type enum
create type asset_type as enum ('stock', 'real_estate', 'gold', 'cash', 'crypto', 'tax_advantaged', 'other');

-- Profiles table (extends Supabase Auth)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Trigger to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Assets table
create table assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type asset_type not null,

  -- Stock-specific
  ticker text,
  shares numeric,

  -- Real estate-specific
  purchase_price numeric,
  purchase_date date,
  down_payment numeric,
  mortgage_amount numeric,
  current_value numeric,

  -- Gold-specific
  weight_oz numeric,

  -- Generic
  manual_value numeric,
  account_type text,
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on assets
alter table assets enable row level security;

create policy "Users can view own assets"
  on assets for select
  using (auth.uid() = user_id);

create policy "Users can insert own assets"
  on assets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own assets"
  on assets for update
  using (auth.uid() = user_id);

create policy "Users can delete own assets"
  on assets for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index assets_user_id_idx on assets(user_id);
create index assets_type_idx on assets(type);

-- Net worth history table
create table net_worth_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  total_value numeric not null,
  breakdown jsonb,

  constraint unique_user_date unique(user_id, date)
);

-- Enable RLS on history
alter table net_worth_history enable row level security;

create policy "Users can view own history"
  on net_worth_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on net_worth_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update own history"
  on net_worth_history for update
  using (auth.uid() = user_id);

-- Index for history queries
create index history_user_date_idx on net_worth_history(user_id, date);

-- Price cache table (shared across users)
create table price_cache (
  ticker text primary key,
  price numeric not null,
  updated_at timestamptz default now()
);

-- Allow all authenticated users to read price cache
alter table price_cache enable row level security;

create policy "Anyone can read price cache"
  on price_cache for select
  to authenticated
  using (true);

create policy "Anyone can insert price cache"
  on price_cache for insert
  to authenticated
  with check (true);

create policy "Anyone can update price cache"
  on price_cache for update
  to authenticated
  using (true);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for assets updated_at
create trigger update_assets_updated_at
  before update on assets
  for each row
  execute function update_updated_at_column();
