import type { AssetWithValue, AssetType, NewsSector } from '../types';

const CORS_PROXY = 'https://corsproxy.io/?';

// Top ~100 S&P 500 tickers mapped to GICS sectors
const TICKER_SECTORS: Record<string, { sector: string; industry: string }> = {
  // Technology
  AAPL: { sector: 'Technology', industry: 'Consumer Electronics' },
  MSFT: { sector: 'Technology', industry: 'Software' },
  GOOGL: { sector: 'Technology', industry: 'Internet Services' },
  GOOG: { sector: 'Technology', industry: 'Internet Services' },
  META: { sector: 'Technology', industry: 'Social Media' },
  NVDA: { sector: 'Technology', industry: 'Semiconductors' },
  TSM: { sector: 'Technology', industry: 'Semiconductors' },
  AVGO: { sector: 'Technology', industry: 'Semiconductors' },
  AMD: { sector: 'Technology', industry: 'Semiconductors' },
  INTC: { sector: 'Technology', industry: 'Semiconductors' },
  QCOM: { sector: 'Technology', industry: 'Semiconductors' },
  TXN: { sector: 'Technology', industry: 'Semiconductors' },
  ADBE: { sector: 'Technology', industry: 'Software' },
  CRM: { sector: 'Technology', industry: 'Software' },
  ORCL: { sector: 'Technology', industry: 'Software' },
  NOW: { sector: 'Technology', industry: 'Software' },
  INTU: { sector: 'Technology', industry: 'Software' },
  IBM: { sector: 'Technology', industry: 'IT Services' },
  CSCO: { sector: 'Technology', industry: 'Networking' },
  ACN: { sector: 'Technology', industry: 'IT Services' },
  SHOP: { sector: 'Technology', industry: 'E-Commerce' },
  SQ: { sector: 'Technology', industry: 'Fintech' },
  PLTR: { sector: 'Technology', industry: 'Software' },
  SNOW: { sector: 'Technology', industry: 'Cloud Computing' },
  NET: { sector: 'Technology', industry: 'Cloud Computing' },

  // Communication Services
  NFLX: { sector: 'Communication Services', industry: 'Streaming' },
  DIS: { sector: 'Communication Services', industry: 'Entertainment' },
  CMCSA: { sector: 'Communication Services', industry: 'Telecom' },
  T: { sector: 'Communication Services', industry: 'Telecom' },
  VZ: { sector: 'Communication Services', industry: 'Telecom' },
  TMUS: { sector: 'Communication Services', industry: 'Telecom' },
  SPOT: { sector: 'Communication Services', industry: 'Streaming' },

  // Consumer Discretionary
  AMZN: { sector: 'Consumer Discretionary', industry: 'E-Commerce' },
  TSLA: { sector: 'Consumer Discretionary', industry: 'Electric Vehicles' },
  HD: { sector: 'Consumer Discretionary', industry: 'Home Improvement' },
  MCD: { sector: 'Consumer Discretionary', industry: 'Restaurants' },
  NKE: { sector: 'Consumer Discretionary', industry: 'Apparel' },
  SBUX: { sector: 'Consumer Discretionary', industry: 'Restaurants' },
  LOW: { sector: 'Consumer Discretionary', industry: 'Home Improvement' },
  TGT: { sector: 'Consumer Discretionary', industry: 'Retail' },
  BKNG: { sector: 'Consumer Discretionary', industry: 'Travel' },
  ABNB: { sector: 'Consumer Discretionary', industry: 'Travel' },

  // Consumer Staples
  PG: { sector: 'Consumer Staples', industry: 'Household Products' },
  KO: { sector: 'Consumer Staples', industry: 'Beverages' },
  PEP: { sector: 'Consumer Staples', industry: 'Beverages' },
  WMT: { sector: 'Consumer Staples', industry: 'Retail' },
  COST: { sector: 'Consumer Staples', industry: 'Retail' },
  PM: { sector: 'Consumer Staples', industry: 'Tobacco' },
  MO: { sector: 'Consumer Staples', industry: 'Tobacco' },
  CL: { sector: 'Consumer Staples', industry: 'Household Products' },

  // Healthcare
  UNH: { sector: 'Healthcare', industry: 'Insurance' },
  JNJ: { sector: 'Healthcare', industry: 'Pharmaceuticals' },
  LLY: { sector: 'Healthcare', industry: 'Pharmaceuticals' },
  PFE: { sector: 'Healthcare', industry: 'Pharmaceuticals' },
  ABBV: { sector: 'Healthcare', industry: 'Pharmaceuticals' },
  MRK: { sector: 'Healthcare', industry: 'Pharmaceuticals' },
  TMO: { sector: 'Healthcare', industry: 'Life Sciences' },
  ABT: { sector: 'Healthcare', industry: 'Medical Devices' },
  DHR: { sector: 'Healthcare', industry: 'Life Sciences' },
  BMY: { sector: 'Healthcare', industry: 'Pharmaceuticals' },
  AMGN: { sector: 'Healthcare', industry: 'Biotechnology' },
  GILD: { sector: 'Healthcare', industry: 'Biotechnology' },
  MRNA: { sector: 'Healthcare', industry: 'Biotechnology' },

  // Financials
  JPM: { sector: 'Financials', industry: 'Banking' },
  BAC: { sector: 'Financials', industry: 'Banking' },
  WFC: { sector: 'Financials', industry: 'Banking' },
  GS: { sector: 'Financials', industry: 'Investment Banking' },
  MS: { sector: 'Financials', industry: 'Investment Banking' },
  BLK: { sector: 'Financials', industry: 'Asset Management' },
  C: { sector: 'Financials', industry: 'Banking' },
  AXP: { sector: 'Financials', industry: 'Credit Services' },
  V: { sector: 'Financials', industry: 'Payments' },
  MA: { sector: 'Financials', industry: 'Payments' },
  PYPL: { sector: 'Financials', industry: 'Payments' },
  SCHW: { sector: 'Financials', industry: 'Brokerage' },
  BRK_B: { sector: 'Financials', industry: 'Conglomerate' },

  // Energy
  XOM: { sector: 'Energy', industry: 'Oil & Gas' },
  CVX: { sector: 'Energy', industry: 'Oil & Gas' },
  COP: { sector: 'Energy', industry: 'Oil & Gas' },
  SLB: { sector: 'Energy', industry: 'Oil Services' },
  EOG: { sector: 'Energy', industry: 'Oil & Gas' },

  // Industrials
  BA: { sector: 'Industrials', industry: 'Aerospace' },
  CAT: { sector: 'Industrials', industry: 'Machinery' },
  HON: { sector: 'Industrials', industry: 'Conglomerate' },
  UPS: { sector: 'Industrials', industry: 'Logistics' },
  RTX: { sector: 'Industrials', industry: 'Defense' },
  DE: { sector: 'Industrials', industry: 'Machinery' },
  LMT: { sector: 'Industrials', industry: 'Defense' },
  GE: { sector: 'Industrials', industry: 'Conglomerate' },
  UNP: { sector: 'Industrials', industry: 'Railroads' },

  // Materials
  LIN: { sector: 'Materials', industry: 'Chemicals' },
  APD: { sector: 'Materials', industry: 'Chemicals' },
  NEM: { sector: 'Materials', industry: 'Mining' },
  FCX: { sector: 'Materials', industry: 'Mining' },

  // Real Estate
  AMT: { sector: 'Real Estate', industry: 'REITs' },
  PLD: { sector: 'Real Estate', industry: 'REITs' },
  CCI: { sector: 'Real Estate', industry: 'REITs' },
  SPG: { sector: 'Real Estate', industry: 'REITs' },
  O: { sector: 'Real Estate', industry: 'REITs' },

  // Utilities
  NEE: { sector: 'Utilities', industry: 'Electric Utilities' },
  DUK: { sector: 'Utilities', industry: 'Electric Utilities' },
  SO: { sector: 'Utilities', industry: 'Electric Utilities' },

  // ETFs
  SPY: { sector: 'Broad Market', industry: 'S&P 500 ETF' },
  QQQ: { sector: 'Technology', industry: 'Nasdaq 100 ETF' },
  VOO: { sector: 'Broad Market', industry: 'S&P 500 ETF' },
  VTI: { sector: 'Broad Market', industry: 'Total Market ETF' },
  IWM: { sector: 'Broad Market', industry: 'Small Cap ETF' },
  VGT: { sector: 'Technology', industry: 'Tech ETF' },
  XLF: { sector: 'Financials', industry: 'Financial ETF' },
  XLE: { sector: 'Energy', industry: 'Energy ETF' },
  ARKK: { sector: 'Technology', industry: 'Innovation ETF' },
  VNQ: { sector: 'Real Estate', industry: 'Real Estate ETF' },
  GLD: { sector: 'Commodities', industry: 'Gold ETF' },
  BND: { sector: 'Fixed Income', industry: 'Bond ETF' },
};

