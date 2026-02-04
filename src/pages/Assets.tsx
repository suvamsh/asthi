import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, TrendingUp, Building2, Coins, Wallet, Bitcoin, Package, PiggyBank } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LabelChip } from '../components/ui/LabelChip';
import { AddAssetModal } from '../components/assets/AddAssetModal';
import { formatCurrency, getAssetTypeLabel, getRealEstateMortgageBalance } from '../lib/calculations';
import type { Asset, AssetWithValueAndLabels, AssetType, Label } from '../types';

interface AssetsProps {
  assets: AssetWithValueAndLabels[];
  loading: boolean;
  onAddAsset: (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>, labelIds?: string[]) => Promise<Asset | null>;
  onDeleteAsset: (id: string) => Promise<void>;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

const assetIcons: Record<AssetType, typeof TrendingUp> = {
  stock: TrendingUp,
  real_estate: Building2,
  gold: Coins,
  cash: Wallet,
  crypto: Bitcoin,
  tax_advantaged: PiggyBank,
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

export function Assets({ assets, loading, onAddAsset, onDeleteAsset, labels, onCreateLabel }: AssetsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    setDeletingId(id);
    try {
      await onDeleteAsset(id);
    } finally {
      setDeletingId(null);
    }
  };

  // Group assets by type
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.type]) {
      acc[asset.type] = [];
    }
    acc[asset.type].push(asset);
    return acc;
  }, {} as Record<AssetType, AssetWithValueAndLabels[]>);

  const sortedTypes = Object.keys(groupedAssets).sort((a, b) => {
    const totalA = groupedAssets[a as AssetType].reduce((sum, asset) => sum + asset.calculated_value, 0);
    const totalB = groupedAssets[b as AssetType].reduce((sum, asset) => sum + asset.calculated_value, 0);
    return totalB - totalA;
  }) as AssetType[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Assets</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#3c3c3c] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#8a8a8a] mb-4">You haven't added any assets yet</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Asset
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedTypes.map((type) => {
            const Icon = assetIcons[type];
            const color = assetColors[type];
            const typeAssets = groupedAssets[type];
            const typeTotal = typeAssets.reduce((sum, asset) => sum + asset.calculated_value, 0);

            return (
              <Card key={type} padding="none">
                <div
                  className="px-6 py-4 border-b border-[#3c3c3c] flex items-center justify-between"
                  style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color }} />
                    <h2 className="font-semibold text-[#e0e0e0]">{getAssetTypeLabel(type)}</h2>
                    <span className="text-sm text-[#8a8a8a]">({typeAssets.length})</span>
                  </div>
                  <p className="font-semibold text-[#e0e0e0]">{formatCurrency(typeTotal)}</p>
                </div>

                <ul className="divide-y divide-[#3c3c3c]">
                  {typeAssets.map((asset) => (
                    <li
                      key={asset.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-[#2a2d2e]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#e0e0e0] truncate">{asset.name}</p>
                          {asset.labels && asset.labels.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {asset.labels.map(label => (
                                <LabelChip key={label.id} label={label} size="sm" />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-[#8a8a8a]">
                          {asset.ticker && (
                            <>
                              <Link
                                to={`/holdings/${encodeURIComponent(asset.ticker)}`}
                                className="text-[#4fc1ff] hover:text-[#6dd0ff]"
                              >
                                {asset.ticker}
                              </Link>
                              {' · '}
                            </>
                          )}
                          {asset.shares && `${asset.shares} shares`}
                          {asset.weight_oz && `${asset.weight_oz.toFixed(2)} oz`}
                          {asset.type === 'tax_advantaged' && asset.account_type && (
                            <>{asset.account_type}</>
                          )}
                          {asset.type === 'real_estate' && asset.mortgage_amount && (
                            <>Mortgage (est.): {formatCurrency(getRealEstateMortgageBalance(asset))}</>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="font-medium text-[#e0e0e0]">
                          {formatCurrency(asset.calculated_value)}
                        </p>

                        <div className="flex items-center gap-1">
                          <Link to={`/assets/${asset.id}`}>
                            <Button variant="ghost" size="sm" className="p-2">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-[#f14c4c] hover:bg-[#f14c4c]/10"
                            onClick={() => handleDelete(asset.id)}
                            disabled={deletingId === asset.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

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
