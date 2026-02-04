import { useState, useCallback, useRef, useEffect } from 'react';
import { searchSymbols } from '../lib/yahooFinance';
import type { StockSearchResult } from '../types';

export function useStockSearch() {
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback((query: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query || query.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Debounce the search
    debounceRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      try {
        const searchResults = await searchSymbols(query);
        setResults(searchResults);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to search symbols');
          console.error('Search error:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
