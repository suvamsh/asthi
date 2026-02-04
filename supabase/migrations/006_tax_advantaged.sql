-- Add tax_advantaged to asset_type enum and account_type field
alter type asset_type add value if not exists 'tax_advantaged';

alter table assets
  add column account_type text;

comment on column assets.account_type is 'Subtype for accounts (e.g., 401k, Roth IRA)';
