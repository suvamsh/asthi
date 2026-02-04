import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LabelInput } from '../ui/LabelInput';
import { formatCurrency } from '../../lib/calculations';
import type { Label } from '../../types';

interface RealEstateFormData {
  name: string;
  purchase_price: number;
  purchase_date: string;
  down_payment: number;
  mortgage_amount: number;
  current_value: number;
  notes?: string;
  labelIds?: string[];
}

interface RealEstateFormProps {
  onSubmit: (data: RealEstateFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

export function RealEstateForm({ onSubmit, onCancel, loading, labels, onCreateLabel }: RealEstateFormProps) {
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const downPaymentNum = parseFloat(downPayment) || 0;
  const mortgageNum = parseFloat(mortgageAmount) || 0;
  const currentValueNum = parseFloat(currentValue) || purchasePriceNum;

  const equity = currentValueNum - mortgageNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purchasePrice) return;

    onSubmit({
      name,
      purchase_price: purchasePriceNum,
      purchase_date: purchaseDate,
      down_payment: downPaymentNum,
      mortgage_amount: mortgageNum,
      current_value: currentValueNum,
      notes: notes || undefined,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
    });
  };

  const isValid = name && purchasePriceNum > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Property Name"
        placeholder="e.g., 123 Main St"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Purchase Price"
          type="number"
          placeholder="300000"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          min="0"
          step="1000"
          required
        />

        <Input
          label="Purchase Date"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Down Payment"
          type="number"
          placeholder="60000"
          value={downPayment}
          onChange={(e) => setDownPayment(e.target.value)}
          min="0"
          step="1000"
        />

        <Input
          label="Current Mortgage Balance"
          type="number"
          placeholder="200000"
          value={mortgageAmount}
          onChange={(e) => setMortgageAmount(e.target.value)}
          min="0"
          step="1000"
          helpText="Remaining balance owed"
        />
      </div>

      <Input
        label="Current Estimated Value"
        type="number"
        placeholder="350000"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        min="0"
        step="1000"
        helpText="Leave blank to use purchase price"
      />

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

      {currentValueNum > 0 && (
        <div className="p-4 bg-[#4ec9b0]/10 border border-[#4ec9b0]/30 rounded-lg">
          <p className="text-sm text-[#4ec9b0] mb-1">Estimated Equity</p>
          <p className="text-2xl font-bold text-[#4ec9b0]">{formatCurrency(equity)}</p>
          <p className="text-xs text-[#4ec9b0]/70 mt-1">
            Current Value ({formatCurrency(currentValueNum)}) - Mortgage ({formatCurrency(mortgageNum)})
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Property'}
        </Button>
      </div>
    </form>
  );
}
