import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGoogleNewsRSS, fetchYahooNewsRSS, deduplicateNews } from '../lib/newsApi';
import { parseNewsQuery } from '../lib/newsQueryParser';
import { deriveSectorsFromAssets } from '../lib/sectorMapping';
import type { AssetWithValue, NewsArticle, NewsSector } from '../types';

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function useNews(assets: AssetWithValue[]) {
  const [portfolioNews, setPortfolioNews] = useState<NewsArticle[]>([]);
  const [searchResults, setSearchResults] = useState<NewsArticle[]>([]);
  const [suggestedSectors, setSuggestedSectors] = useState<NewsSector[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portfolioCache = useRef<CacheEntry<NewsArticle[]> | null>(null);
  const searchCache = useRef<Map<string, CacheEntry<NewsArticle[]>>>(new Map());
  const sectorsCache = useRef<CacheEntry<NewsSector[]> | null>(null);

  // Get user's stock tickers sorted by value
  const getTopTickers = useCallback((): string[] => {
    return assets
      .filter(a => (a.type === 'stock' || a.type === 'tax_advantaged') && a.ticker && !a.is_account)
      .sort((a, b) => b.calculated_value - a.calculated_value)
      .slice(0, 10)
      .map(a => a.ticker!);
  }, [assets]);

  // Get distinct non-stock asset types
  const getNonStockTypes = useCallback((): string[] => {
    const types = new Set<string>();
    for (const asset of assets) {
      if (asset.type !== 'stock') {
        types.add(asset.type);
      }
    }
    return Array.from(types);
  }, [assets]);

  // Tag articles with related tickers from user's portfolio
  const tagRelatedTickers = useCallback((articles: NewsArticle[]): NewsArticle[] => {
    const userTickers = assets
      .filter(a => a.ticker)
      .map(a => a.ticker!.toUpperCase());

    if (userTickers.length === 0) return articles;

    return articles.map(article => {
      const text = `${article.title} ${article.description}`.toUpperCase();
      const related = userTickers.filter(ticker =>
        // Match ticker as a word boundary (avoid matching "A" in random words)
        ticker.length > 1
          ? text.includes(ticker)
          : new RegExp(`\\b${ticker}\\b`).test(text)
      );
      return related.length > 0
        ? { ...article, relatedTickers: related }
        : article;
    });
  }, [assets]);

  // Fetch portfolio news
  const fetchPortfolioNews = useCallback(async () => {
    // Check cache
    if (portfolioCache.current && Date.now() - portfolioCache.current.timestamp < CACHE_TTL) {
      setPortfolioNews(portfolioCache.current.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allArticles: NewsArticle[] = [];

      // Fetch Yahoo RSS for top stock tickers (batch up to 5 per call)
      const tickers = getTopTickers();
      if (tickers.length > 0) {
        const batchSize = 5;
        for (let i = 0; i < tickers.length; i += batchSize) {
          const batch = tickers.slice(i, i + batchSize);
          const articles = await fetchYahooNewsRSS(batch);
          allArticles.push(...articles);
        }
      }

      // Fetch Google News for non-stock asset types
      const nonStockTypes = getNonStockTypes();
      const typeQueries: Record<string, string> = {
        real_estate: 'real estate housing market',
        gold: 'gold price precious metals',
        crypto: 'cryptocurrency bitcoin market',
        cash: 'savings interest rates economy',
        tax_advantaged: '401k IRA retirement investing',
        other: 'investing personal finance',
      };

      for (const type of nonStockTypes) {
        const query = typeQueries[type];
        if (query) {
          const articles = await fetchGoogleNewsRSS(query);
          allArticles.push(...articles);
        }
      }

      // If no assets at all, fetch general financial news
      if (assets.length === 0) {
        const articles = await fetchGoogleNewsRSS('stock market financial news');
        allArticles.push(...articles);
      }

      // Deduplicate, tag, and sort by date
      let processed = deduplicateNews(allArticles);
      processed = tagRelatedTickers(processed);
      processed.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      portfolioCache.current = { data: processed, timestamp: Date.now() };
      setPortfolioNews(processed);
    } catch (err) {
      console.error('Error fetching portfolio news:', err);
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [assets.length, getTopTickers, getNonStockTypes, tagRelatedTickers]);

  // Search news with natural language query
  const searchNews = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    // Check cache
    const cacheKey = trimmed.toLowerCase();
    const cached = searchCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setSearchResults(cached.data);
      return;
    }

    setSearchLoading(true);

    try {
      const parsedQuery = parseNewsQuery(trimmed);
      const articles = await fetchGoogleNewsRSS(parsedQuery);

      let processed = deduplicateNews(articles);
      processed = tagRelatedTickers(processed);
      processed.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      searchCache.current.set(cacheKey, { data: processed, timestamp: Date.now() });
      setSearchResults(processed);
    } catch (err) {
      console.error('Error searching news:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, [tagRelatedTickers]);

  // Derive sectors from assets
  const deriveSectors = useCallback(async () => {
    if (assets.length === 0) {
      setSuggestedSectors([]);
      return;
    }

    // Check cache
    if (sectorsCache.current && Date.now() - sectorsCache.current.timestamp < CACHE_TTL) {
      setSuggestedSectors(sectorsCache.current.data);
      return;
    }

    try {
      const sectors = await deriveSectorsFromAssets(assets);
      sectorsCache.current = { data: sectors, timestamp: Date.now() };
      setSuggestedSectors(sectors);
    } catch (err) {
      console.error('Error deriving sectors:', err);
    }
  }, [assets]);

  // Refresh all data (bypass cache)
  const refresh = useCallback(async () => {
    portfolioCache.current = null;
    searchCache.current.clear();
    sectorsCache.current = null;
    await Promise.all([fetchPortfolioNews(), deriveSectors()]);
  }, [fetchPortfolioNews, deriveSectors]);

  // Fetch on mount / when assets change
  useEffect(() => {
    fetchPortfolioNews();
    deriveSectors();
  }, [fetchPortfolioNews, deriveSectors]);

  return {
    portfolioNews,
    searchResults,
    suggestedSectors,
    loading,
    searchLoading,
    error,
    searchNews,
    refresh,
  };
}
