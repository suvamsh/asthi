-- Labels for asset tagging/categorization

-- Labels table (user-scoped)
create table labels (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  color text,
  created_at timestamptz default now(),
  constraint unique_user_label_name unique(user_id, name)
);

-- Junction table for asset-label relationships
create table asset_labels (
  asset_id uuid references assets(id) on delete cascade not null,
  label_id uuid references labels(id) on delete cascade not null,
  primary key (asset_id, label_id)
);

-- Enable RLS on labels
alter table labels enable row level security;

create policy "Users can view own labels"
  on labels for select
  using (auth.uid() = user_id);

create policy "Users can insert own labels"
  on labels for insert
  with check (auth.uid() = user_id);

create policy "Users can update own labels"
  on labels for update
  using (auth.uid() = user_id);

create policy "Users can delete own labels"
  on labels for delete
  using (auth.uid() = user_id);

-- Enable RLS on asset_labels
alter table asset_labels enable row level security;

-- Asset_labels policies (via asset ownership)
create policy "Users can view own asset labels"
  on asset_labels for select
  using (
    exists (
      select 1 from assets
      where assets.id = asset_labels.asset_id
      and assets.user_id = auth.uid()
    )
  );

create policy "Users can insert own asset labels"
  on asset_labels for insert
  with check (
    exists (
      select 1 from assets
      where assets.id = asset_labels.asset_id
      and assets.user_id = auth.uid()
    )
  );

create policy "Users can delete own asset labels"
  on asset_labels for delete
  using (
    exists (
      select 1 from assets
      where assets.id = asset_labels.asset_id
      and assets.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index labels_user_id_idx on labels(user_id);
create index asset_labels_asset_id_idx on asset_labels(asset_id);
create index asset_labels_label_id_idx on asset_labels(label_id);
