import type { StockSearchResult } from '../types';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
const BASE_URL = 'https://www.alphavantage.co/query';

export async function searchSymbols(keywords: string): Promise<StockSearchResult[]> {
  if (!keywords || keywords.length < 1) return [];

  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.bestMatches) {
      return data.bestMatches.map((match: Record<string, string>) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        currency: match['8. currency'],
      }));
    }

    return [];
  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
}

export async function getQuote(symbol: string): Promise<number | null> {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      return parseFloat(data['Global Quote']['05. price']);
    }

    return null;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }
}

export async function getMultipleQuotes(symbols: string[]): Promise<Record<string, number>> {
  const quotes: Record<string, number> = {};

  // Alpha Vantage doesn't support batch quotes on free tier
  // We need to fetch one by one with some delay to avoid rate limits
  for (const symbol of symbols) {
    const price = await getQuote(symbol);
    if (price !== null) {
      quotes[symbol] = price;
    }
    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return quotes;
}
