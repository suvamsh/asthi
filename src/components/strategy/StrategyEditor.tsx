import { useState } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ALL_SECTORS } from '../../lib/insights/sectorBenchmarks';
import type {
  UserStrategyData,
  InvestmentPhilosophy,
  TimeHorizon,
  RiskTolerance,
  SectorPreference,
  InvestmentGoal,
  InvestmentGoalEntry,
  TargetAssetAllocation,
} from '../../types';

interface StrategyEditorProps {
  initial: UserStrategyData;
  saving: boolean;
  onSave: (data: UserStrategyData) => void;
  onCancel?: () => void;
}

const philosophyOptions: { value: InvestmentPhilosophy; label: string }[] = [
  { value: 'boglehead', label: 'Boglehead (Low-cost index)' },
  { value: 'index', label: 'Index Investing' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'growth', label: 'Growth' },
  { value: 'aggressive_growth', label: 'Aggressive Growth' },
  { value: 'value', label: 'Value Investing' },
  { value: 'dividend', label: 'Dividend / Income' },
  { value: 'income', label: 'Income Focused' },
  { value: 'custom', label: 'Custom' },
];

const timeHorizonOptions: { value: TimeHorizon; label: string }[] = [
  { value: 'short', label: 'Short (< 3 years)' },
  { value: 'medium', label: 'Medium (3-10 years)' },
  { value: 'long', label: 'Long (10+ years)' },
  { value: 'retirement_target', label: 'Retirement Target Year' },
];

const goalOptions: { value: InvestmentGoal; label: string }[] = [
  { value: 'retirement', label: 'Retirement' },
  { value: 'wealth_building', label: 'Wealth Building' },
  { value: 'income_generation', label: 'Income Generation' },
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'education', label: 'Education' },
  { value: 'house_purchase', label: 'House Purchase' },
  { value: 'custom', label: 'Custom' },
];

const allocationKeys: { key: keyof TargetAssetAllocation; label: string }[] = [
  { key: 'stocks', label: 'Stocks' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'real_estate', label: 'Real Estate' },
  { key: 'cash', label: 'Cash' },
  { key: 'gold', label: 'Gold' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'other', label: 'Other' },
];

