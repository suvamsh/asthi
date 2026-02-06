import type { AssetWithValue, AssetType } from '../../types';
import type { Insight, PortfolioHealthScore, SectorAllocation } from './insightTypes';
import { SP500_SECTOR_WEIGHTS, ALL_SECTORS } from './sectorBenchmarks';
import { getTickerSectorSync } from '../sectorMapping';
import { getTotalCostBasis } from '../calculations';

// --- Portfolio Health Score ---

export function calculateHealthScore(
  assets: AssetWithValue[],
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
): PortfolioHealthScore {
  if (assets.length === 0 || totalNetWorth <= 0) {
    return { overall: 0, concentration: 0, sectorDiversity: 0, typeBalance: 0, holdingCount: 0 };
  }

  const concentration = scoreConcentration(assets, totalNetWorth);
  const sectorDiversity = scoreSectorDiversity(assets, totalNetWorth);
  const typeBalance = scoreTypeBalance(breakdown, totalNetWorth);
  const holdingCount = scoreHoldingCount(assets);

  const overall = Math.round(
    concentration * 0.3 + sectorDiversity * 0.3 + typeBalance * 0.2 + holdingCount * 0.2
  );

  return { overall, concentration, sectorDiversity, typeBalance, holdingCount };
}

function scoreConcentration(assets: AssetWithValue[], total: number): number {
  if (total <= 0) return 0;
  const weights = assets
    .filter(a => !a.is_account)
    .map(a => a.calculated_value / total);
  // HHI = sum of squared weights (0 to 1, lower is better)
  const hhi = weights.reduce((sum, w) => sum + w * w, 0);
  // Score: HHI of 1 (single asset) = 0, HHI approaching 0 = 100
  return Math.round(Math.max(0, Math.min(100, (1 - hhi) * 100)));
}

function scoreSectorDiversity(assets: AssetWithValue[], total: number): number {
  if (total <= 0) return 0;
  const sectors = getSectorWeights(assets, total);
  const coveredSectors = sectors.filter(s => s.portfolioWeight > 0.01).length;
  const totalSectors = ALL_SECTORS.length;
  // Score based on how many benchmark sectors are represented
  return Math.round(Math.min(100, (coveredSectors / totalSectors) * 100 * 1.5));
}

function scoreTypeBalance(breakdown: Record<AssetType, number>, total: number): number {
  if (total <= 0) return 0;
  const activeTypes = Object.values(breakdown).filter(v => v > 0).length;
  const maxWeight = Math.max(...Object.values(breakdown)) / total;
  // Penalize if one type dominates (>80%)
  const diversityBonus = Math.min(activeTypes * 15, 60);
  const concentrationPenalty = maxWeight > 0.8 ? (maxWeight - 0.8) * 200 : 0;
  return Math.round(Math.max(0, Math.min(100, diversityBonus + 40 - concentrationPenalty)));
}

function scoreHoldingCount(assets: AssetWithValue[]): number {
  const count = assets.filter(a => !a.is_account && a.calculated_value > 0).length;
  // 1 asset = 20, 5 = 60, 10+ = 100
  if (count <= 0) return 0;
  if (count >= 10) return 100;
  return Math.round(20 + (count - 1) * (80 / 9));
}

// --- Sector Exposure ---

export function getSectorWeights(
  assets: AssetWithValue[],
  totalNetWorth: number,
): SectorAllocation[] {
  const sectorValues = new Map<string, number>();

  for (const asset of assets) {
    if (asset.is_account) continue;
    if ((asset.type === 'stock' || asset.type === 'tax_advantaged') && asset.ticker) {
      const info = getTickerSectorSync(asset.ticker);
      if (info) {
        sectorValues.set(info.sector, (sectorValues.get(info.sector) || 0) + asset.calculated_value);
      }
    }
  }

  const allSectors = new Set([...ALL_SECTORS, ...sectorValues.keys()]);
  const allocations: SectorAllocation[] = [];

  for (const sector of allSectors) {
    const portfolioValue = sectorValues.get(sector) || 0;
    const portfolioWeight = totalNetWorth > 0 ? portfolioValue / totalNetWorth : 0;
    const benchmarkWeight = SP500_SECTOR_WEIGHTS[sector] || 0;
    allocations.push({
      sector,
      portfolioWeight,
      benchmarkWeight,
      diff: portfolioWeight - benchmarkWeight,
    });
  }

  // Sort by benchmark weight descending
  allocations.sort((a, b) => b.benchmarkWeight - a.benchmarkWeight);
  return allocations;
}

// --- Insight Generators ---

