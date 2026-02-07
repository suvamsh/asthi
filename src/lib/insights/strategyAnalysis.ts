import type { AssetType, AssetWithValue, TargetAssetAllocation, UserStrategyData, SectorPreference } from '../../types';
import { ALL_SECTORS } from './sectorBenchmarks';
import { getSectorWeights } from './portfolioAnalysis';

// --- Asset Allocation Comparison ---

export interface AllocationComparison {
  category: string;
  actual: number;
  target: number;
  diff: number;
}

export function computeAssetAllocationComparison(
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
  targetAllocation: TargetAssetAllocation,
): AllocationComparison[] {
  if (totalNetWorth <= 0) return [];

  const actualPct = (value: number) => (value / totalNetWorth) * 100;

  // stock + tax_advantaged = "Stocks" from user perspective
  const stocksActual = actualPct((breakdown.stock || 0) + (breakdown.tax_advantaged || 0));
  const bondsActual = 0; // No bonds AssetType yet
  const realEstateActual = actualPct(breakdown.real_estate || 0);
  const cashActual = actualPct(breakdown.cash || 0);
  const goldActual = actualPct(breakdown.gold || 0);
  const cryptoActual = actualPct(breakdown.crypto || 0);
  const otherActual = actualPct(breakdown.other || 0);

  const categories: { category: string; actual: number; target: number }[] = [
    { category: 'Stocks', actual: stocksActual, target: targetAllocation.stocks },
    { category: 'Bonds', actual: bondsActual, target: targetAllocation.bonds },
    { category: 'Real Estate', actual: realEstateActual, target: targetAllocation.real_estate },
    { category: 'Cash', actual: cashActual, target: targetAllocation.cash },
    { category: 'Gold', actual: goldActual, target: targetAllocation.gold },
    { category: 'Crypto', actual: cryptoActual, target: targetAllocation.crypto },
    { category: 'Other', actual: otherActual, target: targetAllocation.other },
  ];

  return categories
    .filter(c => c.actual > 0 || c.target > 0)
    .map(c => ({
      ...c,
      actual: Math.round(c.actual * 10) / 10,
      target: Math.round(c.target * 10) / 10,
      diff: Math.round((c.actual - c.target) * 10) / 10,
    }));
}

// --- Sector Comparison ---

export interface SectorComparison {
  sector: string;
  preference: SectorPreference;
  actualPercent: number;
  aligned: boolean;
}

export function computeSectorComparison(
  assets: AssetWithValue[],
  totalNetWorth: number,
  sectorPreferences: Record<string, SectorPreference>,
): SectorComparison[] {
  if (totalNetWorth <= 0) return [];

  const sectorWeights = getSectorWeights(assets, totalNetWorth);
  const sectorMap = new Map(sectorWeights.map(s => [s.sector, s]));

  return ALL_SECTORS.map(sector => {
    const alloc = sectorMap.get(sector);
    const portfolioWeight = alloc?.portfolioWeight ?? 0;
    const benchmarkWeight = alloc?.benchmarkWeight ?? 0;
    const preference = sectorPreferences[sector] || 'neutral';
    const actualPercent = Math.round(portfolioWeight * 1000) / 10;

    // Determine alignment
    let aligned = true;
    if (preference === 'overweight') {
      // Should be above benchmark — aligned if at or above
      aligned = portfolioWeight >= benchmarkWeight;
    } else if (preference === 'underweight') {
      // Should be below benchmark — aligned if at or below
      aligned = portfolioWeight <= benchmarkWeight;
    } else {
      // Neutral — aligned if within 2x of benchmark (or both near zero)
      if (benchmarkWeight > 0) {
        aligned = portfolioWeight <= benchmarkWeight * 2 && portfolioWeight >= benchmarkWeight * 0.3;
      } else {
        aligned = portfolioWeight < 0.05;
      }
    }

    return { sector, preference, actualPercent, aligned };
  });
}

// --- Strategy Alignment Score ---

export interface StrategyAlignmentScore {
  overall: number;
  assetAllocation: number;
  sectorAlignment: number;
  riskConsistency: number;
}

export function calculateStrategyAlignment(
  assets: AssetWithValue[],
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
  strategyData: UserStrategyData,
): StrategyAlignmentScore {
  if (totalNetWorth <= 0) {
    return { overall: 0, assetAllocation: 0, sectorAlignment: 0, riskConsistency: 0 };
  }

  const assetAllocation = scoreAssetAllocation(breakdown, totalNetWorth, strategyData.targetAllocation);
  const sectorAlignment = scoreSectorAlignment(assets, totalNetWorth, strategyData.sectorPreferences);
  const riskConsistency = scoreRiskConsistency(breakdown, totalNetWorth, strategyData.riskTolerance);

  const overall = Math.round(
    assetAllocation * 0.4 + sectorAlignment * 0.3 + riskConsistency * 0.3
  );

  return { overall, assetAllocation, sectorAlignment, riskConsistency };
}