const ASSET_TYPE_SECTORS: Record<string, { name: string; searchTerms: string[] }> = {
  real_estate: { name: 'Real Estate', searchTerms: ['real estate market', 'housing market'] },
  gold: { name: 'Commodities', searchTerms: ['gold price commodity', 'precious metals market'] },
  crypto: { name: 'Cryptocurrency', searchTerms: ['cryptocurrency market', 'bitcoin crypto'] },
  cash: { name: 'Economy', searchTerms: ['economy interest rates', 'savings account rates'] },
  tax_advantaged: { name: 'Retirement', searchTerms: ['retirement investing 401k', 'IRA retirement planning'] },
};

export function getTickerSectorSync(ticker: string): { sector: string; industry: string } | null {
  const normalized = ticker.toUpperCase().replace('.', '_');
  return TICKER_SECTORS[normalized] || null;
}

export async function getTickerSector(ticker: string): Promise<{ sector: string; industry: string } | null> {
  // Check static map first
  const staticResult = getTickerSectorSync(ticker);
  if (staticResult) return staticResult;

  // Check sessionStorage cache
  const cacheKey = `sector_${ticker}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore corrupt cache
    }
  }

  // Fallback to Yahoo Finance quoteSummary
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=assetProfile`;
    const url = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    const profile = data?.quoteSummary?.result?.[0]?.assetProfile;
    if (profile?.sector) {
      const result = { sector: profile.sector, industry: profile.industry || profile.sector };
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    }
  } catch (error) {
    console.error('Error fetching sector for', ticker, error);
  }

  return null;
}

