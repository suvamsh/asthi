import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Label } from '../types';

export function useLabels(userId: string | undefined) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    if (!userId) {
      setLabels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('labels')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (fetchError) {
      console.error('Error fetching labels:', fetchError);
      setError(fetchError.message);
    } else {
      setLabels(data || []);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = useCallback(async (name: string, color?: string): Promise<Label | null> => {
    if (!userId) return null;

    // Normalize: lowercase and trim
    const normalizedName = name.toLowerCase().trim();
    if (!normalizedName) return null;

    // Check if label already exists
    const existing = labels.find(l => l.name.toLowerCase().trim() === normalizedName);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('labels')
      .insert({
        user_id: userId,
        name: normalizedName,
        color,
      })
      .select()
      .single();

    if (error) {
      const message = error.message || 'Failed to create label';
      console.error('Error creating label:', error);
      throw new Error(message);
    }

    setLabels(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    // Ensure we sync with DB in case of concurrent changes or triggers
    await fetchLabels();
    return data;
  }, [userId, labels, fetchLabels]);

  const deleteLabel = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('labels')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting label:', error);
      throw error;
    }

    setLabels(prev => prev.filter(l => l.id !== id));
  }, []);

  const setAssetLabels = useCallback(async (assetId: string, labelIds: string[]) => {
    // First, delete all existing labels for this asset
    const { error: deleteError } = await supabase
      .from('asset_labels')
      .delete()
      .eq('asset_id', assetId);

    if (deleteError) {
      console.error('Error removing asset labels:', deleteError);
      throw deleteError;
    }

    // Then insert new labels if any
    if (labelIds.length > 0) {
      const { error: insertError } = await supabase
        .from('asset_labels')
        .insert(
          labelIds.map(labelId => ({
            asset_id: assetId,
            label_id: labelId,
          }))
        );

      if (insertError) {
        console.error('Error setting asset labels:', insertError);
        throw insertError;
      }
    }
  }, []);

  const getAssetLabels = useCallback(async (assetId: string): Promise<Label[]> => {
    const { data, error } = await supabase
      .from('asset_labels')
      .select('label_id, labels(*)')
      .eq('asset_id', assetId);

    if (error) {
      console.error('Error fetching asset labels:', error);
      return [];
    }

    return (data || [])
      .map(row => row.labels as unknown as Label)
      .filter(Boolean);
  }, []);

  return {
    labels,
    loading,
    error,
    fetchLabels,
    createLabel,
    deleteLabel,
    setAssetLabels,
    getAssetLabels,
  };
}
