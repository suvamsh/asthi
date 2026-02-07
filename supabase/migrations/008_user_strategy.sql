-- User investment strategy (one row per user, JSONB for flexible schema)
create table if not exists user_strategy (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  strategy jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- RLS
alter table user_strategy enable row level security;

create policy "Users can view own strategy"
  on user_strategy for select using (auth.uid() = user_id);

create policy "Users can insert own strategy"
  on user_strategy for insert with check (auth.uid() = user_id);

create policy "Users can update own strategy"
  on user_strategy for update using (auth.uid() = user_id);

create policy "Users can delete own strategy"
  on user_strategy for delete using (auth.uid() = user_id);

-- Reuse existing trigger function from 001_initial.sql
create trigger update_user_strategy_updated_at
  before update on user_strategy
  for each row execute function update_updated_at_column();
