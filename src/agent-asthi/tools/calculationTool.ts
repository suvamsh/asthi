import type { AgentTool } from '../../agent/tools/types';
import type { ToolContext } from '../types';
import { getTotalCostBasis, formatCurrency, calculatePortfolioPerformance } from '../../lib/calculations';

export function createPerformanceTool(ctx: ToolContext): AgentTool {
  return {
    definition: {
      name: 'get_performance',
      description: 'Get cost basis, current value, and gain/loss for all assets that have cost basis data. Shows individual position performance and portfolio-level totals.',
      parameters: [],
    },
    execute: async () => {
      const { assetsWithValues } = ctx;

      const portfolio = calculatePortfolioPerformance(assetsWithValues);

      const positions = assetsWithValues
        .filter(a => !a.is_account && a.cost_basis && a.cost_basis > 0)
        .map(a => {
          const totalCost = getTotalCostBasis(a);
          const gain = a.calculated_value - totalCost;
          const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
          return {
            name: a.name,
            ticker: a.ticker || null,
            type: a.type,
            costBasis: formatCurrency(totalCost),
            currentValue: formatCurrency(a.calculated_value),
            gainLoss: formatCurrency(gain),
            gainLossPercent: `${gainPct.toFixed(1)}%`,
          };
        })
        .sort((a, b) => {
          const aVal = parseFloat(a.gainLossPercent);
          const bVal = parseFloat(b.gainLossPercent);
          return bVal - aVal;
        });

      return {
        portfolioTotals: {
          totalCostBasis: formatCurrency(portfolio.totalCostBasis),
          totalCurrentValue: formatCurrency(portfolio.totalCurrentValue),
          totalGainLoss: formatCurrency(portfolio.gainLoss),
          totalGainLossPercent: `${portfolio.gainLossPercent.toFixed(1)}%`,
        },
        positionCount: positions.length,
        positions,
      };
    },
  };
}
