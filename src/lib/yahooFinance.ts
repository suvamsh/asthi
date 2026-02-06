import type { StockSearchResult } from '../types';

// Use corsproxy.io to bypass CORS restrictions
const CORS_PROXY = 'https://corsproxy.io/?';
const SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';
const QUOTE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function searchSymbols(keywords: string): Promise<StockSearchResult[]> {
  if (!keywords || keywords.length < 1) return [];

  const yahooUrl = `${SEARCH_URL}?q=${encodeURIComponent(keywords)}&quotesCount=10&newsCount=0&listsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
  const url = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.quotes) {
      return data.quotes
        .filter((quote: Record<string, unknown>) =>
          quote.quoteType === 'EQUITY'
          || quote.quoteType === 'ETF'
          || quote.quoteType === 'MUTUALFUND'
        )
        .map((quote: Record<string, string>) => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          type: quote.quoteType || 'EQUITY',
          region: quote.exchange || 'US',
          currency: 'USD',
        }));
    }

    return [];
  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
}

export async function getQuote(symbol: string): Promise<number | null> {
  const yahooUrl = `${QUOTE_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const url = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      return data.chart.result[0].meta.regularMarketPrice;
    }

    return null;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }
}

export async function getMultipleQuotes(symbols: string[]): Promise<Record<string, number>> {
  const quotes: Record<string, number> = {};

  // Fetch quotes in parallel with a small batch size to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (symbol) => {
        const price = await getQuote(symbol);
        return { symbol, price };
      })
    );

    for (const { symbol, price } of results) {
      if (price !== null) {
        quotes[symbol] = price;
      }
    }

    // Small delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return quotes;
}
