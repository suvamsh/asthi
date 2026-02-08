import type { AssetType, AssetWithValue, UserStrategyData } from '../types';

export function generateSuggestedQuestions(
  assets: AssetWithValue[],
  breakdown: Record<AssetType, number>,
  totalNetWorth: number,
  strategyData: UserStrategyData | null,
): string[] {
  const questions: string[] = [];

  // Always show general questions
  questions.push('How is my portfolio doing overall?');
  questions.push('What are my biggest risk concentrations?');

  // If has holdings with cost basis, ask about performance
  const hasPerformanceData = assets.some(a => a.cost_basis && a.cost_basis > 0);
  if (hasPerformanceData) {
    questions.push('Which positions are performing best and worst?');
  }

  // Top holding specific question
  const topHolding = assets
    .filter(a => !a.is_account && a.ticker && a.calculated_value > 0)
    .sort((a, b) => b.calculated_value - a.calculated_value)[0];

  if (topHolding?.ticker) {
    questions.push(`What's happening with ${topHolding.ticker}?`);
  }

  // News question
  questions.push('What news could impact my portfolio?');

  // Strategy questions
  if (strategyData) {
    questions.push('Am I on track with my investment strategy?');
    questions.push('What should I rebalance?');
  } else {
    questions.push('How diversified is my portfolio across sectors?');
  }

  // Tax question if there are losses
  const hasLosses = assets.some(a => {
    if (!a.cost_basis || a.cost_basis <= 0 || a.type === 'tax_advantaged') return false;
    const totalCost = a.shares ? a.cost_basis * a.shares : a.cost_basis;
    return a.calculated_value < totalCost;
  });

  if (hasLosses) {
    questions.push('Are there tax-loss harvesting opportunities?');
  }

  // Multi-type question
  const activeTypes = Object.entries(breakdown).filter(([_, v]) => v > 0).length;
  if (activeTypes >= 3) {
    questions.push('How is my asset allocation balanced?');
  }

  return questions.slice(0, 6);
}
