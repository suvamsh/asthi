import { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { LabelInput } from '../ui/LabelInput';
import { getGoldPrice } from '../../lib/goldApi';
import { formatCurrency } from '../../lib/calculations';
import type { Label } from '../../types';

interface GoldFormData {
  name: string;
  weight_oz: number;
  cost_basis?: number;
  notes?: string;
  labelIds?: string[];
}

interface GoldFormProps {
  onSubmit: (data: GoldFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

const GRAMS_PER_OZ = 31.1035;

export function GoldForm({ onSubmit, onCancel, loading, labels, onCreateLabel }: GoldFormProps) {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'oz' | 'grams'>('oz');
  const [costBasis, setCostBasis] = useState('');
  const [notes, setNotes] = useState('');
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPrice = async () => {
      setLoadingPrice(true);
      const price = await getGoldPrice();
      setGoldPrice(price);
      setLoadingPrice(false);
    };
    fetchPrice();
  }, []);

  const weightNum = parseFloat(weight) || 0;
  const weightOz = unit === 'grams' ? weightNum / GRAMS_PER_OZ : weightNum;
  const costBasisNum = parseFloat(costBasis) || 0;
  const estimatedValue = goldPrice ? weightOz * goldPrice : 0;
  const gainLoss = estimatedValue > 0 && costBasisNum > 0 ? estimatedValue - costBasisNum : null;
  const gainLossPercent = gainLoss !== null && costBasisNum > 0 ? (gainLoss / costBasisNum) * 100 : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !weight) return;

    onSubmit({
      name,
      weight_oz: weightOz,
      cost_basis: costBasisNum > 0 ? costBasisNum : undefined,
      notes: notes || undefined,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
    });
  };

  const isValid = name && weightOz > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Description"
        placeholder="e.g., Gold coins, Gold bar"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input
            label="Weight"
            type="number"
            placeholder={unit === 'oz' ? '1' : '31.1'}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min="0"
            step="any"
            required
          />
        </div>
        <Select
          label="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value as 'oz' | 'grams')}
          options={[
            { value: 'oz', label: 'Troy oz' },
            { value: 'grams', label: 'Grams' },
          ]}
        />
      </div>

      <Input
        label="Cost Basis (Total)"
        type="number"
        placeholder="e.g., 2000"
        value={costBasis}
        onChange={(e) => setCostBasis(e.target.value)}
        min="0"
        step="0.01"
        helpText="Total amount paid for purchase"
      />

      <Input
        label="Notes (optional)"
        placeholder="Purity, storage location, etc."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <LabelInput
        labels={labels}
        selectedLabelIds={selectedLabelIds}
        onChange={setSelectedLabelIds}
        onCreateLabel={onCreateLabel}
      />

      <div className="p-4 bg-[#dcdcaa]/10 border border-[#dcdcaa]/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-[#dcdcaa]">Current Gold Price</p>
          {loadingPrice ? (
            <div className="w-20 h-5 bg-[#dcdcaa]/20 rounded animate-pulse" />
          ) : goldPrice ? (
            <p className="font-medium text-[#dcdcaa]">{formatCurrency(goldPrice)}/oz</p>
          ) : (
            <p className="text-sm text-[#dcdcaa]/70">Unable to fetch price</p>
          )}
        </div>

        {weightOz > 0 && goldPrice && (
          <>
            <hr className="border-[#dcdcaa]/30 my-2" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#dcdcaa] mb-1">Current Value</p>
                <p className="text-2xl font-bold text-[#dcdcaa]">{formatCurrency(estimatedValue)}</p>
                <p className="text-xs text-[#dcdcaa]/70 mt-1">
                  {weightOz.toFixed(4)} oz x {formatCurrency(goldPrice)}/oz
                </p>
              </div>
              {gainLoss !== null && (
                <div className="text-right">
                  <p className="text-sm text-[#dcdcaa] mb-1">Gain/Loss</p>
                  <p className={`text-xl font-bold ${gainLoss >= 0 ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                    {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                  </p>
                  <p className={`text-xs ${gainLoss >= 0 ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                    {gainLoss >= 0 ? '+' : ''}{gainLossPercent?.toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Gold'}
        </Button>
      </div>
    </form>
  );
}
