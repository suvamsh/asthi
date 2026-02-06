export type InsightSeverity = 'critical' | 'warning' | 'info' | 'positive';
export type InsightCategory =
  | 'concentration'
  | 'sector'
  | 'asset_type'
  | 'rebalancing'
  | 'performance'
  | 'tax'
  | 'health'
  | 'news_sentiment'
  | 'news_volume'
  | 'news_impact';

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  metric?: string;
  tickers?: string[];
}

export interface PortfolioHealthScore {
  overall: number;
  concentration: number;
  sectorDiversity: number;
  typeBalance: number;
  holdingCount: number;
}

export interface SectorAllocation {
  sector: string;
  portfolioWeight: number;
  benchmarkWeight: number;
  diff: number;
}

export interface ImpactChain {
  id: string;
  headline: string;
  theme: string;
  impact: string;
  affectedTickers: string[];
}
