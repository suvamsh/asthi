import { useState } from 'react';
import { Target, Pencil, BarChart3, PieChart, Lightbulb, Clock, Shield, Crosshair } from 'lucide-react';
import { useStrategy, DEFAULT_STRATEGY } from '../hooks/useStrategy';
import { StrategyEditor } from '../components/strategy/StrategyEditor';
import {
  StrategyAlignmentBanner,
  AllocationComparisonChart,
  SectorComparisonTable,
  AlignmentSuggestions,
} from '../components/strategy/AlignmentVisuals';
import {
  computeAssetAllocationComparison,
  computeSectorComparison,
  calculateStrategyAlignment,
  generateAlignmentSuggestions,
} from '../lib/insights/strategyAnalysis';
import { Button } from '../components/ui/Button';
import type { AssetType, AssetWithValueAndLabels, UserStrategyData } from '../types';

interface StrategyProps {
  assetsWithValues: AssetWithValueAndLabels[];
  breakdown: Record<AssetType, number>;
  totalNetWorth: number;
  userId: string;
  loading?: boolean;
}

const philosophyLabels: Record<string, string> = {
  boglehead: 'Boglehead',
  growth: 'Growth',
  value: 'Value',
  dividend: 'Dividend',
  index: 'Index',
  balanced: 'Balanced',
  aggressive_growth: 'Aggressive Growth',
  income: 'Income',
  custom: 'Custom',
};

const horizonLabels: Record<string, string> = {
  short: 'Short-term (< 3 yrs)',
  medium: 'Medium-term (3-10 yrs)',
  long: 'Long-term (10+ yrs)',
  retirement_target: 'Retirement Target',
};

const goalLabels: Record<string, string> = {
  retirement: 'Retirement',
  wealth_building: 'Wealth Building',
  income_generation: 'Income',
  emergency_fund: 'Emergency Fund',
  education: 'Education',
  house_purchase: 'House Purchase',
  custom: 'Custom',
};

