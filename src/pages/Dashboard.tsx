import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { NetWorthCard } from '../components/dashboard/NetWorthCard';
import { PerformanceCard } from '../components/dashboard/PerformanceCard';
import { AllocationChart } from '../components/dashboard/AllocationChart';
import { TrendChart } from '../components/dashboard/TrendChart';
import { AssetList } from '../components/dashboard/AssetList';
import { LabelFilter } from '../components/dashboard/LabelFilter';
import { AddAssetModal } from '../components/assets/AddAssetModal';
import { Button } from '../components/ui/Button';
import { filterAssetsByLabels, calculateAssetsByType, calculatePortfolioPerformance } from '../lib/calculations';
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

  // Calculate portfolio performance
  const performance = useMemo(() => {
    return calculatePortfolioPerformance(filteredAssets);
  }, [filteredAssets]);

  const isFiltered = selectedLabelIds.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Dashboard</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetWorthCard
          totalNetWorth={isFiltered ? filteredTotal : totalNetWorth}
          change={isFiltered ? null : netWorthChange}
          changePercent={isFiltered ? null : netWorthChangePercent}
          loading={loadingPrices}
          isFiltered={isFiltered}
        />
        <PerformanceCard
          totalCostBasis={performance.totalCostBasis}
          totalCurrentValue={performance.totalCurrentValue}
          gainLoss={performance.gainLoss}
          gainLossPercent={performance.gainLossPercent}
          loading={loadingPrices}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationChart breakdown={filteredBreakdown} />
        <TrendChart history={history} getHistoryForRange={getHistoryForRange} />
      </div>

      <AssetList assets={filteredAssets} loading={loadingAssets} />

      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={async (asset) => {
          const { labelIds, ...assetData } = asset;
          await onAddAsset(assetData as Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>, labelIds);
        }}
        labels={labels}
        onCreateLabel={onCreateLabel}
      />
    </div>
  );
}
