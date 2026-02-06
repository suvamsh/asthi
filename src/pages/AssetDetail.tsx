import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LabelInput } from '../components/ui/LabelInput';
import { ManualAssetForm } from '../components/assets/ManualAssetForm';
import { formatCurrency, getAssetTypeLabel, getTotalCostBasis, getMonthlyMortgageBreakdown, getRealEstateMortgageBalance } from '../lib/calculations';
import type { Asset, AssetWithValueAndLabels, Label } from '../types';

interface AssetDetailProps {
  assets: AssetWithValueAndLabels[];
  onUpdateAsset: (id: string, updates: Partial<Asset>) => Promise<Asset>;
  onDeleteAsset: (id: string) => Promise<void>;
  onAddAsset: (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>, labelIds?: string[]) => Promise<Asset | null>;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
  onSetAssetLabels: (assetId: string, labelIds: string[]) => Promise<void>;
}

export function AssetDetail({ assets, onUpdateAsset, onDeleteAsset, onAddAsset, labels, onCreateLabel, onSetAssetLabels }: AssetDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const asset = assets.find(a => a.id === id);
  const childPositions = assets.filter(a => a.parent_asset_id === id);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingPosition, setAddingPosition] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [shares, setShares] = useState('');
  const [tickerInput, setTickerInput] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [mortgageRate, setMortgageRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [ownershipPercent, setOwnershipPercent] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [accountType, setAccountType] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Initialize form when asset loads
  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setShares(asset.shares?.toString() || '');
      setTickerInput(asset.ticker || '');
      setCurrentValue(asset.current_value?.toString() || '');
      setMortgageAmount(asset.mortgage_amount?.toString() || '');
      setMortgageRate(asset.mortgage_rate?.toString() || '');
      setMonthlyPayment(asset.monthly_payment?.toString() || '');
      setOwnershipPercent((asset.ownership_percent ?? 100).toString());
      setWeightOz(asset.weight_oz?.toString() || '');
      setManualValue(asset.manual_value?.toString() || '');
      setAccountType(asset.account_type || '');
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

  const accountTotal = asset.is_account
    ? childPositions.reduce((sum, position) => sum + position.calculated_value, 0)
    : asset.calculated_value;

  const handleSave = async () => {
    setLoading(true);
    try {
      const costBasisNum = parseFloat(costBasis) || undefined;
      const updates: Partial<Asset> = { name, notes, cost_basis: costBasisNum };

      if (asset.type === 'stock') {
        updates.shares = parseFloat(shares) || undefined;
        updates.purchase_date = purchaseDate || undefined;
      } else if (asset.type === 'real_estate') {
        updates.purchase_date = purchaseDate || undefined;
        updates.current_value = parseFloat(currentValue) || undefined;
        updates.mortgage_amount = parseFloat(mortgageAmount) || undefined;
        updates.mortgage_rate = parseFloat(mortgageRate) || undefined;
        updates.monthly_payment = parseFloat(monthlyPayment) || undefined;
        updates.ownership_percent = Math.max(0, Math.min(100, parseFloat(ownershipPercent) || 0));
      } else if (asset.type === 'gold') {
        updates.weight_oz = parseFloat(weightOz) || undefined;
      } else if (asset.type === 'tax_advantaged') {
        updates.account_type = accountType || undefined;
        if (!asset.is_account) {
          const nextTicker = tickerInput.trim() || undefined;
          updates.ticker = nextTicker;
          updates.shares = nextTicker ? (parseFloat(shares) || undefined) : undefined;
          updates.manual_value = nextTicker ? undefined : (parseFloat(manualValue) || undefined);
        }
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

  const handleAddPosition = async (data: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { labelIds?: string[] }) => {
    setAddingPosition(true);
    try {
      const { labelIds, ...assetData } = data;
      await onAddAsset(assetData, labelIds);
      setShowAddPosition(false);
    } catch (error) {
      console.error('Error adding position:', error);
    } finally {
      setAddingPosition(false);
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
              {formatCurrency(accountTotal)}
            </p>
          </div>
          {asset.cost_basis && asset.cost_basis > 0 && !asset.is_account && (
            <div className="text-right">
              <p className="text-sm text-[#8a8a8a]">Gain/Loss</p>
              {(() => {
                const totalCostBasis = getTotalCostBasis(asset);
                const gainLoss = accountTotal - totalCostBasis;
                const gainLossPercent = totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0;
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
                label="Purchase Date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
              <Input
                label="Current Estimated Value"
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                min="0"
                step="1000"
              />
              <Input
                label="Original Mortgage Amount"
                type="number"
                value={mortgageAmount}
                onChange={(e) => setMortgageAmount(e.target.value)}
                min="0"
                step="1000"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Mortgage Rate (APR %)"
                  type="number"
                  value={mortgageRate}
                  onChange={(e) => setMortgageRate(e.target.value)}
                  min="0"
                  step="0.001"
                />
                <Input
                  label="Monthly Payment"
                  type="number"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
              <Input
                label="Ownership (%)"
                type="number"
                value={ownershipPercent}
                onChange={(e) => setOwnershipPercent(e.target.value)}
                min="0"
                max="100"
                step="0.01"
                helpText="Your ownership stake in the property"
              />
              {(() => {
                const breakdown = getMonthlyMortgageBreakdown({
                  ...asset,
                  mortgage_amount: parseFloat(mortgageAmount) || undefined,
                  mortgage_rate: parseFloat(mortgageRate) || undefined,
                  monthly_payment: parseFloat(monthlyPayment) || undefined,
                });
                if (!breakdown) return null;
                const estimatedBalance = getRealEstateMortgageBalance({
                  ...asset,
                  mortgage_amount: parseFloat(mortgageAmount) || undefined,
                  mortgage_rate: parseFloat(mortgageRate) || undefined,
                  monthly_payment: parseFloat(monthlyPayment) || undefined,
                });
                return (
                  <div className="p-3 bg-[#4ec9b0]/10 border border-[#4ec9b0]/30 rounded-lg">
                    <p className="text-sm text-[#4ec9b0] mb-1">Monthly Payment Breakdown</p>
                    <p className="text-xs text-[#4ec9b0]/70">
                      Interest: {formatCurrency(breakdown.interest)} · Principal: {formatCurrency(breakdown.principal)}
                    </p>
                    <p className="text-xs text-[#4ec9b0]/70 mt-1">
                      Estimated Balance: {formatCurrency(estimatedBalance)}
                    </p>
                  </div>
                );
              })()}
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

          {asset.type === 'tax_advantaged' && (
            <>
              <Input
                label="Account Type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                placeholder="e.g., 401k, Roth IRA"
              />
              {!asset.is_account && (
                <>
                  <Input
                    label="Ticker (optional)"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    placeholder="e.g., VTSAX or AAPL"
                  />
                  <Input
                    label="Number of Shares"
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    min="0"
                    step="any"
                    helpText={tickerInput ? 'Required for live pricing' : 'Leave blank if using manual value'}
                  />
                  {!tickerInput && (
                    <Input
                      label="Current Value"
                      type="number"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  )}
                  <Input
                    label="Cost Basis (Per Share)"
                    type="number"
                    value={costBasis}
                    onChange={(e) => setCostBasis(e.target.value)}
                    min="0"
                    step="0.01"
                    helpText="Optional"
                  />
                </>
              )}
            </>
          )}

          {asset.type !== 'cash' && asset.type !== 'real_estate' && asset.type !== 'tax_advantaged' && (
            <Input
              label={asset.type === 'stock' ? 'Cost Basis (Per Share)' : 'Cost Basis (Total)'}
              type="number"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              min="0"
              step="0.01"
              helpText={asset.type === 'stock' ? 'Price paid per share' : 'Total amount paid for purchase'}
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

      {asset.is_account && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#e0e0e0]">Positions</h2>
              <p className="text-xs text-[#8a8a8a]">{childPositions.length} holding{childPositions.length === 1 ? '' : 's'}</p>
            </div>
            <Button
              type="button"
              onClick={() => setShowAddPosition((prev) => !prev)}
            >
              {showAddPosition ? 'Close' : 'Add Position'}
            </Button>
          </div>

          {showAddPosition && (
            <div className="mb-6">
              <ManualAssetForm
                defaultType="tax_advantaged"
                lockType
                parentAssetId={asset.id}
                defaultAccountType={asset.account_type || '401k'}
                lockAccountType
                onSubmit={(data) => handleAddPosition(data)}
                onCancel={() => setShowAddPosition(false)}
                loading={addingPosition}
                labels={labels}
                onCreateLabel={onCreateLabel}
              />
            </div>
          )}

          {childPositions.length === 0 ? (
            <p className="text-sm text-[#8a8a8a]">No positions added yet.</p>
          ) : (
            <ul className="divide-y divide-[#3c3c3c]">
              {childPositions.map((position) => (
                <li key={position.id} className="py-3">
                  <Link
                    to={`/assets/${position.id}`}
                    className="flex items-center justify-between hover:text-[#6dd0ff]"
                  >
                    <div>
                      <p className="font-medium text-[#e0e0e0]">{position.name}</p>
                      <p className="text-xs text-[#8a8a8a]">
                        {position.ticker ? position.ticker : 'Manual value'}
                      </p>
                    </div>
                    <p className="text-sm text-[#e0e0e0]">
                      {formatCurrency(position.calculated_value)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