export function generateConcentrationInsights(
  assets: AssetWithValue[],
  totalNetWorth: number,
): Insight[] {
  if (totalNetWorth <= 0) return [];
  const insights: Insight[] = [];

  const positions = assets
    .filter(a => !a.is_account && a.calculated_value > 0)
    .map(a => ({
      name: a.name,
      ticker: a.ticker,
      weight: a.calculated_value / totalNetWorth,
      value: a.calculated_value,
    }))
    .sort((a, b) => b.weight - a.weight);

  for (const pos of positions) {
    if (pos.weight >= 0.40) {
      insights.push({
        id: `conc-critical-${pos.ticker || pos.name}`,
        category: 'concentration',
        severity: 'critical',
        title: `${pos.ticker || pos.name} is ${(pos.weight * 100).toFixed(0)}% of your portfolio`,
        description: `A single position over 40% creates extreme concentration risk. Consider trimming to reduce exposure.`,
        metric: `${(pos.weight * 100).toFixed(1)}%`,
        tickers: pos.ticker ? [pos.ticker] : undefined,
      });
    } else if (pos.weight >= 0.25) {
      insights.push({
        id: `conc-warning-${pos.ticker || pos.name}`,
        category: 'concentration',
        severity: 'warning',
        title: `${pos.ticker || pos.name} is ${(pos.weight * 100).toFixed(0)}% of your portfolio`,
        description: `Single position over 25% creates significant concentration risk. Consider diversifying.`,
        metric: `${(pos.weight * 100).toFixed(1)}%`,
        tickers: pos.ticker ? [pos.ticker] : undefined,
      });
    } else if (pos.weight >= 0.15) {
      insights.push({
        id: `conc-info-${pos.ticker || pos.name}`,
        category: 'concentration',
        severity: 'info',
        title: `${pos.ticker || pos.name} is ${(pos.weight * 100).toFixed(0)}% of your portfolio`,
        description: `Position over 15% — worth monitoring. Standard diversification suggests <10% per position.`,
        metric: `${(pos.weight * 100).toFixed(1)}%`,
        tickers: pos.ticker ? [pos.ticker] : undefined,
      });
    }
  }

  // Top-3 concentration check
  const top3Weight = positions.slice(0, 3).reduce((s, p) => s + p.weight, 0);
  if (top3Weight >= 0.60 && positions.length > 3) {
    const top3Names = positions.slice(0, 3).map(p => p.ticker || p.name).join(', ');
    insights.push({
      id: 'conc-top3',
      category: 'concentration',
      severity: 'warning',
      title: `Top 3 positions are ${(top3Weight * 100).toFixed(0)}% of portfolio`,
      description: `${top3Names} together represent over 60% of your portfolio. High concentration in few positions increases volatility.`,
      metric: `${(top3Weight * 100).toFixed(1)}%`,
      tickers: positions.slice(0, 3).filter(p => p.ticker).map(p => p.ticker!),
    });
  }

  return insights;
}

export function generateSectorInsights(
  assets: AssetWithValue[],
  totalNetWorth: number,
): Insight[] {
  if (totalNetWorth <= 0) return [];
  const insights: Insight[] = [];
  const allocations = getSectorWeights(assets, totalNetWorth);

  for (const alloc of allocations) {
    if (alloc.benchmarkWeight === 0) continue;

    // Overweight: portfolio > 2x benchmark
    if (alloc.portfolioWeight > alloc.benchmarkWeight * 2 && alloc.portfolioWeight > 0.05) {
      insights.push({
        id: `sector-over-${alloc.sector}`,
        category: 'sector',
        severity: 'warning',
        title: `Overweight in ${alloc.sector}`,
        description: `Your ${alloc.sector} allocation is ${(alloc.portfolioWeight * 100).toFixed(0)}% vs S&P 500 benchmark of ${(alloc.benchmarkWeight * 100).toFixed(0)}%. Consider rebalancing.`,
        metric: `+${(alloc.diff * 100).toFixed(0)}%`,
      });
    }

    // Missing sector: 0% when benchmark > 5%
    if (alloc.portfolioWeight === 0 && alloc.benchmarkWeight >= 0.05) {
      insights.push({
        id: `sector-missing-${alloc.sector}`,
        category: 'sector',
        severity: 'info',
        title: `No ${alloc.sector} exposure`,
        description: `${alloc.sector} is ${(alloc.benchmarkWeight * 100).toFixed(0)}% of the S&P 500 but you have no exposure. Consider adding for diversification.`,
        metric: `-${(alloc.benchmarkWeight * 100).toFixed(0)}%`,
      });
    }
  }

  return insights;
}

export function generateAssetTypeInsights(
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
): Insight[] {
  if (totalNetWorth <= 0) return [];
  const insights: Insight[] = [];

  const equityWeight = ((breakdown.stock || 0) + (breakdown.tax_advantaged || 0)) / totalNetWorth;
  const cashWeight = (breakdown.cash || 0) / totalNetWorth;

  if (equityWeight > 0.90) {
    insights.push({
      id: 'type-equities-high',
      category: 'asset_type',
      severity: 'warning',
      title: `${(equityWeight * 100).toFixed(0)}% in equities`,
      description: `Over 90% in stocks increases volatility. Consider bonds, real estate, or other asset classes for balance.`,
      metric: `${(equityWeight * 100).toFixed(0)}%`,
    });
  }

  if (cashWeight > 0.30) {
    insights.push({
      id: 'type-cash-high',
      category: 'asset_type',
      severity: 'info',
      title: `${(cashWeight * 100).toFixed(0)}% in cash`,
      description: `Over 30% in cash may drag returns over time. Consider deploying into investments if aligned with your goals.`,
      metric: `${(cashWeight * 100).toFixed(0)}%`,
    });
  }

  const activeTypes = Object.entries(breakdown).filter(([_, v]) => v > 0).length;
  if (activeTypes === 1 && totalNetWorth > 0) {
    insights.push({
      id: 'type-single',
      category: 'asset_type',
      severity: 'warning',
      title: 'Single asset type',
      description: 'Your entire portfolio is in one asset type. Diversifying across asset classes can reduce risk.',
    });
  }

  return insights;
}

