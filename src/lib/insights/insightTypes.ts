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

export type ImpactDirection = 'bullish' | 'bearish' | 'mixed';

export interface AffectedTickerDetail {
  ticker: string;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface ImpactChain {
  id: string;
  theme: string;
  direction: ImpactDirection;
  impact: string;
  articles: { title: string; url: string; source: string; publishedAt: string }[];
  exposureValue: number;
  exposurePercent: number;
  affectedTickers: AffectedTickerDetail[];
}
