import type { Asset, AssetType, AssetWithValue, AssetWithValueAndLabels } from '../types';

export function calculateAssetValue(
  asset: Asset,
  stockPrices: Record<string, number>,
  goldPrice: number | null
): number {
  switch (asset.type) {
    case 'stock':
      if (asset.ticker && asset.shares) {
        const price = stockPrices[asset.ticker] || 0;
        return price * asset.shares;
      }
      return 0;

    case 'real_estate':
      // Return current estimated value or purchase price as fallback
      return asset.current_value || asset.purchase_price || 0;

    case 'gold':
      if (asset.weight_oz && goldPrice) {
        return asset.weight_oz * goldPrice;
      }
      return asset.manual_value || 0;

    case 'cash':
    case 'crypto':
    case 'other':
    default:
      return asset.manual_value || 0;
  }
}

export function calculateRealEstateEquity(asset: Asset): number {
  if (asset.type !== 'real_estate') return 0;

  const currentValue = asset.current_value || asset.purchase_price || 0;
  const mortgageBalance = asset.mortgage_amount || 0;

  return currentValue - mortgageBalance;
}

export function calculateTotalNetWorth(
  assets: Asset[],
  stockPrices: Record<string, number>,
  goldPrice: number | null
): number {
  return assets.reduce((total, asset) => {
    if (asset.type === 'real_estate') {
      return total + calculateRealEstateEquity(asset);
    }
    return total + calculateAssetValue(asset, stockPrices, goldPrice);
  }, 0);
}

export function calculateAssetsByType(
  assets: Asset[],
  stockPrices: Record<string, number>,
  goldPrice: number | null
): Record<AssetType, number> {
  const breakdown: Record<AssetType, number> = {
    stock: 0,
    real_estate: 0,
    gold: 0,
    cash: 0,
    crypto: 0,
    other: 0,
  };

  for (const asset of assets) {
    if (asset.type === 'real_estate') {
      breakdown[asset.type] += calculateRealEstateEquity(asset);
    } else {
      breakdown[asset.type] += calculateAssetValue(asset, stockPrices, goldPrice);
    }
  }

  return breakdown;
}

export function getAssetsWithValues(
  assets: Asset[],
  stockPrices: Record<string, number>,
  goldPrice: number | null
): AssetWithValue[] {
  return assets.map(asset => ({
    ...asset,
    calculated_value: asset.type === 'real_estate'
      ? calculateRealEstateEquity(asset)
      : calculateAssetValue(asset, stockPrices, goldPrice),
  }));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function getAssetTypeLabel(type: AssetType): string {
  const labels: Record<AssetType, string> = {
    stock: 'Stocks',
    real_estate: 'Real Estate',
    gold: 'Gold',
    cash: 'Cash',
    crypto: 'Crypto',
    other: 'Other',
  };
  return labels[type];
}

export function getAssetTypeColor(type: AssetType): string {
  const colors: Record<AssetType, string> = {
    stock: '#3b82f6',     // blue
    real_estate: '#10b981', // green
    gold: '#f59e0b',      // amber
    cash: '#6366f1',      // indigo
    crypto: '#8b5cf6',    // violet
    other: '#6b7280',     // gray
  };
  return colors[type];
}

/**
 * Filter assets by label IDs using OR logic (matches any label)
 * If labelIds is empty, returns all assets
 */
export function filterAssetsByLabels<T extends AssetWithValueAndLabels>(
  assets: T[],
  labelIds: string[]
): T[] {
  if (labelIds.length === 0) {
    return assets;
  }

  return assets.filter(asset => {
    if (!asset.labels || asset.labels.length === 0) {
      return false;
    }
    // OR logic: asset matches if it has any of the selected labels
    return asset.labels.some(label => labelIds.includes(label.id));
  });
}

export interface PortfolioPerformance {
  totalCostBasis: number;
  totalCurrentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

/**
 * Calculate portfolio performance metrics for assets with cost basis
 */
export function calculatePortfolioPerformance(
  assets: AssetWithValue[]
): PortfolioPerformance {
  // Only include assets that have cost_basis set
  const assetsWithCostBasis = assets.filter(
    asset => asset.cost_basis && asset.cost_basis > 0
  );

  const totalCostBasis = assetsWithCostBasis.reduce(
    (sum, asset) => sum + (asset.cost_basis || 0),
    0
  );

  const totalCurrentValue = assetsWithCostBasis.reduce(
    (sum, asset) => sum + asset.calculated_value,
    0
  );

  const gainLoss = totalCurrentValue - totalCostBasis;
  const gainLossPercent = totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0;

  return {
    totalCostBasis,
    totalCurrentValue,
    gainLoss,
    gainLossPercent,
  };
}
