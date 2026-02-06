// Approximate S&P 500 sector weights (updated periodically)
export const SP500_SECTOR_WEIGHTS: Record<string, number> = {
  'Technology': 0.32,
  'Healthcare': 0.12,
  'Financials': 0.13,
  'Consumer Discretionary': 0.10,
  'Communication Services': 0.09,
  'Industrials': 0.08,
  'Consumer Staples': 0.06,
  'Energy': 0.04,
  'Utilities': 0.02,
  'Real Estate': 0.02,
  'Materials': 0.02,
};

// All GICS sectors for completeness checking
export const ALL_SECTORS = Object.keys(SP500_SECTOR_WEIGHTS);
