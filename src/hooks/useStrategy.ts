import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserStrategy, UserStrategyData } from '../types';
import { ALL_SECTORS } from '../lib/insights/sectorBenchmarks';

export const DEFAULT_STRATEGY: UserStrategyData = {
  philosophy: 'balanced',
  timeHorizon: 'long',
  riskTolerance: 'moderate',
  targetAllocation: {
    stocks: 60,
    bonds: 20,
    real_estate: 10,
    cash: 5,
    gold: 3,
    crypto: 2,
    other: 0,
  },
  sectorPreferences: Object.fromEntries(ALL_SECTORS.map(s => [s, 'neutral' as const])),
  goals: [],
};

export function useStrategy(userId: string | undefined) {
  const [strategy, setStrategy] = useState<UserStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchStrategy = useCallback(async () => {
    if (!userId) {
      setStrategy(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('user_strategy')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching strategy:', error);
    } else {
      setStrategy(data as UserStrategy | null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  const saveStrategy = useCallback(async (strategyData: UserStrategyData) => {
    if (!userId) return;

    setSaving(true);

    const { data, error } = await supabase
      .from('user_strategy')
      .upsert(
        {
          user_id: userId,
          strategy: strategyData,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving strategy:', error);
      throw error;
    }

    setStrategy(data as UserStrategy);
    setSaving(false);
  }, [userId]);

  const strategyData = strategy?.strategy ?? null;
  const hasStrategy = strategy !== null;

  return {
    strategy,
    strategyData,
    hasStrategy,
    loading,
    saving,
    saveStrategy,
  };
}
