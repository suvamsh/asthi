import { RefreshCw, RotateCcw, Lightbulb, Zap, PieChart } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { useInsights } from '../hooks/useInsights';
import { PortfolioHealthBanner } from '../components/insights/PortfolioHealthScore';
import { SectorExposureContent } from '../components/insights/SectorExposureChart';
import { InsightCard } from '../components/insights/InsightCard';
import { NewsImpactChainContent } from '../components/insights/NewsImpactChain';
import { InsightSkeleton } from '../components/insights/InsightSkeleton';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/calculations';
import type { AssetType, AssetWithValueAndLabels } from '../types';
import type { InsightSeverity } from '../lib/insights/insightTypes';

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

  // Severity summary for insights header
  const severityCounts = insights.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {});

  const severityOrder: InsightSeverity[] = ['critical', 'warning', 'info', 'positive'];
  const severityColors: Record<InsightSeverity, string> = {
    critical: '#f14c4c',
    warning: '#cca700',
    info: '#4fc1ff',
    positive: '#4ec9b0',
  };

  const severityChips = severityOrder
    .filter(s => severityCounts[s])
    .map(s => ({ severity: s, count: severityCounts[s] }));

  // Top theme for impact chains header
  const topChain = impactChains[0];
  const totalExposure = impactChains.reduce((sum, c) => sum + c.exposureValue, 0);

  // Top 3 sectors for header
  const topSectors = [...sectorAllocations]
    .filter(a => a.portfolioWeight > 0.001)
    .sort((a, b) => b.portfolioWeight - a.portfolioWeight)
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
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

      {/* Health Score Banner — always visible */}
      <div className="flex-shrink-0">
        <PortfolioHealthBanner score={healthScore} />
      </div>

      {/* Quadrant grid — 2 cols, 2 rows, each card scrollable */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[1fr_1fr] gap-2">
        {/* Top-left: Portfolio Insights */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#3c3c3c] flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-[#cca700] flex-shrink-0" />
            <span className="text-sm font-medium text-[#e0e0e0]">Portfolio Insights</span>
            <span className="px-1.5 py-0.5 rounded text-xs bg-[#37373d] text-[#8a8a8a]">
              {insights.length}
            </span>
            {severityChips.length > 0 && (
              <div className="flex items-center gap-1.5 ml-1">
                {severityChips.map(({ severity, count }) => (
                  <span
                    key={severity}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      color: severityColors[severity],
                      backgroundColor: `${severityColors[severity]}15`,
                    }}
                  >
                    {count} {severity}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {insights.length > 0 ? (
              <div className="space-y-1">
                {insights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} onDismiss={dismiss} />
                ))}
              </div>
            ) : (
              <p className="text-[#8a8a8a] text-sm text-center py-2">
                No insights right now. Your portfolio looks well-balanced!
              </p>
            )}
          </div>
        </div>

        {/* Top-right: Sector Exposure */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#3c3c3c] flex-shrink-0">
            <PieChart className="w-4 h-4 text-[#4fc1ff] flex-shrink-0" />
            <span className="text-sm font-medium text-[#e0e0e0]">Sector Exposure</span>
            {topSectors.length > 0 && (
              <div className="flex items-center gap-2 ml-1">
                {topSectors.map(s => (
                  <span key={s.sector} className="text-xs text-[#8a8a8a]">
                    {s.sector} {(s.portfolioWeight * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SectorExposureContent allocations={sectorAllocations} />
          </div>
        </div>

        {/* Bottom: News Impact Chains — spans full width */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg flex flex-col min-h-0 overflow-hidden md:col-span-2">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#3c3c3c] flex-shrink-0">
            <Zap className="w-4 h-4 text-[#cca700] flex-shrink-0" />
            <span className="text-sm font-medium text-[#e0e0e0]">News Impact Chains</span>
            <span className="px-1.5 py-0.5 rounded text-xs bg-[#37373d] text-[#8a8a8a]">
              {impactChains.length}
            </span>
            {topChain && (
              <div className="flex items-center gap-2 ml-1">
                <span className="text-xs text-[#8a8a8a] truncate max-w-[120px]">
                  {topChain.theme}
                </span>
                <span className="text-xs text-[#cccccc] font-mono flex-shrink-0">
                  {formatCurrency(totalExposure)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {newsLoading ? (
              <InsightSkeleton />
            ) : impactChains.length > 0 ? (
              <NewsImpactChainContent chains={impactChains} />
            ) : (
              <p className="text-[#8a8a8a] text-sm text-center py-2">
                No news impact chains detected.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
