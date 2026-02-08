import type { AssetType, AssetWithValue, NewsArticle, UserStrategyData } from '../types';

export interface ToolContext {
  assetsWithValues: AssetWithValue[];
  breakdown: Record<AssetType, number>;
  totalNetWorth: number;
  portfolioNews: NewsArticle[];
  searchNewsFn: (query: string) => Promise<void>;
  searchResults: NewsArticle[];
  strategyData: UserStrategyData | null;
  stockPrices: Record<string, number>;
  goldPrice: number | null;
}