export function generateRebalancingInsights(
  assets: AssetWithValue[],
  totalNetWorth: number,
): Insight[] {
  if (totalNetWorth <= 0) return [];
  const insights: Insight[] = [];
  const allocations = getSectorWeights(assets, totalNetWorth);

  const overweight = allocations.filter(
    a => a.portfolioWeight > a.benchmarkWeight * 1.5 && a.portfolioWeight > 0.05
  );
  const underweight = allocations.filter(
    a => a.portfolioWeight < a.benchmarkWeight * 0.5 && a.benchmarkWeight >= 0.05
  );

  if (overweight.length > 0 && underweight.length > 0) {
    const overSectors = overweight.map(a => a.sector).slice(0, 2).join(', ');
    const underSectors = underweight.map(a => a.sector).slice(0, 2).join(', ');
    insights.push({
      id: 'rebalance-suggestion',
      category: 'rebalancing',
      severity: 'info',
      title: `Consider rebalancing: ${overSectors} to ${underSectors}`,
      description: `You're overweight in ${overSectors} and underweight in ${underSectors} relative to S&P 500 benchmarks.`,
    });
  }

  return insights;
}

export function generatePerformanceInsights(
  assets: AssetWithValue[],
): Insight[] {
  const insights: Insight[] = [];

  const withPerf = assets
    .filter(a => !a.is_account && a.cost_basis && a.cost_basis > 0 && a.calculated_value > 0)
    .map(a => {
      const totalCost = getTotalCostBasis(a);
      const gain = a.calculated_value - totalCost;
      const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
      return { name: a.name, ticker: a.ticker, gain, gainPct, value: a.calculated_value };
    })
    .sort((a, b) => b.gain - a.gain);

  if (withPerf.length === 0) return insights;

  // Top performer
  const best = withPerf[0];
  if (best.gain > 0) {
    insights.push({
      id: `perf-top-${best.ticker || best.name}`,
      category: 'performance',
      severity: 'positive',
      title: `${best.ticker || best.name} is your top performer`,
      description: `Up $${Math.abs(best.gain).toLocaleString('en-US', { maximumFractionDigits: 0 })} (${best.gainPct.toFixed(1)}%) from cost basis.`,
      metric: `+${best.gainPct.toFixed(1)}%`,
      tickers: best.ticker ? [best.ticker] : undefined,
    });
  }

  // Biggest drag
  const worst = withPerf[withPerf.length - 1];
  if (worst.gain < 0 && worst !== best) {
    insights.push({
      id: `perf-drag-${worst.ticker || worst.name}`,
      category: 'performance',
      severity: 'warning',
      title: `${worst.ticker || worst.name} is your biggest drag`,
      description: `Down $${Math.abs(worst.gain).toLocaleString('en-US', { maximumFractionDigits: 0 })} (${worst.gainPct.toFixed(1)}%) from cost basis.`,
      metric: `${worst.gainPct.toFixed(1)}%`,
      tickers: worst.ticker ? [worst.ticker] : undefined,
    });
  }

  return insights;
}

export function generateTaxInsights(
  assets: AssetWithValue[],
): Insight[] {
  const insights: Insight[] = [];

  const losses = assets
    .filter(a => {
      if (a.is_account || !a.cost_basis || a.cost_basis <= 0) return false;
      // Skip tax-advantaged accounts (no tax-loss harvesting benefit)
      if (a.type === 'tax_advantaged') return false;
      const totalCost = getTotalCostBasis(a);
      return a.calculated_value < totalCost;
    })
    .map(a => {
      const totalCost = getTotalCostBasis(a);
      const loss = totalCost - a.calculated_value;
      return { name: a.name, ticker: a.ticker, loss };
    })
    .filter(a => a.loss >= 3000)
    .sort((a, b) => b.loss - a.loss);

  for (const item of losses) {
    insights.push({
      id: `tax-harvest-${item.ticker || item.name}`,
      category: 'tax',
      severity: 'info',
      title: `Tax-loss harvesting opportunity: ${item.ticker || item.name}`,
      description: `Unrealized loss of $${item.loss.toLocaleString('en-US', { maximumFractionDigits: 0 })}. Consider selling to offset capital gains (up to $3,000/year against ordinary income).`,
      metric: `-$${item.loss.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      tickers: item.ticker ? [item.ticker] : undefined,
    });
  }

  return insights;
}
