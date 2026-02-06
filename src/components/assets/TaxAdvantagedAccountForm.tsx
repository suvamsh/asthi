import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { LabelInput } from '../ui/LabelInput';
import type { AssetType, Label } from '../../types';

interface TaxAdvantagedAccountFormData {
  name: string;
  type: AssetType;
  account_type: string;
  is_account: boolean;
  notes?: string;
  labelIds?: string[];
}

interface TaxAdvantagedPositionDraft {
  name: string;
  pricing_mode: 'live' | 'manual';
  ticker?: string;
  shares?: number;
  manual_value?: number;
  cost_basis?: number;
  notes?: string;
}

interface TaxAdvantagedAccountFormProps {
  onSubmit: (data: { account: TaxAdvantagedAccountFormData; positions: TaxAdvantagedPositionDraft[] }) => void;
  onCancel: () => void;
  loading?: boolean;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

export function TaxAdvantagedAccountForm({
  onSubmit,
  onCancel,
  loading,
  labels,
  onCreateLabel,
}: TaxAdvantagedAccountFormProps) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('401k');
  const [notes, setNotes] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [positions, setPositions] = useState<TaxAdvantagedPositionDraft[]>([
    { name: '', pricing_mode: 'live', ticker: '', shares: undefined, manual_value: undefined, cost_basis: undefined },
  ]);

  const isValid = name.trim().length > 0;

  const updatePosition = (index: number, updates: Partial<TaxAdvantagedPositionDraft>) => {
    setPositions((prev) =>
      prev.map((position, idx) => (idx === index ? { ...position, ...updates } : position))
    );
  };

  const addPosition = () => {
    setPositions((prev) => [
      ...prev,
      { name: '', pricing_mode: 'live', ticker: '', shares: undefined, manual_value: undefined, cost_basis: undefined },
    ]);
  };

  const removePosition = (index: number) => {
    setPositions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const cleanedPositions = positions
      .map((position) => {
        const pricingMode = position.pricing_mode;
        return {
          name: position.name.trim(),
          pricing_mode: pricingMode,
          ticker: pricingMode === 'live' ? (position.ticker || '').trim() : undefined,
          shares: pricingMode === 'live' ? position.shares : undefined,
          manual_value: pricingMode === 'manual' ? position.manual_value : undefined,
          cost_basis: position.cost_basis,
          notes: position.notes,
        } as TaxAdvantagedPositionDraft;
      })
      .filter((position) => {
        if (!position.name) return false;
        if (position.pricing_mode === 'live') {
          return !!position.ticker && !!position.shares && position.shares > 0;
        }
        return !!position.manual_value && position.manual_value > 0;
      });

    onSubmit({
      account: {
        name: name.trim(),
        type: 'tax_advantaged',
        account_type: accountType,
        is_account: true,
        notes: notes || undefined,
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      },
      positions: cleanedPositions,
    });
  };

  const hasAnyPosition = positions.some((position) => position.name.trim().length > 0);
  const positionHelper = hasAnyPosition
    ? 'Add as many positions as you want. Leave blank to skip.'
    : 'Optional: add positions now or later inside the account.';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Account Name"
        placeholder="e.g., Fidelity 401(k)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        helpText="Create the account first, then add positions inside it."
        required
      />

      <Select
        label="Account Type"
        value={accountType}
        onChange={(e) => setAccountType(e.target.value)}
        options={[
          { value: '401k', label: '401(k)' },
          { value: 'roth_ira', label: 'Roth IRA' },
          { value: 'traditional_ira', label: 'Traditional IRA' },
          { value: 'hsa', label: 'HSA' },
          { value: '403b', label: '403(b)' },
          { value: '457b', label: '457(b)' },
          { value: 'sep_ira', label: 'SEP IRA' },
          { value: 'simple_ira', label: 'SIMPLE IRA' },
          { value: 'tsp', label: 'TSP' },
        ]}
      />

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[#cccccc]">Positions</p>
          <p className="text-xs text-[#8a8a8a]">{positionHelper}</p>
        </div>
        {positions.map((position, index) => (
          <div key={index} className="border border-[#3c3c3c] rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-[#8a8a8a]">Position {index + 1}</p>
              {positions.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removePosition(index)}>
                  Remove
                </Button>
              )}
            </div>

            <Input
              label="Holding Name"
              placeholder="e.g., PIMCO Total Return"
              value={position.name}
              onChange={(e) => updatePosition(index, { name: e.target.value })}
            />

            <Select
              label="Pricing"
              value={position.pricing_mode}
              onChange={(e) => updatePosition(index, { pricing_mode: e.target.value as 'live' | 'manual' })}
              options={[
                { value: 'live', label: 'Live price (ticker)' },
                { value: 'manual', label: 'Manual value' },
              ]}
            />

            {position.pricing_mode === 'live' ? (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ticker"
                  placeholder="e.g., VTSAX or AAPL"
                  value={position.ticker || ''}
                  onChange={(e) => updatePosition(index, { ticker: e.target.value })}
                />
                <Input
                  label="Shares"
                  type="number"
                  placeholder="e.g., 25"
                  value={position.shares?.toString() || ''}
                  onChange={(e) => updatePosition(index, { shares: parseFloat(e.target.value) || undefined })}
                  min="0"
                  step="any"
                />
              </div>
            ) : (
              <Input
                label="Current Value"
                type="number"
                placeholder="10000"
                value={position.manual_value?.toString() || ''}
                onChange={(e) => updatePosition(index, { manual_value: parseFloat(e.target.value) || undefined })}
                min="0"
                step="0.01"
              />
            )}

            <Input
              label={position.pricing_mode === 'live' ? 'Cost Basis (Per Share)' : 'Cost Basis (Total)'}
              type="number"
              placeholder="Optional"
              value={position.cost_basis?.toString() || ''}
              onChange={(e) => updatePosition(index, { cost_basis: parseFloat(e.target.value) || undefined })}
              min="0"
              step="0.01"
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addPosition}>
          Add Another Position
        </Button>
      </div>

      <Input
        label="Notes (optional)"
        placeholder="Plan details or provider info..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <LabelInput
        labels={labels}
        selectedLabelIds={selectedLabelIds}
        onChange={setSelectedLabelIds}
        onCreateLabel={onCreateLabel}
      />

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Account'}
        </Button>
      </div>
    </form>
  );
}
