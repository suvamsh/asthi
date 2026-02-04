import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Asset, AssetType, AssetWithLabels, Label } from '../types';

export function useAssets(userId: string | undefined) {
  const [assets, setAssets] = useState<AssetWithLabels[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!userId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('assets')
      .select(`
        *,
        asset_labels(
          label_id,
          labels(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching assets:', fetchError);
      setError(fetchError.message);
    } else {
      // Transform the data to flatten labels
      const assetsWithLabels: AssetWithLabels[] = (data || []).map(asset => {
        const labels = (asset.asset_labels || [])
          .map((al: { labels: Label }) => al.labels)
          .filter(Boolean) as Label[];

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { asset_labels, ...assetData } = asset;
        return { ...assetData, labels };
      });
      setAssets(assetsWithLabels);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const addAsset = useCallback(async (
    asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    labelIds?: string[]
  ) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('assets')
      .insert({
        ...asset,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding asset:', error);
      throw error;
    }

    // Add labels if provided
    if (labelIds && labelIds.length > 0) {
      const { error: labelError } = await supabase
        .from('asset_labels')
        .insert(
          labelIds.map(labelId => ({
            asset_id: data.id,
            label_id: labelId,
          }))
        );

      if (labelError) {
        console.error('Error adding asset labels:', labelError);
        // Don't throw - asset was created, just labels failed
      }
    }

    // Refetch to get labels attached
    await fetchAssets();
    return data;
  }, [userId, fetchAssets]);

  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    const { data, error } = await supabase
      .from('assets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating asset:', error);
      throw error;
    }

    setAssets(prev => prev.map(a => a.id === id ? data : a));
    return data;
  }, []);

  const deleteAsset = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }

    setAssets(prev => prev.filter(a => a.id !== id));
  }, []);

  const getAssetsByType = useCallback((type: AssetType) => {
    return assets.filter(a => a.type === type);
  }, [assets]);

  return {
    assets,
    loading,
    error,
    fetchAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    getAssetsByType,
  };
}
