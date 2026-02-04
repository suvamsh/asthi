import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LabelInput } from '../components/ui/LabelInput';
import { formatCurrency, getAssetTypeLabel } from '../lib/calculations';
import type { Asset, AssetWithValueAndLabels, Label } from '../types';

interface AssetDetailProps {
  assets: AssetWithValueAndLabels[];
  onUpdateAsset: (id: string, updates: Partial<Asset>) => Promise<Asset>;
  onDeleteAsset: (id: string) => Promise<void>;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
  onSetAssetLabels: (assetId: string, labelIds: string[]) => Promise<void>;
}

export function AssetDetail({ assets, onUpdateAsset, onDeleteAsset, labels, onCreateLabel, onSetAssetLabels }: AssetDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const asset = assets.find(a => a.id === id);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [shares, setShares] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Initialize form when asset loads
  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setShares(asset.shares?.toString() || '');
      setCurrentValue(asset.current_value?.toString() || '');
      setMortgageAmount(asset.mortgage_amount?.toString() || '');
      setWeightOz(asset.weight_oz?.toString() || '');
      setManualValue(asset.manual_value?.toString() || '');
      setCostBasis(asset.cost_basis?.toString() || '');
      setPurchaseDate(asset.purchase_date || '');
      setNotes(asset.notes || '');
      setSelectedLabelIds(asset.labels?.map(l => l.id) || []);
    }
  }, [asset]);

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8a8a8a] mb-4">Asset not found</p>
        <Link to="/assets" className="text-[#4fc1ff] hover:text-[#6dd0ff]">
          Back to assets
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      const costBasisNum = parseFloat(costBasis) || undefined;
      const updates: Partial<Asset> = { name, notes, cost_basis: costBasisNum };

      if (asset.type === 'stock') {
        updates.shares = parseFloat(shares) || undefined;
        updates.purchase_date = purchaseDate || undefined;
      } else if (asset.type === 'real_estate') {
        updates.current_value = parseFloat(currentValue) || undefined;
        updates.mortgage_amount = parseFloat(mortgageAmount) || undefined;
      } else if (asset.type === 'gold') {
        updates.weight_oz = parseFloat(weightOz) || undefined;
      } else {
        updates.manual_value = parseFloat(manualValue) || undefined;
      }

      await onUpdateAsset(asset.id, updates);
      await onSetAssetLabels(asset.id, selectedLabelIds);
      navigate('/assets');
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    setDeleting(true);
    try {
      await onDeleteAsset(asset.id);
      navigate('/assets');
    } catch (error) {
      console.error('Error deleting asset:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/assets">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#e0e0e0]">{asset.name}</h1>
          <p className="text-[#8a8a8a]">{getAssetTypeLabel(asset.type)}</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3c3c3c]">
          <div>
            <p className="text-sm text-[#8a8a8a]">Current Value</p>
            <p className="text-2xl font-bold text-[#4fc1ff]">
              {formatCurrency(asset.calculated_value)}
            </p>
          </div>
          {asset.cost_basis && asset.cost_basis > 0 && (
            <div className="text-right">
              <p className="text-sm text-[#8a8a8a]">Gain/Loss</p>
              {(() => {
                const gainLoss = asset.calculated_value - asset.cost_basis;
                const gainLossPercent = (gainLoss / asset.cost_basis) * 100;
                const isPositive = gainLoss >= 0;
                return (
                  <>
                    <p className={`text-xl font-bold ${isPositive ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
                    </p>
                    <p className={`text-xs ${isPositive ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                      {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {asset.type === 'stock' && (
            <>
              <Input
                label="Ticker"
                value={asset.ticker || ''}
                disabled
                helpText="Ticker cannot be changed"
              />
              <Input
                label="Number of Shares"
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                min="0"
                step="any"
              />
              <Input
                label="Purchase Date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </>
          )}

          {asset.type === 'real_estate' && (
            <>
              <Input
                label="Current Estimated Value"
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                min="0"
                step="1000"
              />
              <Input
                label="Current Mortgage Balance"
                type="number"
                value={mortgageAmount}
                onChange={(e) => setMortgageAmount(e.target.value)}
                min="0"
                step="1000"
              />
            </>
          )}

          {asset.type === 'gold' && (
            <Input
              label="Weight (troy oz)"
              type="number"
              value={weightOz}
              onChange={(e) => setWeightOz(e.target.value)}
              min="0"
              step="any"
            />
          )}

          {['cash', 'crypto', 'other'].includes(asset.type) && (
            <Input
              label="Current Value"
              type="number"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              min="0"
              step="0.01"
            />
          )}

          {asset.type !== 'cash' && asset.type !== 'real_estate' && (
            <Input
              label="Cost Basis (Total)"
              type="number"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              min="0"
              step="0.01"
              helpText="Total amount paid for purchase"
            />
          )}

          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
          />

          <LabelInput
            labels={labels}
            selectedLabelIds={selectedLabelIds}
            onChange={setSelectedLabelIds}
            onCreateLabel={onCreateLabel}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/assets')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
