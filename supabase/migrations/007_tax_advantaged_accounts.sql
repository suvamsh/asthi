-- Add parent account support for tax-advantaged holdings
alter table assets
  add column if not exists parent_asset_id uuid references assets(id) on delete cascade;

alter table assets
  add column if not exists is_account boolean default false;

create index if not exists assets_parent_asset_id_idx on assets(parent_asset_id);

comment on column assets.parent_asset_id is 'Parent account asset for tax-advantaged positions';
comment on column assets.is_account is 'True for account containers (e.g., 401k), false for holdings';
