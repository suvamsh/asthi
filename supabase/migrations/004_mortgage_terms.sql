-- Add mortgage terms for real estate amortization
alter table assets
  add column mortgage_rate numeric,
  add column monthly_payment numeric;

comment on column assets.mortgage_rate is 'Annual mortgage rate (APR %) used to estimate amortization';
comment on column assets.monthly_payment is 'Monthly mortgage payment used to estimate amortization';
