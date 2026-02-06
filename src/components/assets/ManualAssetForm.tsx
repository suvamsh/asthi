import { useState, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { LabelInput } from '../ui/LabelInput';
import { useStockSearch } from '../../hooks/useStockSearch';
import { getQuote } from '../../lib/yahooFinance';
import { formatCurrency } from '../../lib/calculations';
import type { AssetType, Label, StockSearchResult } from '../../types';

interface ManualAssetFormData {
  name: string;
  type: AssetType;
  manual_value?: number;
  ticker?: string;
  shares?: number;
  cost_basis?: number;
  account_type?: string;
  parent_asset_id?: string;
  notes?: string;
  labelIds?: string[];
}

interface ManualAssetFormProps {
  defaultType?: AssetType;
  lockType?: boolean;
  defaultAccountType?: string;
  lockAccountType?: boolean;
  parentAssetId?: string;
  onSubmit: (data: ManualAssetFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

export function ManualAssetForm({
  defaultType = 'cash',
  lockType = false,
  defaultAccountType,
  lockAccountType = false,
  parentAssetId,
  onSubmit,
  onCancel,
  loading,
  labels,
  onCreateLabel,
}: ManualAssetFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>(defaultType);
  const [value, setValue] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [accountType, setAccountType] = useState(defaultAccountType || '401k');
  const [pricingMode, setPricingMode] = useState<'manual' | 'live'>(
    defaultType === 'tax_advantaged' ? 'live' : 'manual'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [shares, setShares] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const { results, loading: searching, search, clearResults } = useStockSearch();

  useEffect(() => {
    if (type !== 'tax_advantaged') {
      setPricingMode('manual');
      setSearchQuery('');
      setSelectedStock(null);
      setShowResults(false);
      setShares('');
      setCurrentPrice(null);
      setLoadingPrice(false);
      clearResults();
    }
  }, [type, clearResults]);

  useEffect(() => {
    if (type === 'tax_advantaged' && pricingMode === 'live') {
      search(searchQuery);
    } else {
      clearResults();
    }
  }, [searchQuery, pricingMode, type, search, clearResults]);

  const handleSelectStock = async (stock: StockSearchResult) => {
    setSelectedStock(stock);
    setSearchQuery(stock.symbol);
    setName(stock.name);
    setShowResults(false);
    clearResults();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (type === 'tax_advantaged' && pricingMode === 'live') {
      if (!selectedStock || !shares) return;
    } else if (!value) {
      return;
    }

    const costBasisNum = parseFloat(costBasis) || 0;
    const sharesNum = parseFloat(shares) || 0;
    const useLivePricing = type === 'tax_advantaged' && pricingMode === 'live';

    onSubmit({
      name,
      type,
      ticker: useLivePricing ? selectedStock?.symbol : undefined,
      shares: useLivePricing ? sharesNum : undefined,
      manual_value: useLivePricing ? undefined : parseFloat(value),
      cost_basis: costBasisNum > 0 ? costBasisNum : undefined,
      account_type: type === 'tax_advantaged' ? accountType : undefined,
      parent_asset_id: parentAssetId,
      notes: notes || undefined,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
    });
  };

  const valueNum = parseFloat(value) || 0;
  const sharesNum = parseFloat(shares) || 0;
  const isValid = type === 'tax_advantaged' && pricingMode === 'live'
    ? !!selectedStock && sharesNum > 0 && !!name
    : !!name && valueNum > 0;
  const showCostBasis = type === 'crypto' || type === 'other';
  const showAccountType = type === 'tax_advantaged';
  const showLivePricing = type === 'tax_advantaged' && pricingMode === 'live';
  const showManualValue = type !== 'tax_advantaged' || pricingMode === 'manual';
  const estimatedValue = showLivePricing && currentPrice && sharesNum > 0 ? currentPrice * sharesNum : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!lockType && (
        <Select
          label="Asset Type"
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
          options={[
            { value: 'cash', label: 'Cash / Savings' },
            { value: 'crypto', label: 'Cryptocurrency' },
            { value: 'tax_advantaged', label: 'Tax Advantaged' },
            { value: 'other', label: 'Other' },
          ]}
        />
      )}

      <Input
        label={type === 'tax_advantaged' ? 'Holding Name' : 'Asset Name'}
        placeholder={
          type === 'cash'
            ? 'e.g., High-yield savings'
            : type === 'crypto'
            ? 'e.g., Bitcoin holdings'
            : type === 'tax_advantaged'
            ? 'e.g., PIMCO Total Return'
            : 'e.g., Collectibles'
        }
        helpText={
          type === 'tax_advantaged'
            ? 'Use the fund or holding name. Add each holding separately.'
            : undefined
        }
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      {showAccountType && !lockAccountType && (
        <Select
          label="Account Type"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          options={[
            { value: '401k', label: '401(k)' },
            { value: 'roth_ira', label: 'Roth IRA' },
            { value: 'traditional_ira', label: 'Traditional IRA' },
            { value: 'hsa', label: 'HSA' },
            { value: '403b', label: '403(b)' },
            { value: '457b', label: '457(b)' },
            { value: 'sep_ira', label: 'SEP IRA' },
            { value: 'simple_ira', label: 'SIMPLE IRA' },
            { value: 'tsp', label: 'TSP' },
          ]}
        />
      )}
      {showAccountType && lockAccountType && (
        <Input
          label="Account Type"
          value={accountType}
          disabled
        />
      )}

      {showAccountType && (
        <Select
          label="Pricing"
          value={pricingMode}
          onChange={(e) => {
            const next = e.target.value as 'manual' | 'live';
            setPricingMode(next);
            if (next === 'manual') {
              setSearchQuery('');
              setSelectedStock(null);
              setShowResults(false);
              setShares('');
              setCurrentPrice(null);
              clearResults();
            }
          }}
          options={[
            { value: 'live', label: 'Live price (ticker)' },
            { value: 'manual', label: 'Manual value' },
          ]}
        />
      )}

      {showLivePricing && (
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
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              min="0"
              step="any"
            />
            <Input
              label="Cost Basis (Per Share)"
              type="number"
              placeholder="e.g., 50"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              min="0"
              step="0.01"
              helpText="Price paid per share (optional)"
            />
          </div>
        </div>
      )}

      {showManualValue && (
        <Input
          label={type === 'tax_advantaged' ? 'Holding Value' : 'Current Value'}
          type="number"
          placeholder="10000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      )}

      {showCostBasis && (
        <Input
          label="Cost Basis (Total)"
          type="number"
          placeholder="e.g., 5000"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          min="0"
          step="0.01"
          helpText="Total amount paid for purchase"
        />
      )}

      <Input
        label="Notes (optional)"
        placeholder="Additional details..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <LabelInput
        labels={labels}
        selectedLabelIds={selectedLabelIds}
        onChange={setSelectedLabelIds}
        onCreateLabel={onCreateLabel}
      />

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Asset'}
        </Button>
      </div>
    </form>
  );
}