export function Strategy({ assetsWithValues, breakdown, totalNetWorth, userId, loading }: StrategyProps) {
  const { strategyData, hasStrategy, loading: strategyLoading, saving, saveStrategy } = useStrategy(userId);
  const [editing, setEditing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  if (loading || strategyLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Strategy</h1>
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#4fc1ff] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Empty state — no strategy set
  if (!hasStrategy && !showSetup) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Strategy</h1>
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-8 text-center">
          <Target className="w-10 h-10 text-[#4fc1ff] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#e0e0e0] mb-2">Define Your Investment Strategy</h2>
          <p className="text-sm text-[#8a8a8a] mb-6 max-w-md mx-auto">
            Set your investment philosophy, risk tolerance, target allocation, and goals.
            Then see how your actual portfolio aligns with your stated strategy.
          </p>
          <Button onClick={() => setShowSetup(true)} className="gap-2">
            <Target className="w-4 h-4" />
            Set Up Your Strategy
          </Button>
        </div>
      </div>
    );
  }

  // Setup form (first time)
  if (!hasStrategy && showSetup) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Strategy</h1>
        <StrategyEditor
          initial={DEFAULT_STRATEGY}
          saving={saving}
          onSave={async (data) => {
            await saveStrategy(data);
            setShowSetup(false);
          }}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    );
  }

  // Strategy exists — show alignment dashboard
  const sd = strategyData!;

  // Edit mode
  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#e0e0e0]">Edit Strategy</h1>
        </div>
        <StrategyEditor
          initial={sd}
          saving={saving}
          onSave={async (data) => {
            await saveStrategy(data);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  // Compute all analysis
  const alignmentScore = calculateStrategyAlignment(assetsWithValues, breakdown, totalNetWorth, sd);
  const allocationComparison = computeAssetAllocationComparison(breakdown, totalNetWorth, sd.targetAllocation);
  const sectorComparison = computeSectorComparison(assetsWithValues, totalNetWorth, sd.sectorPreferences);
  const suggestions = generateAlignmentSuggestions(breakdown, totalNetWorth, sd);

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">Strategy</h1>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-2">
          <Pencil className="w-4 h-4" />
          Edit
        </Button>
      </div>

      {/* Alignment Banner */}
      <div className="flex-shrink-0">
        <StrategyAlignmentBanner score={alignmentScore} />
      </div>

      {/* 2x2 Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[1fr_1fr] gap-2">
        {/* Top-left: Strategy Summary */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#3c3c3c] flex-shrink-0">
            <Crosshair className="w-4 h-4 text-[#4fc1ff] flex-shrink-0" />
            <span className="text-sm font-medium text-[#e0e0e0]">Your Strategy</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <StrategySummary data={sd} />
          </div>
        </div>

        {/* Top-right: Allocation Comparison */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#3c3c3c] flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-[#4fc1ff] flex-shrink-0" />
            <span className="text-sm font-medium text-[#e0e0e0]">Asset Allocation</span>
            <span className="text-xs text-[#8a8a8a]">Actual vs Target</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <AllocationComparisonChart data={allocationComparison} />
          </div>
        </div>

        {/* Bottom-left: Sector Preferences */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#3c3c3c] flex-shrink-0">
            <PieChart className="w-4 h-4 text-[#4fc1ff] flex-shrink-0" />
            <span className="text-sm font-medium text-[#e0e0e0]">Sector Preferences</span>
            <span className="text-xs text-[#8a8a8a]">
              {sectorComparison.filter(s => s.aligned).length}/{sectorComparison.length} aligned
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SectorComparisonTable data={sectorComparison} />
          </div>
        </div>

        {/* Bottom-right: Suggestions */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#3c3c3c] flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-[#cca700] flex-shrink-0" />
            <span className="text-sm font-medium text-[#e0e0e0]">Suggestions</span>
            {suggestions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-[#37373d] text-[#8a8a8a]">
                {suggestions.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <AlignmentSuggestions suggestions={suggestions} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Strategy Summary (read-only) ---

function StrategySummary({ data }: { data: UserStrategyData }) {
  const riskColors: Record<string, string> = {
    conservative: '#4ec9b0',
    moderate: '#cca700',
    aggressive: '#f14c4c',
  };

  return (
    <div className="space-y-3">
      {/* Philosophy */}
      <div className="flex items-start gap-2">
        <Target className="w-3.5 h-3.5 text-[#4fc1ff] mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-[11px] text-[#6e6e6e] block">Philosophy</span>
          <span className="text-xs text-[#e0e0e0]">{philosophyLabels[data.philosophy] || data.philosophy}</span>
        </div>
      </div>

      {/* Risk Tolerance */}
      <div className="flex items-start gap-2">
        <Shield className="w-3.5 h-3.5 text-[#4fc1ff] mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-[11px] text-[#6e6e6e] block">Risk Tolerance</span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{
              color: riskColors[data.riskTolerance],
              backgroundColor: `${riskColors[data.riskTolerance]}15`,
            }}
          >
            {data.riskTolerance.charAt(0).toUpperCase() + data.riskTolerance.slice(1)}
          </span>
        </div>
      </div>

      {/* Time Horizon */}
      <div className="flex items-start gap-2">
        <Clock className="w-3.5 h-3.5 text-[#4fc1ff] mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-[11px] text-[#6e6e6e] block">Time Horizon</span>
          <span className="text-xs text-[#e0e0e0]">
            {horizonLabels[data.timeHorizon] || data.timeHorizon}
            {data.retirementYear ? ` (${data.retirementYear})` : ''}
          </span>
        </div>
      </div>

      {/* Goals */}
      {data.goals.length > 0 && (
        <div className="flex items-start gap-2">
          <Crosshair className="w-3.5 h-3.5 text-[#4fc1ff] mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[11px] text-[#6e6e6e] block">Goals</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {data.goals.map((g, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-[#37373d] text-[#cccccc]">
                  {goalLabels[g.type] || g.type}
                  {g.targetAmount ? ` ($${g.targetAmount.toLocaleString()})` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="mt-2 pt-2 border-t border-[#3c3c3c]">
          <span className="text-[11px] text-[#6e6e6e] block mb-0.5">Notes</span>
          <p className="text-xs text-[#8a8a8a]">{data.notes}</p>
        </div>
      )}
    </div>
  );
}
