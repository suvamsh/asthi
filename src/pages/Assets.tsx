import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { LabelChip } from '../components/ui/LabelChip';
import { AddAssetModal } from '../components/assets/AddAssetModal';
import { formatCurrency, formatCurrencyDetailed, getAssetTypeLabel } from '../lib/calculations';
import { LabelFilter } from '../components/dashboard/LabelFilter';
import { filterAssetsByLabels } from '../lib/calculations';
import type { Asset, AssetWithValueAndLabels, AssetType, Label } from '../types';

const assetTypeOrder: AssetType[] = [
  'stock',
  'real_estate',
  'gold',
  'cash',
  'crypto',
  'tax_advantaged',
  'other',
];

interface AssetsProps {
  assets: AssetWithValueAndLabels[];
  loading: boolean;
  onAddAsset: (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>, labelIds?: string[]) => Promise<Asset | null>;
  onDeleteAsset: (id: string) => Promise<void>;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

export function Assets({ assets, loading, onAddAsset, onDeleteAsset, labels, onCreateLabel }: AssetsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [sortState, setSortState] = useState<Record<AssetType, { sortBy: 'name' | 'ticker' | 'value' | 'shares' | 'created_at'; sortDir: 'asc' | 'desc' }>>(
    () => assetTypeOrder.reduce((acc, type) => {
      acc[type] = { sortBy: 'created_at', sortDir: 'desc' };
      return acc;
    }, {} as Record<AssetType, { sortBy: 'name' | 'ticker' | 'value' | 'shares' | 'created_at'; sortDir: 'asc' | 'desc' }>)
  );
  const [collapsedTables, setCollapsedTables] = useState<Record<AssetType, boolean>>(
    () => assetTypeOrder.reduce((acc, type) => {
      acc[type] = false;
      return acc;
    }, {} as Record<AssetType, boolean>)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    setDeletingId(id);
    try {
      await onDeleteAsset(id);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAssets = filterAssetsByLabels(assets, selectedLabelIds);

  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    if (!acc[asset.type]) {
      acc[asset.type] = [];
    }
    acc[asset.type].push(asset);
    return acc;
  }, {} as Record<AssetType, AssetWithValueAndLabels[]>);

  const sortAssets = (items: AssetWithValueAndLabels[], type: AssetType) => {
    const { sortBy, sortDir } = sortState[type] || { sortBy: 'created_at', sortDir: 'desc' };
    return [...items].sort((a, b) => {
      let result = 0;
      if (sortBy === 'name') {
        result = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'ticker') {
        const at = (a.ticker || '').toUpperCase();
        const bt = (b.ticker || '').toUpperCase();
        if (!at && !bt) result = 0;
        else if (!at) result = 1;
        else if (!bt) result = -1;
        else result = at.localeCompare(bt);
      } else if (sortBy === 'value') {
        result = a.calculated_value - b.calculated_value;
      } else if (sortBy === 'shares') {
        result = (a.shares || 0) - (b.shares || 0);
      } else {
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        result = ad - bd;
      }
      return sortDir === 'asc' ? result : -result;
    });
  };

  const sortedTypes = Object.keys(groupedAssets).sort((a, b) => {
    const totalA = groupedAssets[a as AssetType].reduce((sum, asset) => sum + asset.calculated_value, 0);
    const totalB = groupedAssets[b as AssetType].reduce((sum, asset) => sum + asset.calculated_value, 0);
    return totalB - totalA;
  }) as AssetType[];

  const handleSort = (type: AssetType, next: 'name' | 'ticker' | 'value' | 'shares' | 'created_at') => {
    setSortState((prev) => {
      const current = prev[type] || { sortBy: 'created_at', sortDir: 'desc' };
      if (current.sortBy === next) {
        return { ...prev, [type]: { sortBy: next, sortDir: current.sortDir === 'asc' ? 'desc' : 'asc' } };
      }
      const nextDir = next === 'created_at' || next === 'value' || next === 'shares' ? 'desc' : 'asc';
      return { ...prev, [type]: { sortBy: next, sortDir: nextDir } };
    });
  };

  const toggleCollapsed = (type: AssetType) => {
    setCollapsedTables((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Assets</h1>
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

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#3c3c3c] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#8a8a8a] mb-4">
            {assets.length === 0
              ? "You haven't added any assets yet"
              : 'No assets match the selected labels'}
          </p>
          {assets.length === 0 ? (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Asset
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedTypes.map((type) => {
            const typeAssets = sortAssets(groupedAssets[type], type);
            const typeTotal = typeAssets.reduce((sum, asset) => sum + asset.calculated_value, 0);
            const { sortBy, sortDir } = sortState[type] || { sortBy: 'created_at', sortDir: 'desc' };
            const isTaxAdvantaged = type === 'tax_advantaged';
            const taxAccounts = isTaxAdvantaged ? typeAssets.filter(asset => asset.is_account) : [];
            const taxPositions = isTaxAdvantaged ? typeAssets.filter(asset => !asset.is_account) : [];
            const positionsByAccount = isTaxAdvantaged
              ? taxPositions.reduce((acc, asset) => {
                  const parentId = asset.parent_asset_id;
                  if (!parentId) return acc;
                  if (!acc[parentId]) acc[parentId] = [];
                  acc[parentId].push(asset);
                  return acc;
                }, {} as Record<string, AssetWithValueAndLabels[]>)
              : {};
            const unassignedPositions = isTaxAdvantaged
              ? taxPositions.filter(asset => !asset.parent_asset_id)
              : [];
            return (
              <Card key={type} padding="none">
                <div className="px-6 py-4 border-b border-[#3c3c3c] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#e0e0e0]">{getAssetTypeLabel(type)}</h2>
                    <p className="text-xs text-[#8a8a8a]">{typeAssets.length} item{typeAssets.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-[#e0e0e0]">{formatCurrency(typeTotal)}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={() => toggleCollapsed(type)}
                    >
                      {collapsedTables[type] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {!collapsedTables[type] && (
                  <>
                    <div className="px-6 py-4 border-b border-[#3c3c3c]">
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_96px] gap-3 text-xs uppercase tracking-wide text-[#8a8a8a]">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-left hover:text-[#e0e0e0]"
                          onClick={() => handleSort(type, 'name')}
                        >
                          Name
                          {sortBy === 'name' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-left hover:text-[#e0e0e0]"
                          onClick={() => handleSort(type, 'ticker')}
                        >
                          Ticker
                          {sortBy === 'ticker' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-left hover:text-[#e0e0e0]"
                          onClick={() => handleSort(type, 'value')}
                        >
                          Value
                          {sortBy === 'value' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-left hover:text-[#e0e0e0]"
                          onClick={() => handleSort(type, 'shares')}
                        >
                          Shares
                          {sortBy === 'shares' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-left hover:text-[#e0e0e0]"
                          onClick={() => handleSort(type, 'created_at')}
                        >
                          Added
                          {sortBy === 'created_at' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                        <span className="text-right">Actions</span>
                      </div>
                    </div>
                    {isTaxAdvantaged ? (
                      <ul className="divide-y divide-[#3c3c3c]">
                        {taxAccounts.map((account) => {
                          const accountPositions = positionsByAccount[account.id] || [];
                          const accountTotal = accountPositions.reduce((sum, asset) => sum + asset.calculated_value, 0);
                          const sortedPositions = sortAssets(accountPositions, type);
                          return (
                            <li key={account.id} className="px-6 py-4">
                              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_96px] gap-3 items-center">
                                <div className="min-w-0">
                                  <p className="font-medium text-[#e0e0e0] truncate">{account.name}</p>
                                  <div className="flex items-center gap-2 flex-wrap mt-1">
                                    {account.labels && account.labels.length > 0 && account.labels.map(label => (
                                      <LabelChip key={label.id} label={label} size="sm" />
                                    ))}
                                    {account.account_type && (
                                      <span className="text-xs text-[#8a8a8a]">{account.account_type}</span>
                                    )}
                                    <span className="text-xs text-[#8a8a8a]">
                                      {accountPositions.length} position{accountPositions.length === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-[#8a8a8a]">Account</div>
                                <div className="text-sm text-[#e0e0e0]">
                                  {formatCurrency(accountTotal)}
                                </div>
                                <div className="text-sm text-[#8a8a8a]">—</div>
                                <div className="text-sm text-[#8a8a8a]">
                                  {account.created_at ? new Date(account.created_at).toLocaleDateString('en-US') : '—'}
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                  <Link to={`/assets/${account.id}`}>
                                    <Button variant="ghost" size="sm" className="p-2">
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 text-[#f14c4c] hover:bg-[#f14c4c]/10"
                                    onClick={() => handleDelete(account.id)}
                                    disabled={deletingId === account.id}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {sortedPositions.length > 0 && (
                                <ul className="mt-3 border-t border-[#3c3c3c]">
                                  {sortedPositions.map((position) => (
                                    <li key={position.id} className="py-3">
                                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_96px] gap-3 items-center">
                                        <div className="min-w-0 pl-4">
                                          <p className="text-sm text-[#e0e0e0] truncate">{position.name}</p>
                                        </div>
                                        <div className="text-sm text-[#8a8a8a]">
                                          {position.ticker ? (
                                            <Link
                                              to={`/holdings/${encodeURIComponent(position.ticker)}`}
                                              className="text-[#4fc1ff] hover:text-[#6dd0ff]"
                                            >
                                              {position.ticker}
                                            </Link>
                                          ) : (
                                            '—'
                                          )}
                                        </div>
                                        <div className="text-sm text-[#e0e0e0]">
                                          {formatCurrency(position.calculated_value)}
                                        </div>
                                        <div className="text-sm text-[#8a8a8a]">
                                          {position.shares ? position.shares.toFixed(4) : '—'}
                                        </div>
                                        <div className="text-sm text-[#8a8a8a]">
                                          {position.created_at ? new Date(position.created_at).toLocaleDateString('en-US') : '—'}
                                        </div>
                                        <div className="flex items-center justify-end gap-1">
                                          <Link to={`/assets/${position.id}`}>
                                            <Button variant="ghost" size="sm" className="p-2">
                                              <Edit2 className="w-4 h-4" />
                                            </Button>
                                          </Link>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-2 text-[#f14c4c] hover:bg-[#f14c4c]/10"
                                            onClick={() => handleDelete(position.id)}
                                            disabled={deletingId === position.id}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                        {unassignedPositions.length > 0 && (
                          <li className="px-6 py-4 bg-[#1f1f1f]/50 text-xs uppercase tracking-wide text-[#8a8a8a]">
                            Unassigned Positions
                          </li>
                        )}
                        {unassignedPositions.map((asset) => (
                          <li
                            key={asset.id}
                            className="px-6 py-4 hover:bg-[#2a2d2e]"
                          >
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_96px] gap-3 items-center">
                              <div className="min-w-0">
                                <p className="font-medium text-[#e0e0e0] truncate">{asset.name}</p>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                  {asset.labels && asset.labels.length > 0 && asset.labels.map(label => (
                                    <LabelChip key={label.id} label={label} size="sm" />
                                  ))}
                                  {asset.account_type && (
                                    <span className="text-xs text-[#8a8a8a]">{asset.account_type}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-[#8a8a8a]">
                                {asset.ticker ? (
                                  <Link
                                    to={`/holdings/${encodeURIComponent(asset.ticker)}`}
                                    className="text-[#4fc1ff] hover:text-[#6dd0ff]"
                                  >
                                    {asset.ticker}
                                  </Link>
                                ) : (
                                  '—'
                                )}
                              </div>
                              <div className="text-sm text-[#e0e0e0]">
                                {formatCurrency(asset.calculated_value)}
                              </div>
                              <div className="text-sm text-[#8a8a8a]">
                                {asset.shares ? asset.shares.toFixed(4) : '—'}
                              </div>
                              <div className="text-sm text-[#8a8a8a]">
                                {asset.created_at ? new Date(asset.created_at).toLocaleDateString('en-US') : '—'}
                              </div>
                              <div className="flex items-center justify-end gap-1">
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
                    ) : (
                      <ul className="divide-y divide-[#3c3c3c]">
                        {typeAssets.map((asset) => (
                          <li
                            key={asset.id}
                            className="px-6 py-4 hover:bg-[#2a2d2e]"
                          >
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_96px] gap-3 items-center">
                              <div className="min-w-0">
                                <p className="font-medium text-[#e0e0e0] truncate">{asset.name}</p>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                  {asset.labels && asset.labels.length > 0 && asset.labels.map(label => (
                                    <LabelChip key={label.id} label={label} size="sm" />
                                  ))}
                                  {asset.type === 'tax_advantaged' && asset.account_type && (
                                    <span className="text-xs text-[#8a8a8a]">{asset.account_type}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-[#8a8a8a]">
                                {asset.ticker ? (
                                  <Link
                                    to={`/holdings/${encodeURIComponent(asset.ticker)}`}
                                    className="text-[#4fc1ff] hover:text-[#6dd0ff]"
                                  >
                                    {asset.ticker}
                                  </Link>
                                ) : (
                                  '—'
                                )}
                              </div>
                              <div className="text-sm text-[#e0e0e0]">
                                {formatCurrency(asset.calculated_value)}
                              </div>
                              <div className="text-sm text-[#8a8a8a]">
                                {asset.shares ? asset.shares.toFixed(4) : '—'}
                              </div>
                              <div className="text-sm text-[#8a8a8a]">
                                {asset.created_at ? new Date(asset.created_at).toLocaleDateString('en-US') : '—'}
                              </div>
                              <div className="flex items-center justify-end gap-1">
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
                            {asset.cost_basis && asset.cost_basis > 0 && asset.type === 'stock' && asset.shares ? (
                              <p className="text-xs text-[#8a8a8a] mt-2">
                                Cost/Share: {formatCurrencyDetailed(asset.cost_basis)}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
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
          return await onAddAsset(assetData as Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>, labelIds);
        }}
        labels={labels}
        onCreateLabel={onCreateLabel}
      />
    </div>
  );
}
