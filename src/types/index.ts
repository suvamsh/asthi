export type AssetType = 'stock' | 'real_estate' | 'gold' | 'cash' | 'crypto' | 'other';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;

  // Stock-specific
  ticker?: string;
  shares?: number;

  // Real estate-specific
  purchase_price?: number;
  purchase_date?: string;
  down_payment?: number;
  mortgage_amount?: number;
  current_value?: number;

  // Gold-specific
  weight_oz?: number;

  // Generic
  manual_value?: number;
  notes?: string;
  cost_basis?: number;

  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface NetWorthHistory {
  id: string;
  user_id: string;
  date: string;
  total_value: number;
  breakdown: Record<AssetType, number>;
}

export interface PriceCache {
  ticker: string;
  price: number;
  updated_at: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface AssetWithValue extends Asset {
  calculated_value: number;
}

export interface Label {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface AssetWithLabels extends Asset {
  labels?: Label[];
}

export interface AssetWithValueAndLabels extends AssetWithValue {
  labels?: Label[];
}
