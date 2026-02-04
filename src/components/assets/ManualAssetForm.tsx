import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { LabelInput } from '../ui/LabelInput';
import type { AssetType, Label } from '../../types';

interface ManualAssetFormData {
  name: string;
  type: AssetType;
  manual_value: number;
  cost_basis?: number;
  account_type?: string;
  notes?: string;
  labelIds?: string[];
}

interface ManualAssetFormProps {
  defaultType?: AssetType;
  lockType?: boolean;
  onSubmit: (data: ManualAssetFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

export function ManualAssetForm({ defaultType = 'cash', lockType = false, onSubmit, onCancel, loading, labels, onCreateLabel }: ManualAssetFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>(defaultType);
  const [value, setValue] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [accountType, setAccountType] = useState('401k');
  const [notes, setNotes] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) return;

    const costBasisNum = parseFloat(costBasis) || 0;
    onSubmit({
      name,
      type,
      manual_value: parseFloat(value),
      cost_basis: costBasisNum > 0 ? costBasisNum : undefined,
      account_type: type === 'tax_advantaged' ? accountType : undefined,
      notes: notes || undefined,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
    });
  };

  const valueNum = parseFloat(value) || 0;
  const isValid = name && valueNum > 0;
  const showCostBasis = type === 'crypto' || type === 'other';
  const showAccountType = type === 'tax_advantaged';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!lockType && (
        <Select
          label="Asset Type"
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
          options={[
            { value: 'cash', label: 'Cash / Savings' },
            { value: 'crypto', label: 'Cryptocurrency' },
            { value: 'tax_advantaged', label: 'Tax Advantaged' },
            { value: 'other', label: 'Other' },
          ]}
        />
      )}

      <Input
        label="Asset Name"
        placeholder={
          type === 'cash'
            ? 'e.g., High-yield savings'
            : type === 'crypto'
            ? 'e.g., Bitcoin holdings'
            : 'e.g., Collectibles'
        }
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        label="Current Value"
        type="number"
        placeholder="10000"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min="0"
        step="0.01"
        required
      />

      {showAccountType && (
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
      )}

      {showCostBasis && (
        <Input
          label="Cost Basis (Total)"
          type="number"
          placeholder="e.g., 5000"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          min="0"
          step="0.01"
          helpText="Total amount paid for purchase"
        />
      )}

      <Input
        label="Notes (optional)"
        placeholder="Additional details..."
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
          {loading ? 'Adding...' : 'Add Asset'}
        </Button>
      </div>
    </form>
  );
}
