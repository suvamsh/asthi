import type { AgentTool } from '../../agent/tools/types';
import type { ToolContext } from '../types';
import { formatCurrency } from '../../lib/calculations';

export function createPortfolioTool(ctx: ToolContext): AgentTool {
  return {
    definition: {
      name: 'get_portfolio',
      description: 'Get a summary of the user\'s portfolio including net worth, asset type breakdown, and all holdings with current values, weights, and gain/loss.',
      parameters: [],
    },
    execute: async () => {
      const { assetsWithValues, breakdown, totalNetWorth } = ctx;

      const holdings = assetsWithValues
        .filter(a => !a.is_account && a.calculated_value > 0)
        .sort((a, b) => b.calculated_value - a.calculated_value)
        .map(a => {
          const weight = totalNetWorth > 0 ? (a.calculated_value / totalNetWorth) * 100 : 0;
          const costBasis = a.cost_basis && a.shares
            ? a.cost_basis * a.shares
            : a.cost_basis || 0;
          const gainLoss = costBasis > 0 ? a.calculated_value - costBasis : null;
          const gainLossPct = costBasis > 0 && gainLoss !== null
            ? (gainLoss / costBasis) * 100
            : null;

          return {
            name: a.name,
            ticker: a.ticker || null,
            type: a.type,
            value: formatCurrency(a.calculated_value),
            weight: `${weight.toFixed(1)}%`,
            ...(gainLoss !== null ? {
              gainLoss: formatCurrency(gainLoss),
              gainLossPercent: `${gainLossPct!.toFixed(1)}%`,
            } : {}),
          };
        });

      const typeBreakdown = Object.entries(breakdown)
        .filter(([_, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([type, value]) => ({
          type,
          value: formatCurrency(value),
          percent: totalNetWorth > 0 ? `${((value / totalNetWorth) * 100).toFixed(1)}%` : '0%',
        }));

      return {
        totalNetWorth: formatCurrency(totalNetWorth),
        holdingCount: holdings.length,
        typeBreakdown,
        holdings,
      };
    },
  };
}