export function StrategyEditor({ initial, saving, onSave, onCancel }: StrategyEditorProps) {
  const [data, setData] = useState<UserStrategyData>({ ...initial });

  const allocationTotal = Object.values(data.targetAllocation).reduce((s, v) => s + v, 0);
  const remaining = 100 - allocationTotal;

  const updateAllocation = (key: keyof TargetAssetAllocation, value: number) => {
    setData(prev => ({
      ...prev,
      targetAllocation: { ...prev.targetAllocation, [key]: Math.max(0, Math.min(100, value)) },
    }));
  };

  const updateSectorPref = (sector: string, pref: SectorPreference) => {
    setData(prev => ({
      ...prev,
      sectorPreferences: { ...prev.sectorPreferences, [sector]: pref },
    }));
  };

  const addGoal = () => {
    setData(prev => ({
      ...prev,
      goals: [...prev.goals, { type: 'wealth_building' as InvestmentGoal }],
    }));
  };

  const updateGoal = (index: number, updates: Partial<InvestmentGoalEntry>) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map((g, i) => i === index ? { ...g, ...updates } : g),
    }));
  };

  const removeGoal = (index: number) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const canSave = allocationTotal === 100;

  return (
    <div className="space-y-4">
      {/* Philosophy */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#e0e0e0] mb-3">Investment Philosophy</h3>
        <Select
          options={philosophyOptions}
          value={data.philosophy}
          onChange={e => setData(prev => ({ ...prev, philosophy: e.target.value as InvestmentPhilosophy }))}
        />
      </div>

      {/* Time Horizon */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#e0e0e0] mb-3">Time Horizon</h3>
        <Select
          options={timeHorizonOptions}
          value={data.timeHorizon}
          onChange={e => setData(prev => ({ ...prev, timeHorizon: e.target.value as TimeHorizon }))}
        />
        {data.timeHorizon === 'retirement_target' && (
          <div className="mt-3">
            <Input
              type="number"
              label="Retirement Year"
              value={data.retirementYear || ''}
              onChange={e => setData(prev => ({ ...prev, retirementYear: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="e.g. 2055"
              min={new Date().getFullYear()}
              max={2100}
            />
          </div>
        )}
      </div>

      {/* Risk Tolerance */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#e0e0e0] mb-3">Risk Tolerance</h3>
        <div className="flex gap-2">
          {(['conservative', 'moderate', 'aggressive'] as RiskTolerance[]).map(level => (
            <button
              key={level}
              onClick={() => setData(prev => ({ ...prev, riskTolerance: level }))}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                data.riskTolerance === level
                  ? level === 'conservative'
                    ? 'bg-[#4ec9b0]/20 text-[#4ec9b0] border border-[#4ec9b0]/40'
                    : level === 'moderate'
                    ? 'bg-[#cca700]/20 text-[#cca700] border border-[#cca700]/40'
                    : 'bg-[#f14c4c]/20 text-[#f14c4c] border border-[#f14c4c]/40'
                  : 'bg-[#3c3c3c] text-[#8a8a8a] border border-[#3c3c3c] hover:bg-[#4a4a4a]'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Target Allocation */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#e0e0e0]">Target Asset Allocation</h3>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
            remaining === 0
              ? 'bg-[#4ec9b0]/15 text-[#4ec9b0]'
              : remaining > 0
              ? 'bg-[#cca700]/15 text-[#cca700]'
              : 'bg-[#f14c4c]/15 text-[#f14c4c]'
          }`}>
            {remaining === 0 ? 'Total: 100%' : remaining > 0 ? `Remaining: ${remaining}%` : `Over by ${Math.abs(remaining)}%`}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allocationKeys.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-[#8a8a8a] mb-1">{label}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={data.targetAllocation[key]}
                  onChange={e => updateAllocation(key, parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-[#3c3c3c] border border-[#3c3c3c] rounded text-sm text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                />
                <span className="text-xs text-[#6e6e6e]">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Preferences */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#e0e0e0] mb-3">Sector Preferences</h3>
        <div className="space-y-2">
          {ALL_SECTORS.map(sector => {
            const pref = data.sectorPreferences[sector] || 'neutral';
            return (
              <div key={sector} className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#cccccc] min-w-[140px]">{sector}</span>
                <div className="flex gap-1">
                  {(['underweight', 'neutral', 'overweight'] as SectorPreference[]).map(p => (
                    <button
                      key={p}
                      onClick={() => updateSectorPref(sector, p)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        pref === p
                          ? p === 'overweight'
                            ? 'bg-[#4ec9b0]/20 text-[#4ec9b0]'
                            : p === 'underweight'
                            ? 'bg-[#f14c4c]/20 text-[#f14c4c]'
                            : 'bg-[#4fc1ff]/20 text-[#4fc1ff]'
                          : 'text-[#6e6e6e] hover:text-[#8a8a8a]'
                      }`}
                    >
                      {p === 'underweight' ? 'Under' : p === 'overweight' ? 'Over' : 'Neutral'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#e0e0e0]">Investment Goals</h3>
          <Button variant="ghost" size="sm" onClick={addGoal} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Goal
          </Button>
        </div>
        {data.goals.length === 0 ? (
          <p className="text-xs text-[#6e6e6e]">No goals set. Add one to track progress.</p>
        ) : (
          <div className="space-y-3">
            {data.goals.map((goal, i) => (
              <div key={i} className="flex items-start gap-2 bg-[#1e1e1e] rounded p-2">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select
                    options={goalOptions}
                    value={goal.type}
                    onChange={e => updateGoal(i, { type: e.target.value as InvestmentGoal })}
                  />
                  <Input
                    type="number"
                    placeholder="Target amount"
                    value={goal.targetAmount || ''}
                    onChange={e => updateGoal(i, { targetAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                  <Input
                    type="date"
                    placeholder="Target date"
                    value={goal.targetDate || ''}
                    onChange={e => updateGoal(i, { targetDate: e.target.value || undefined })}
                  />
                </div>
                <button
                  onClick={() => removeGoal(i)}
                  className="p-1 text-[#6e6e6e] hover:text-[#f14c4c] transition-colors mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#e0e0e0] mb-3">Notes</h3>
        <textarea
          value={data.notes || ''}
          onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional notes about your strategy..."
          rows={3}
          className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded-md text-sm text-[#cccccc] placeholder-[#6e6e6e] focus:outline-none focus:ring-2 focus:ring-[#0e639c] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => onSave(data)}
          disabled={!canSave || saving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Strategy'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {!canSave && (
          <span className="text-xs text-[#f14c4c]">
            Allocation must sum to 100% (currently {allocationTotal}%)
          </span>
        )}
      </div>
    </div>
  );
}
