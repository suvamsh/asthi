import { useMemo, useState, useCallback } from 'react';
import type { AssetWithValue, AssetType, NewsArticle } from '../types';
import type { Insight, PortfolioHealthScore, SectorAllocation, ImpactChain } from '../lib/insights/insightTypes';
import {
  calculateHealthScore,
  getSectorWeights,
  generateConcentrationInsights,
  generateSectorInsights,
  generateAssetTypeInsights,
  generateRebalancingInsights,
  generatePerformanceInsights,
  generateTaxInsights,
} from '../lib/insights/portfolioAnalysis';
import {
  generateSentimentInsights,
  generateVolumeInsights,
  matchImpactChains,
} from '../lib/insights/newsAnalysis';

const DISMISSED_KEY = 'asthi_dismissed_insights';

function getDismissedIds(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* ignore */ }
  return new Set();
}

function saveDismissedIds(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids)));
}

interface UseInsightsResult {
  healthScore: PortfolioHealthScore;
  sectorAllocations: SectorAllocation[];
  insights: Insight[];
  impactChains: ImpactChain[];
  dismissedCount: number;
  dismiss: (id: string) => void;
  resetDismissed: () => void;
}

export function useInsights(
  assetsWithValues: AssetWithValue[],
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
  news: NewsArticle[],
): UseInsightsResult {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(getDismissedIds);

  // Health score
  const healthScore = useMemo(
    () => calculateHealthScore(assetsWithValues, breakdown, totalNetWorth),
    [assetsWithValues, breakdown, totalNetWorth],
  );

  // Sector allocations
  const sectorAllocations = useMemo(
    () => getSectorWeights(assetsWithValues, totalNetWorth),
    [assetsWithValues, totalNetWorth],
  );

  // All insights (portfolio + news)
  const allInsights = useMemo(() => {
    const portfolio = [
      ...generateConcentrationInsights(assetsWithValues, totalNetWorth),
      ...generateSectorInsights(assetsWithValues, totalNetWorth),
      ...generateAssetTypeInsights(breakdown, totalNetWorth),
      ...generateRebalancingInsights(assetsWithValues, totalNetWorth),
      ...generatePerformanceInsights(assetsWithValues),
      ...generateTaxInsights(assetsWithValues),
    ];

    const newsInsights = [
      ...generateSentimentInsights(news),
      ...generateVolumeInsights(news),
    ];

    return [...portfolio, ...newsInsights];
  }, [assetsWithValues, breakdown, totalNetWorth, news]);

  // Impact chains
  const impactChains = useMemo(
    () => matchImpactChains(news, assetsWithValues),
    [news, assetsWithValues],
  );

  // Filter dismissed
  const insights = useMemo(
    () => allInsights.filter(i => !dismissedIds.has(i.id)),
    [allInsights, dismissedIds],
  );

  const dismissedCount = allInsights.length - insights.length;

  const dismiss = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveDismissedIds(next);
      return next;
    });
  }, []);

  const resetDismissed = useCallback(() => {
    setDismissedIds(new Set());
    localStorage.removeItem(DISMISSED_KEY);
  }, []);

  return {
    healthScore,
    sectorAllocations,
    insights,
    impactChains,
    dismissedCount,
    dismiss,
    resetDismissed,
  };
}
