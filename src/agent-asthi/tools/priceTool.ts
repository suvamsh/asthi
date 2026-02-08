import type { AgentTool } from '../../agent/tools/types';
import type { ToolContext } from '../types';
import { getQuote } from '../../lib/yahooFinance';
import { formatCurrencyDetailed } from '../../lib/calculations';

export function createPriceTool(ctx: ToolContext): AgentTool {
  return {
    definition: {
      name: 'get_price',
      description: 'Get the current price for a stock ticker or gold. Uses cached prices when available, falls back to live fetch.',
      parameters: [
        {
          name: 'ticker',
          type: 'string',
          description: 'Stock ticker symbol (e.g., "AAPL", "MSFT") or "GOLD" for gold price per oz',
          required: true,
        },
      ],
    },
    execute: async (args) => {
      const ticker = (args.ticker as string).toUpperCase();

      if (ticker === 'GOLD') {
        if (ctx.goldPrice) {
          return { ticker: 'GOLD', price: formatCurrencyDetailed(ctx.goldPrice), unit: 'USD/oz' };
        }
        return { ticker: 'GOLD', price: null, message: 'Gold price not available.' };
      }

      // Check cache first
      const cached = ctx.stockPrices[ticker];
      if (cached) {
        return { ticker, price: formatCurrencyDetailed(cached), source: 'cached' };
      }

      // Live fetch
      try {
        const price = await getQuote(ticker);
        if (price !== null) {
          return { ticker, price: formatCurrencyDetailed(price), source: 'live' };
        }
        return { ticker, price: null, message: `Price not found for ${ticker}.` };
      } catch {
        return { ticker, price: null, message: `Failed to fetch price for ${ticker}.` };
      }
    },
  };
}
