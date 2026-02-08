import type { AgentTool } from '../../agent/tools/types';
import type { ToolContext } from '../types';

export function createNewsTool(ctx: ToolContext): AgentTool {
  return {
    definition: {
      name: 'get_news',
      description: 'Get news articles. Without a query, returns portfolio-related news. With a query, searches for specific topics. Returns up to 10 articles with titles, sources, dates, and related tickers.',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Optional search query (e.g., "AAPL earnings", "gold price", "tech sector")',
          required: false,
        },
      ],
    },
    execute: async (args) => {
      const query = args.query as string | undefined;

      let articles;
      if (query) {
        await ctx.searchNewsFn(query);
        articles = ctx.searchResults;
      } else {
        articles = ctx.portfolioNews;
      }

      const capped = articles.slice(0, 10);

      return {
        count: capped.length,
        query: query || 'portfolio news',
        articles: capped.map(a => ({
          title: a.title,
          source: a.source,
          date: a.publishedAt,
          url: a.url,
          relatedTickers: a.relatedTickers || [],
          snippet: a.description?.slice(0, 200) || '',
        })),
      };
    },
  };
}
