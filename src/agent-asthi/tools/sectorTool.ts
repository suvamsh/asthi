import type { AgentTool } from '../../agent/tools/types';
import type { ToolContext } from '../types';
import { getSectorWeights } from '../../lib/insights/portfolioAnalysis';
import { getTickerSectorSync } from '../../lib/sectorMapping';

export function createSectorTool(ctx: ToolContext): AgentTool {
  return {
    definition: {
      name: 'get_sector_info',
      description: 'Get portfolio sector weights compared to S&P 500 benchmarks, or look up the sector for a specific ticker symbol.',
      parameters: [
        {
          name: 'ticker',
          type: 'string',
          description: 'Optional ticker symbol to look up sector info for (e.g., "AAPL")',
          required: false,
        },
      ],
    },
    execute: async (args) => {
      const ticker = args.ticker as string | undefined;

      if (ticker) {
        const info = getTickerSectorSync(ticker.toUpperCase());
        if (!info) {
          return { ticker: ticker.toUpperCase(), sector: null, message: 'Sector not found for this ticker.' };
        }
        return { ticker: ticker.toUpperCase(), sector: info.sector, industry: info.industry };
      }

      const { assetsWithValues, totalNetWorth } = ctx;
      const allocations = getSectorWeights(assetsWithValues, totalNetWorth);

      return {
        sectors: allocations
          .filter(a => a.portfolioWeight > 0 || a.benchmarkWeight > 0.02)
          .map(a => ({
            sector: a.sector,
            portfolioWeight: `${(a.portfolioWeight * 100).toFixed(1)}%`,
            benchmarkWeight: `${(a.benchmarkWeight * 100).toFixed(1)}%`,
            diff: `${a.diff > 0 ? '+' : ''}${(a.diff * 100).toFixed(1)}%`,
            status: a.diff > 0.05 ? 'overweight' : a.diff < -0.03 ? 'underweight' : 'aligned',
          })),
      };
    },
  };
}
