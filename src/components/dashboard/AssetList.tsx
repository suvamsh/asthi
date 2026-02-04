import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Building2, Coins, Wallet, Bitcoin, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency, getAssetTypeLabel } from '../../lib/calculations';
import type { AssetWithValue, AssetType } from '../../types';

interface AssetListProps {
  assets: AssetWithValue[];
  loading?: boolean;
}

const assetIcons: Record<AssetType, typeof TrendingUp> = {
  stock: TrendingUp,
  real_estate: Building2,
  gold: Coins,
  cash: Wallet,
  crypto: Bitcoin,
  other: Package,
};

const assetColors: Record<AssetType, string> = {
  stock: '#4fc1ff',
  real_estate: '#4ec9b0',
  gold: '#dcdcaa',
  cash: '#c586c0',
  crypto: '#ce9178',
  other: '#9cdcfe',
};

export function AssetList({ assets, loading }: AssetListProps) {
  const sortedAssets = [...assets].sort((a, b) => b.calculated_value - a.calculated_value);
  const topAssets = sortedAssets.slice(0, 5);

  return (
    <Card padding="none">
      <CardHeader className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <CardTitle>Top Holdings</CardTitle>
          <Link
            to="/assets"
            className="text-sm text-[#4fc1ff] hover:text-[#6dd0ff] font-medium flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>

      {loading ? (
        <div className="px-6 pb-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#3c3c3c] rounded animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="px-6 pb-6 text-center py-8">
          <p className="text-[#8a8a8a] mb-3">No assets yet</p>
          <Link
            to="/assets/add"
            className="text-[#4fc1ff] hover:text-[#6dd0ff] font-medium"
          >
            Add your first asset
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[#3c3c3c]">
          {topAssets.map((asset) => {
            const Icon = assetIcons[asset.type];
            const color = assetColors[asset.type];
            return (
              <li key={asset.id}>
                <Link
                  to={`/assets/${asset.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#2a2d2e] transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#e0e0e0] truncate">{asset.name}</p>
                    <p className="text-sm text-[#8a8a8a]">
                      {getAssetTypeLabel(asset.type)}
                      {asset.ticker && ` · ${asset.ticker}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#e0e0e0]">
                      {formatCurrency(asset.calculated_value)}
                    </p>
                    {asset.type === 'stock' && asset.shares && (
                      <p className="text-sm text-[#8a8a8a]">{asset.shares} shares</p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
