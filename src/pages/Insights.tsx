import { RefreshCw, RotateCcw } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { useInsights } from '../hooks/useInsights';
import { PortfolioHealthBanner } from '../components/insights/PortfolioHealthScore';
import { SectorExposureChart } from '../components/insights/SectorExposureChart';
import { InsightCard } from '../components/insights/InsightCard';
import { NewsImpactChainSection } from '../components/insights/NewsImpactChain';
import { InsightSkeleton } from '../components/insights/InsightSkeleton';
import { Button } from '../components/ui/Button';
import type { AssetType, AssetWithValueAndLabels } from '../types';

interface InsightsProps {
  assetsWithValues: AssetWithValueAndLabels[];
  breakdown: Record<AssetType, number>;
  totalNetWorth: number;
  loading?: boolean;
}

export function Insights({ assetsWithValues, breakdown, totalNetWorth, loading }: InsightsProps) {
  const { portfolioNews, loading: newsLoading, refresh: refreshNews } = useNews(assetsWithValues);

  const {
    healthScore,
    sectorAllocations,
    insights,
    impactChains,
    dismissedCount,
    dismiss,
    resetDismissed,
  } = useInsights(assetsWithValues, breakdown, totalNetWorth, portfolioNews);

  const hasAssets = assetsWithValues.length > 0 && totalNetWorth > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Insights</h1>
        <InsightSkeleton />
      </div>
    );
  }

  if (!hasAssets) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Insights</h1>
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-8 text-center">
          <p className="text-[#8a8a8a]">Add some assets to see portfolio insights and analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Insights</h1>
        <div className="flex items-center gap-2">
          {dismissedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetDismissed} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset ({dismissedCount})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshNews}
            disabled={newsLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Score Banner */}
      <PortfolioHealthBanner score={healthScore} />

      {/* Two-column grid: Insights + News left, Sector right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column: Key Insights + News Impact Chains */}
        <div className="lg:col-span-7 space-y-4">
          {/* Portfolio Insights */}
          {insights.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[#cccccc] mb-3">
                Portfolio Insights ({insights.length})
              </h2>
              <div className="space-y-2">
                {insights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} onDismiss={dismiss} />
                ))}
              </div>
            </div>
          )}

          {insights.length === 0 && !newsLoading && (
            <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-6 text-center">
              <p className="text-[#8a8a8a] text-sm">
                No insights right now. Your portfolio looks well-balanced!
              </p>
            </div>
          )}

          {/* News Impact Chains */}
          {newsLoading ? (
            <InsightSkeleton />
          ) : (
            <NewsImpactChainSection chains={impactChains} />
          )}
        </div>

        {/* Right column: Sector Exposure */}
        <div className="lg:col-span-5">
          <SectorExposureChart allocations={sectorAllocations} />
        </div>
      </div>
    </div>
  );
}
