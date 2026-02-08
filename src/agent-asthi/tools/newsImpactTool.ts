import type { AgentTool } from '../../agent/tools/types';
import type { ToolContext } from '../types';
import { matchImpactChains } from '../../lib/insights/newsAnalysis';
import { formatCurrency } from '../../lib/calculations';

export function createNewsImpactTool(ctx: ToolContext): AgentTool {
  return {
    definition: {
      name: 'get_impact_chains',
      description: 'Get news impact chains showing how current news themes map to affected portfolio tickers with exposure values. Requires portfolio news to be loaded.',
      parameters: [],
    },
    execute: async () => {
      const { portfolioNews, assetsWithValues, totalNetWorth } = ctx;

      if (portfolioNews.length === 0) {
        return { chains: [], message: 'No portfolio news available to analyze.' };
      }

      const chains = matchImpactChains(portfolioNews, assetsWithValues, totalNetWorth);

      return {
        chainCount: chains.length,
        chains: chains.map(c => ({
          theme: c.theme,
          direction: c.direction,
          impact: c.impact,
          articleCount: c.articles.length,
          exposure: formatCurrency(c.exposureValue),
          exposurePercent: `${c.exposurePercent.toFixed(1)}%`,
          affectedTickers: c.affectedTickers.map(t => ({
            ticker: t.ticker,
            value: formatCurrency(t.currentValue),
            gainLoss: t.costBasis > 0 ? formatCurrency(t.gainLoss) : null,
          })),
        })),
      };
    },
  };
}
