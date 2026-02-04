import { useState, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LabelInput } from '../ui/LabelInput';
import { useStockSearch } from '../../hooks/useStockSearch';
import { getQuote } from '../../lib/yahooFinance';
import { formatCurrency } from '../../lib/calculations';
import type { StockSearchResult, Label } from '../../types';

interface StockFormData {
  name: string;
  ticker: string;
  shares: number;
  cost_basis?: number;
  purchase_date?: string;
  labelIds?: string[];
}

interface StockFormProps {
  onSubmit: (data: StockFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

export function StockForm({ onSubmit, onCancel, loading, labels, onCreateLabel }: StockFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [shares, setShares] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const { results, loading: searching, search, clearResults } = useStockSearch();

  useEffect(() => {
    search(searchQuery);
  }, [searchQuery, search]);

  const handleSelectStock = async (stock: StockSearchResult) => {
    setSelectedStock(stock);
    setSearchQuery(stock.symbol);
    setShowResults(false);
    clearResults();

    // Fetch current price
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

  const sharesNum = parseFloat(shares) || 0;
  const costBasisNum = parseFloat(costBasis) || 0;
  const estimatedValue = currentPrice && sharesNum > 0 ? currentPrice * sharesNum : null;
  const gainLoss = estimatedValue && costBasisNum > 0 ? estimatedValue - costBasisNum : null;
  const gainLossPercent = gainLoss && costBasisNum > 0 ? (gainLoss / costBasisNum) * 100 : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !shares) return;

    onSubmit({
      name: selectedStock.name,
      ticker: selectedStock.symbol,
      shares: parseFloat(shares),
      cost_basis: costBasisNum > 0 ? costBasisNum : undefined,
      purchase_date: purchaseDate || undefined,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
    });
  };

  const isValid = selectedStock && parseFloat(shares) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Input
          label="Search Stock"
          placeholder="Search by ticker or company name..."
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
        <div className="p-4 bg-[#0e639c]/20 border border-[#0e639c]/40 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-[#4fc1ff]">{selectedStock.symbol}</p>
              <p className="text-sm text-[#9cdcfe]">{selectedStock.name}</p>
            </div>
            <div className="text-right">
              {loadingPrice ? (
                <div className="w-16 h-6 bg-[#4fc1ff]/20 rounded animate-pulse" />
              ) : currentPrice ? (
                <p className="text-xl font-bold text-[#4fc1ff]">{formatCurrency(currentPrice)}</p>
              ) : (
                <p className="text-sm text-[#8a8a8a]">Price unavailable</p>
              )}
            </div>
          </div>
          {estimatedValue && (
            <div className="pt-2 border-t border-[#0e639c]/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9cdcfe]">Current Value</p>
                  <p className="text-lg font-semibold text-[#4ec9b0]">{formatCurrency(estimatedValue)}</p>
                </div>
                {gainLoss !== null && (
                  <div className="text-right">
                    <p className="text-sm text-[#9cdcfe]">Gain/Loss</p>
                    <p className={`text-lg font-semibold ${gainLoss >= 0 ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                      {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                    </p>
                    <p className={`text-xs ${gainLoss >= 0 ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                      {gainLoss >= 0 ? '+' : ''}{gainLossPercent?.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#8a8a8a] mt-1">
                {sharesNum} shares x {formatCurrency(currentPrice!)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Number of Shares"
          type="number"
          placeholder="e.g., 100"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          min="0"
          step="any"
        />

        <Input
          label="Cost Basis (Total)"
          type="number"
          placeholder="e.g., 5000"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          min="0"
          step="0.01"
          helpText="Total amount paid"
        />
      </div>

      <Input
        label="Purchase Date"
        type="date"
        value={purchaseDate}
        onChange={(e) => setPurchaseDate(e.target.value)}
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
          {loading ? 'Adding...' : 'Add Stock'}
        </Button>
      </div>
    </form>
  );
}
