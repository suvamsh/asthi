import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { NetWorthCard } from '../components/dashboard/NetWorthCard';
import { TrendChart } from '../components/dashboard/TrendChart';
import { CustomAllocationChart } from '../components/dashboard/CustomAllocationChart';
import { DashboardInsightsCard } from '../components/dashboard/DashboardInsightsCard';
import { DashboardNewsCard } from '../components/dashboard/DashboardNewsCard';
import { LabelFilter } from '../components/dashboard/LabelFilter';
import { AddAssetModal } from '../components/assets/AddAssetModal';
import { Button } from '../components/ui/Button';
import { useNews } from '../hooks/useNews';
import { useInsights } from '../hooks/useInsights';
import { filterAssetsByLabels, calculateAssetsByType } from '../lib/calculations';
import type { Asset, AssetType, NetWorthHistory, AssetWithValueAndLabels, Label } from '../types';

interface DashboardProps {
  totalNetWorth: number;
  netWorthChange: number | null;
  netWorthChangePercent: number | null;
  breakdown: Record<AssetType, number>;
  assetsWithValues: AssetWithValueAndLabels[];
  history: NetWorthHistory[];
  loadingPrices: boolean;
  loadingAssets: boolean;
  getHistoryForRange: (days: number) => NetWorthHistory[];
  onAddAsset: (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>, labelIds?: string[]) => Promise<Asset | null>;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
  stockPrices: Record<string, number>;
  goldPrice: number | null;
}

export function Dashboard({
  totalNetWorth,
  netWorthChange,
  netWorthChangePercent,
  breakdown,
  assetsWithValues,
  history,
  loadingPrices,
  loadingAssets,
  getHistoryForRange,
  onAddAsset,
  labels,
  onCreateLabel,
  stockPrices,
  goldPrice,
}: DashboardProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // News & insights hooks
  const { portfolioNews, loading: newsLoading } = useNews(assetsWithValues);
  const { insights } = useInsights(assetsWithValues, breakdown, totalNetWorth, portfolioNews);

  // Filter assets by selected labels
  const filteredAssets = useMemo(() => {
    return filterAssetsByLabels(assetsWithValues, selectedLabelIds);
  }, [assetsWithValues, selectedLabelIds]);

  // Recalculate breakdown for filtered assets
  const filteredBreakdown = useMemo(() => {
    if (selectedLabelIds.length === 0) {
      return breakdown;
    }
    return calculateAssetsByType(filteredAssets, stockPrices, goldPrice);
  }, [filteredAssets, selectedLabelIds, breakdown, stockPrices, goldPrice]);

  // Calculate filtered total
  const filteredTotal = useMemo(() => {
    if (selectedLabelIds.length === 0) {
      return totalNetWorth;
    }
    return filteredAssets.reduce((sum, asset) => sum + asset.calculated_value, 0);
  }, [filteredAssets, selectedLabelIds, totalNetWorth]);

  const isFiltered = selectedLabelIds.length > 0;

  return (
    <div className="lg:h-[calc(100vh-6.5rem)] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#e0e0e0]">Dashboard</h1>
        <div className="flex items-center gap-3">
          <LabelFilter
            labels={labels}
            selectedLabelIds={selectedLabelIds}
            onChange={setSelectedLabelIds}
          />
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Net Worth — full width hero */}
      <NetWorthCard
        totalNetWorth={isFiltered ? filteredTotal : totalNetWorth}
        change={isFiltered ? null : netWorthChange}
        changePercent={isFiltered ? null : netWorthChangePercent}
        loading={loadingAssets || loadingPrices}
        isFiltered={isFiltered}
      />

      {/* Charts row — Trend + Allocation side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:min-h-0 lg:flex-1">
        <TrendChart history={history} getHistoryForRange={getHistoryForRange} loading={loadingAssets} />
        <CustomAllocationChart breakdown={filteredBreakdown} assets={filteredAssets} loading={loadingAssets} />
      </div>

      {/* Insights + News row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:min-h-0 lg:flex-1">
        <DashboardInsightsCard insights={insights} loading={loadingAssets || newsLoading} />
        <DashboardNewsCard articles={portfolioNews} loading={loadingAssets || newsLoading} />
      </div>

      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={async (asset) => {
          const { labelIds, ...assetData } = asset;
          return await onAddAsset(assetData as Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>, labelIds);
        }}
        labels={labels}
        onCreateLabel={onCreateLabel}
      />
    </div>
  );
}
