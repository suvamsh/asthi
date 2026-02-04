import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getQuote } from '../lib/yahooFinance';
import { getGoldPrice } from '../lib/goldApi';
import {
  calculateTotalNetWorth,
  calculateAssetsByType,
  getAssetsWithValues,
} from '../lib/calculations';
import type { NetWorthHistory, AssetWithLabels, AssetWithValueAndLabels } from '../types';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

interface PriceData {
  stockPrices: Record<string, number>;
  goldPrice: number | null;
  lastUpdated: number;
}

export function useNetWorth(userId: string | undefined, assets: AssetWithLabels[]) {
  const [priceData, setPriceData] = useState<PriceData>({
    stockPrices: {},
    goldPrice: null,
    lastUpdated: 0,
  });
  const [history, setHistory] = useState<NetWorthHistory[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Get unique stock tickers from assets
  const stockTickers = useMemo(() => {
    return [...new Set(
      assets
        .filter(a => a.type === 'stock' && a.ticker)
        .map(a => a.ticker!)
    )];
  }, [assets]);

  // Check if we have any gold assets
  const hasGold = useMemo(() => {
    return assets.some(a => a.type === 'gold' && a.weight_oz);
  }, [assets]);

  // Fetch stock prices
  const fetchPrices = useCallback(async () => {
    const now = Date.now();

    // Skip if cache is still valid
    if (now - priceData.lastUpdated < CACHE_DURATION) {
      return;
    }

    setLoadingPrices(true);

    try {
      const newPrices: Record<string, number> = { ...priceData.stockPrices };

      // Fetch stock prices (with rate limiting)
      for (const ticker of stockTickers) {
        // Check price cache in database first
        const { data: cached } = await supabase
          .from('price_cache')
          .select('*')
          .eq('ticker', ticker)
          .single();

        if (cached && new Date(cached.updated_at).getTime() > now - CACHE_DURATION) {
          newPrices[ticker] = cached.price;
          continue;
        }

        // Fetch from API
        const price = await getQuote(ticker);
        if (price !== null) {
          newPrices[ticker] = price;

          // Update cache in database
          await supabase
            .from('price_cache')
            .upsert({
              ticker,
              price,
              updated_at: new Date().toISOString(),
            });
        }

        // Rate limit: small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Fetch gold price if needed
      let goldPrice = priceData.goldPrice;
      if (hasGold) {
        const newGoldPrice = await getGoldPrice();
        if (newGoldPrice !== null) {
          goldPrice = newGoldPrice;
        }
      }

      setPriceData({
        stockPrices: newPrices,
        goldPrice,
        lastUpdated: now,
      });
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoadingPrices(false);
    }
  }, [stockTickers, hasGold, priceData]);

  // Fetch price history
  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    setLoadingHistory(true);

    const { data, error } = await supabase
      .from('net_worth_history')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching history:', error);
    } else {
      setHistory(data || []);
    }

    setLoadingHistory(false);
  }, [userId]);

  // Save current snapshot
  const saveSnapshot = useCallback(async () => {
    if (!userId) return;

    const totalValue = calculateTotalNetWorth(assets, priceData.stockPrices, priceData.goldPrice);
    const breakdown = calculateAssetsByType(assets, priceData.stockPrices, priceData.goldPrice);

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('net_worth_history')
      .upsert({
        user_id: userId,
        date: today,
        total_value: totalValue,
        breakdown,
      }, {
        onConflict: 'user_id,date',
      });

    if (error) {
      console.error('Error saving snapshot:', error);
    } else {
      await fetchHistory();
    }
  }, [userId, assets, priceData, fetchHistory]);

  // Fetch prices when assets change
  useEffect(() => {
    if (assets.length > 0) {
      fetchPrices();
    }
  }, [stockTickers.join(','), hasGold]);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Calculate derived values
  const totalNetWorth = useMemo(() => {
    return calculateTotalNetWorth(assets, priceData.stockPrices, priceData.goldPrice);
  }, [assets, priceData]);

  const breakdown = useMemo(() => {
    return calculateAssetsByType(assets, priceData.stockPrices, priceData.goldPrice);
  }, [assets, priceData]);

  const assetsWithValues: AssetWithValueAndLabels[] = useMemo(() => {
    const withValues = getAssetsWithValues(assets, priceData.stockPrices, priceData.goldPrice);
    // Preserve labels from original assets
    return withValues.map((asset, index) => ({
      ...asset,
      labels: assets[index]?.labels,
    }));
  }, [assets, priceData]);

  // Calculate change from previous period
  const previousNetWorth = useMemo(() => {
    if (history.length < 2) return null;
    return history[history.length - 2]?.total_value ?? null;
  }, [history]);

  const netWorthChange = useMemo(() => {
    if (previousNetWorth === null) return null;
    return totalNetWorth - previousNetWorth;
  }, [totalNetWorth, previousNetWorth]);

  const netWorthChangePercent = useMemo(() => {
    if (previousNetWorth === null || previousNetWorth === 0) return null;
    return (totalNetWorth - previousNetWorth) / previousNetWorth;
  }, [totalNetWorth, previousNetWorth]);

  // Get history for specific time range
  const getHistoryForRange = useCallback((days: number) => {
    if (days === 0) return history; // ALL
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return history.filter(h => new Date(h.date) >= cutoff);
  }, [history]);

  return {
    totalNetWorth,
    breakdown,
    assetsWithValues,
    stockPrices: priceData.stockPrices,
    goldPrice: priceData.goldPrice,
    history,
    loadingPrices,
    loadingHistory,
    previousNetWorth,
    netWorthChange,
    netWorthChangePercent,
    fetchPrices,
    fetchHistory,
    saveSnapshot,
    getHistoryForRange,
  };
}
