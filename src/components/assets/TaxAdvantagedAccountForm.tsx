import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LabelInput } from '../ui/LabelInput';
import { TaxPositionEditor } from './TaxPositionEditor';
import type { TaxAdvantagedPositionDraft } from './TaxPositionEditor';
import type { AssetType, Label } from '../../types';

interface TaxAdvantagedAccountFormData {
  name: string;
  type: AssetType;
  account_type: string;
  is_account: boolean;
  notes?: string;
  labelIds?: string[];
}

interface TaxAdvantagedAccountFormProps {
  onSubmit: (data: { account: TaxAdvantagedAccountFormData; positions: TaxAdvantagedPositionDraft[] }) => void;
  onCancel: () => void;
  onStepChange?: (step: number, title: string) => void;
  loading?: boolean;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: '401k', label: '401(k)' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'traditional_ira', label: 'Traditional IRA' },
  { value: 'hsa', label: 'HSA' },
  { value: '403b', label: '403(b)' },
  { value: '457b', label: '457(b)' },
  { value: 'sep_ira', label: 'SEP IRA' },
  { value: 'simple_ira', label: 'SIMPLE IRA' },
  { value: 'tsp', label: 'TSP' },
];

const STEP_TITLES: Record<number, string> = {
  1: 'Select Account Type',
  2: 'Account Details',
  3: 'Add Positions',
};

function createPositionDraft(): TaxAdvantagedPositionDraft {
  return {
    id: crypto.randomUUID(),
    name: '',
    pricing_mode: 'live',
    ticker: '',
    shares: undefined,
    manual_value: undefined,
    cost_basis: undefined,
  };
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: 'Type' },
    { number: 2, label: 'Details' },
    { number: 3, label: 'Positions' },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const isUpcoming = currentStep < step.number;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                  isCompleted
                    ? 'bg-[#0e639c] border-[#0e639c] text-white'
                    : isCurrent
                      ? 'border-[#0e639c] bg-[#0e639c]/20 text-[#4fc1ff]'
                      : 'border-[#3c3c3c] text-[#6e6e6e]'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isUpcoming ? 'text-[#6e6e6e]' : 'text-[#cccccc]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mb-5 ${
                  currentStep > step.number ? 'bg-[#0e639c]' : 'bg-[#3c3c3c]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TaxAdvantagedAccountForm({
  onSubmit,
  onCancel,
  onStepChange,
  loading,
  labels,
  onCreateLabel,
}: TaxAdvantagedAccountFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('401k');
  const [notes, setNotes] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [positions, setPositions] = useState<TaxAdvantagedPositionDraft[]>([createPositionDraft()]);

  useEffect(() => {
    onStepChange?.(step, STEP_TITLES[step]);
  }, [step, onStepChange]);

  const updatePosition = (index: number, updates: Partial<TaxAdvantagedPositionDraft>) => {
    setPositions((prev) =>
      prev.map((position, idx) => (idx === index ? { ...position, ...updates } : position))
    );
  };

  const addPosition = () => {
    setPositions((prev) => [...prev, createPositionDraft()]);
  };

  const removePosition = (index: number) => {
    setPositions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;
    if (!name.trim()) return;

    const cleanedPositions = positions
      .map((position) => {
        const pricingMode = position.pricing_mode;
        return {
          id: position.id,
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

  const selectedTypeLabel = ACCOUNT_TYPE_OPTIONS.find((o) => o.value === accountType)?.label ?? accountType;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepIndicator currentStep={step} />

      {/* Step 1: Select Account Type */}
      {step === 1 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAccountType(option.value)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  accountType === option.value
                    ? 'border-[#0e639c] bg-[#0e639c]/10 text-[#e0e0e0]'
                    : 'border-[#3c3c3c] text-[#8a8a8a] hover:border-[#555] hover:text-[#cccccc]'
                }`}
              >
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="button" onClick={() => setStep(2)} className="flex-1">
              Next
            </Button>
          </div>
        </>
      )}

      {/* Step 2: Account Details */}
      {step === 2 && (
        <>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0e639c]/15 border border-[#0e639c]/30 text-xs font-medium text-[#4fc1ff]">
            {selectedTypeLabel}
          </div>

          <Input
            label="Account Name"
            placeholder="e.g., Fidelity 401(k)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helpText="Create the account first, then add positions inside it."
            required
            autoFocus
          />

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
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              disabled={!name.trim()}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Add Positions */}
      {step === 3 && (
        <>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0e639c]/15 border border-[#0e639c]/30 text-xs font-medium text-[#4fc1ff]">
            {selectedTypeLabel} — {name}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[#cccccc]">Positions</p>
              <p className="text-xs text-[#8a8a8a]">
                {positions.some((p) => p.name.trim().length > 0)
                  ? 'Add as many positions as you want. Leave blank to skip.'
                  : 'Optional: add positions now or later inside the account.'}
              </p>
            </div>
            {positions.map((position, index) => (
              <TaxPositionEditor
                key={position.id}
                index={index}
                position={position}
                onChange={(updates) => updatePosition(index, updates)}
                onRemove={() => removePosition(index)}
                showRemove={positions.length > 1}
              />
            ))}
            <Button type="button" variant="outline" onClick={addPosition}>
              Add Another Position
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
              Back
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