export async function deriveSectorsFromAssets(assets: AssetWithValue[]): Promise<NewsSector[]> {
  const sectorMap = new Map<string, { searchTerms: Set<string>; weight: number; assetCount: number }>();

  // Process stock assets
  const stockAssets = assets.filter(a => (a.type === 'stock' || a.type === 'tax_advantaged') && a.ticker && !a.is_account);

  // Batch sector lookups - use static map for speed, async for unknowns
  const sectorPromises = stockAssets.map(async (asset) => {
    const sectorInfo = await getTickerSector(asset.ticker!);
    return { asset, sectorInfo };
  });

  const results = await Promise.all(sectorPromises);

  for (const { asset, sectorInfo } of results) {
    if (!sectorInfo) continue;

    const existing = sectorMap.get(sectorInfo.sector);
    if (existing) {
      existing.weight += asset.calculated_value;
      existing.assetCount += 1;
      existing.searchTerms.add(`${sectorInfo.sector} ${sectorInfo.industry} stocks`);
    } else {
      sectorMap.set(sectorInfo.sector, {
        searchTerms: new Set([`${sectorInfo.sector} ${sectorInfo.industry} stocks`]),
        weight: asset.calculated_value,
        assetCount: 1,
      });
    }
  }

  // Process non-stock asset types
  const assetTypeCounts = new Map<AssetType, { count: number; value: number }>();
  for (const asset of assets) {
    if (asset.type === 'stock') continue;
    const existing = assetTypeCounts.get(asset.type);
    if (existing) {
      existing.count += 1;
      existing.value += asset.calculated_value;
    } else {
      assetTypeCounts.set(asset.type, { count: 1, value: asset.calculated_value });
    }
  }

  for (const [assetType, { count, value }] of assetTypeCounts) {
    const mapping = ASSET_TYPE_SECTORS[assetType];
    if (!mapping) continue;

    const existing = sectorMap.get(mapping.name);
    if (existing) {
      existing.weight += value;
      existing.assetCount += count;
      mapping.searchTerms.forEach(t => existing.searchTerms.add(t));
    } else {
      sectorMap.set(mapping.name, {
        searchTerms: new Set(mapping.searchTerms),
        weight: value,
        assetCount: count,
      });
    }
  }

  // Convert to array and sort by weight
  const sectors: NewsSector[] = Array.from(sectorMap.entries()).map(([name, data]) => ({
    name,
    searchTerms: Array.from(data.searchTerms),
    weight: data.weight,
    assetCount: data.assetCount,
  }));

  sectors.sort((a, b) => b.weight - a.weight);

  return sectors;
}