function scoreAssetAllocation(
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
  target: TargetAssetAllocation,
): number {
  const comparison = computeAssetAllocationComparison(breakdown, totalNetWorth, target);
  if (comparison.length === 0) return 0;

  // Score based on average absolute deviation from targets
  const totalDev = comparison.reduce((sum, c) => sum + Math.abs(c.diff), 0);
  // 0% deviation = 100 score, 100% deviation = 0 score
  return Math.round(Math.max(0, Math.min(100, 100 - totalDev)));
}

function scoreSectorAlignment(
  assets: AssetWithValue[],
  totalNetWorth: number,
  sectorPreferences: Record<string, SectorPreference>,
): number {
  const comparisons = computeSectorComparison(assets, totalNetWorth, sectorPreferences);
  if (comparisons.length === 0) return 100;

  const alignedCount = comparisons.filter(c => c.aligned).length;
  return Math.round((alignedCount / comparisons.length) * 100);
}

function scoreRiskConsistency(
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
  riskTolerance: string,
): number {
  if (totalNetWorth <= 0) return 0;

  const equityPct = ((breakdown.stock || 0) + (breakdown.tax_advantaged || 0)) / totalNetWorth * 100;
  const cashPct = (breakdown.cash || 0) / totalNetWorth * 100;

  // Expected equity ranges for each risk level
  const ranges: Record<string, { minEquity: number; maxEquity: number; maxCash: number }> = {
    conservative: { minEquity: 20, maxEquity: 50, maxCash: 40 },
    moderate: { minEquity: 40, maxEquity: 75, maxCash: 25 },
    aggressive: { minEquity: 65, maxEquity: 100, maxCash: 15 },
  };

  const range = ranges[riskTolerance] || ranges.moderate;
  let score = 100;

  // Penalize if equity is outside expected range
  if (equityPct < range.minEquity) {
    score -= Math.min(50, (range.minEquity - equityPct) * 2);
  } else if (equityPct > range.maxEquity) {
    score -= Math.min(50, (equityPct - range.maxEquity) * 2);
  }

  // Penalize if cash exceeds expected max for risk level
  if (cashPct > range.maxCash) {
    score -= Math.min(30, (cashPct - range.maxCash) * 1.5);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

// --- Alignment Suggestions ---

export interface AlignmentSuggestion {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning';
}

export function generateAlignmentSuggestions(
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
  strategyData: UserStrategyData,
): AlignmentSuggestion[] {
  if (totalNetWorth <= 0) return [];

  const suggestions: AlignmentSuggestion[] = [];
  const comparison = computeAssetAllocationComparison(breakdown, totalNetWorth, strategyData.targetAllocation);

  for (const c of comparison) {
    const absDiff = Math.abs(c.diff);
    if (absDiff <= 5) continue;

    if (c.actual > c.target) {
      suggestions.push({
        id: `alloc-over-${c.category}`,
        title: `${c.category}: ${c.diff > 0 ? '+' : ''}${c.diff}% vs target`,
        description: `Your ${c.category} allocation is ${c.actual}% but your target is ${c.target}%. Consider trimming by ~${absDiff.toFixed(0)}%.`,
        severity: absDiff > 15 ? 'warning' : 'info',
      });
    } else {
      suggestions.push({
        id: `alloc-under-${c.category}`,
        title: `${c.category}: ${c.diff}% vs target`,
        description: `Your ${c.category} allocation is ${c.actual}% but your target is ${c.target}%. Consider adding ~${absDiff.toFixed(0)}% more.`,
        severity: absDiff > 15 ? 'warning' : 'info',
      });
    }
  }

  // Risk consistency suggestion
  const equityPct = ((breakdown.stock || 0) + (breakdown.tax_advantaged || 0)) / totalNetWorth * 100;
  if (strategyData.riskTolerance === 'conservative' && equityPct > 55) {
    suggestions.push({
      id: 'risk-conservative-high-equity',
      title: 'Equity allocation exceeds conservative target',
      description: `You selected conservative risk tolerance but have ${equityPct.toFixed(0)}% in equities. Consider moving some into bonds or cash.`,
      severity: 'warning',
    });
  } else if (strategyData.riskTolerance === 'aggressive' && equityPct < 60) {
    suggestions.push({
      id: 'risk-aggressive-low-equity',
      title: 'Equity allocation below aggressive target',
      description: `You selected aggressive risk tolerance but have only ${equityPct.toFixed(0)}% in equities. Consider increasing equity exposure.`,
      severity: 'info',
    });
  }

  return suggestions;
}
