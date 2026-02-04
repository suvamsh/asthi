-- Add ownership percentage for real estate assets
alter table assets
  add column ownership_percent numeric;

comment on column assets.ownership_percent is 'Ownership percentage (0-100) for real estate assets';
