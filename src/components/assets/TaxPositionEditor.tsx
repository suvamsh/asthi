import { useState, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useStockSearch } from '../../hooks/useStockSearch';
import { getQuote } from '../../lib/yahooFinance';
import { formatCurrency } from '../../lib/calculations';
import type { StockSearchResult } from '../../types';

export interface TaxAdvantagedPositionDraft {
  id: string;
  name: string;
  pricing_mode: 'live' | 'manual';
  ticker?: string;
  shares?: number;
  manual_value?: number;
  cost_basis?: number;
  notes?: string;
}

interface TaxPositionEditorProps {
  index: number;
  position: TaxAdvantagedPositionDraft;
  onChange: (updates: Partial<TaxAdvantagedPositionDraft>) => void;
  onRemove: () => void;
  showRemove: boolean;
}

export function TaxPositionEditor({ index, position, onChange, onRemove, showRemove }: TaxPositionEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const { results, loading: searching, search, clearResults } = useStockSearch();

  // Trigger search when query changes in live mode
  useEffect(() => {
    if (position.pricing_mode === 'live') {
      search(searchQuery);
    } else {
      clearResults();
    }
  }, [searchQuery, position.pricing_mode, search, clearResults]);

  const handleSelectStock = async (stock: StockSearchResult) => {
    setSelectedStock(stock);
    setSearchQuery(stock.symbol);
    setShowResults(false);
    clearResults();
    onChange({ name: stock.name, ticker: stock.symbol });

    setLoadingPrice(true);
    setCurrentPrice(null);
    try {
      const price = await getQuote(stock.symbol);
      setCurrentPrice(price);
    } catch (error) {
      console.error('Error fetching price:', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handlePricingModeChange = (mode: 'live' | 'manual') => {
    onChange({ pricing_mode: mode });
    if (mode === 'manual') {
      setSearchQuery('');
      setSelectedStock(null);
      setShowResults(false);
      setCurrentPrice(null);
      setLoadingPrice(false);
      clearResults();
      onChange({ pricing_mode: mode, ticker: undefined, shares: undefined });
    }
  };

  const sharesNum = position.shares || 0;
  const estimatedValue = currentPrice && sharesNum > 0 ? currentPrice * sharesNum : null;

  return (
    <div className="border border-[#3c3c3c] rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-[#8a8a8a]">Position {index + 1}</p>
        {showRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>

      <Input
        label="Holding Name"
        placeholder="e.g., PIMCO Total Return"
        value={position.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />

      <Select
        label="Pricing"
        value={position.pricing_mode}
        onChange={(e) => handlePricingModeChange(e.target.value as 'live' | 'manual')}
        options={[
          { value: 'live', label: 'Live price (ticker)' },
          { value: 'manual', label: 'Manual value' },
        ]}
      />

      {position.pricing_mode === 'live' ? (
        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Search Ticker"
              placeholder="Search by ticker or fund name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedStock(null);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
            <Search className="absolute right-3 top-8 w-5 h-5 text-[#6e6e6e]" />

            {showResults && (searchQuery.length > 0 || results.length > 0) && (
              <div className="absolute z-10 w-full mt-1 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searching ? (
                  <div className="px-4 py-3 text-sm text-[#8a8a8a]">Searching...</div>
                ) : results.length > 0 ? (
                  results.map((stock) => (
                    <button
                      key={stock.symbol}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-[#2a2d2e] flex items-center justify-between"
                      onClick={() => handleSelectStock(stock)}
                    >
                      <div>
                        <p className="font-medium text-[#e0e0e0]">{stock.symbol}</p>
                        <p className="text-sm text-[#8a8a8a] truncate">{stock.name}</p>
                      </div>
                      {selectedStock?.symbol === stock.symbol && (
                        <Check className="w-5 h-5 text-[#4fc1ff]" />
                      )}
                    </button>
                  ))
                ) : searchQuery.length > 0 ? (
                  <div className="px-4 py-3 text-sm text-[#8a8a8a]">No results found</div>
                ) : null}
              </div>
            )}
          </div>

          {selectedStock && (
            <div className="p-3 bg-[#0e639c]/20 border border-[#0e639c]/40 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-[#4fc1ff]">{selectedStock.symbol}</p>
                  <p className="text-sm text-[#9cdcfe]">{selectedStock.name}</p>
                </div>
                <div className="text-right">
                  {loadingPrice ? (
                    <div className="w-16 h-6 bg-[#4fc1ff]/20 rounded animate-pulse" />
                  ) : currentPrice ? (
                    <p className="text-lg font-bold text-[#4fc1ff]">{formatCurrency(currentPrice)}</p>
                  ) : (
                    <p className="text-sm text-[#8a8a8a]">Price unavailable</p>
                  )}
                </div>
              </div>
              {estimatedValue && (
                <p className="text-xs text-[#8a8a8a]">
                  Est. value: {formatCurrency(estimatedValue)}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Number of Shares"
              type="number"
              placeholder="e.g., 25"
              value={position.shares?.toString() || ''}
              onChange={(e) => onChange({ shares: parseFloat(e.target.value) || undefined })}
              min="0"
              step="any"
            />
            <Input
              label="Cost Basis (Per Share)"
              type="number"
              placeholder="Optional"
              value={position.cost_basis?.toString() || ''}
              onChange={(e) => onChange({ cost_basis: parseFloat(e.target.value) || undefined })}
              min="0"
              step="0.01"
            />
          </div>
        </div>
      ) : (
        <>
          <Input
            label="Current Value"
            type="number"
            placeholder="10000"
            value={position.manual_value?.toString() || ''}
            onChange={(e) => onChange({ manual_value: parseFloat(e.target.value) || undefined })}
            min="0"
            step="0.01"
          />
          <Input
            label="Cost Basis (Total)"
            type="number"
            placeholder="Optional"
            value={position.cost_basis?.toString() || ''}
            onChange={(e) => onChange({ cost_basis: parseFloat(e.target.value) || undefined })}
            min="0"
            step="0.01"
          />
        </>
      )}
    </div>
  );
}
