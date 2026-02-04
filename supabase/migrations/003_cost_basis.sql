-- Add cost_basis column to assets table
alter table assets add column cost_basis numeric;

-- Add comment explaining the field
comment on column assets.cost_basis is 'Total cost basis (purchase price) of the asset for gain/loss calculations';
