import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatCurrencyDetailed, getTotalCostBasis } from '../lib/calculations';
import type { AssetWithValueAndLabels } from '../types';

interface StockHoldingsProps {
  assets: AssetWithValueAndLabels[];
  stockPrices: Record<string, number>;
}

export function StockHoldings({ assets, stockPrices }: StockHoldingsProps) {
  const { ticker } = useParams<{ ticker: string }>();
  const normalizedTicker = ticker?.toUpperCase() || '';

  const holdings = assets.filter(
    asset => (asset.type === 'stock' || asset.type === 'tax_advantaged')
      && !asset.is_account
      && asset.ticker?.toUpperCase() === normalizedTicker
  );

  if (!normalizedTicker || holdings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8a8a8a] mb-4">No holdings found</p>
        <Link to="/assets" className="text-[#4fc1ff] hover:text-[#6dd0ff]">
          Back to assets
        </Link>
      </div>
    );
  }

  const totalShares = holdings.reduce((sum, asset) => sum + (asset.shares || 0), 0);
  const totalCostBasis = holdings.reduce((sum, asset) => sum + getTotalCostBasis(asset), 0);
  const totalCurrentValue = holdings.reduce((sum, asset) => sum + asset.calculated_value, 0);
  const avgCostPerShare = totalShares > 0 && totalCostBasis > 0 ? totalCostBasis / totalShares : 0;
  const gainLoss = totalCurrentValue - totalCostBasis;
  const gainLossPercent = totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0;

  const currentPrice = stockPrices[normalizedTicker] || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/assets">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#e0e0e0]">{normalizedTicker} Holdings</h1>
          <p className="text-[#8a8a8a]">
            {holdings.length} lot{holdings.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-[#8a8a8a]">Total Shares</p>
            <p className="text-2xl font-bold text-[#4fc1ff]">{totalShares.toFixed(4)}</p>
            {currentPrice !== null && (
              <p className="text-xs text-[#8a8a8a] mt-1">
                Current Price: {formatCurrencyDetailed(currentPrice)}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-[#8a8a8a]">Total Cost Basis</p>
            <p className="text-2xl font-bold text-[#e0e0e0]">{formatCurrency(totalCostBasis)}</p>
            {avgCostPerShare > 0 && (
              <p className="text-xs text-[#8a8a8a] mt-1">
                Avg Cost/Share: {formatCurrencyDetailed(avgCostPerShare)}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-[#8a8a8a]">Current Value</p>
            <p className="text-2xl font-bold text-[#4ec9b0]">{formatCurrency(totalCurrentValue)}</p>
            {totalCostBasis > 0 && (
              <p className={`text-xs mt-1 ${gainLoss >= 0 ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainLossPercent.toFixed(2)}%)
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-[#3c3c3c]">
          <h2 className="text-lg font-semibold text-[#e0e0e0]">Lots</h2>
        </div>
        <ul className="divide-y divide-[#3c3c3c]">
          {holdings.map((asset) => {
            const lotShares = asset.shares || 0;
            const lotCostBasis = getTotalCostBasis(asset);
            const lotGainLoss = lotCostBasis > 0 ? asset.calculated_value - lotCostBasis : 0;
            const lotGainLossPercent = lotCostBasis > 0 ? (lotGainLoss / lotCostBasis) * 100 : 0;
            return (
              <li key={asset.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#e0e0e0] truncate">{asset.name}</p>
                  <p className="text-sm text-[#8a8a8a]">
                    {asset.purchase_date ? `Purchased ${asset.purchase_date} · ` : ''}
                    {lotShares} shares
                  </p>
                  {asset.cost_basis && asset.cost_basis > 0 && (
                    <p className="text-xs text-[#8a8a8a]">
                      Cost/Share: {formatCurrencyDetailed(asset.cost_basis)}
                    </p>
                  )}
                </div>
                <div className="text-right mr-4">
                  <p className="font-medium text-[#e0e0e0]">{formatCurrency(asset.calculated_value)}</p>
                  {lotCostBasis > 0 && (
                    <p className={`text-xs ${lotGainLoss >= 0 ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                      {lotGainLoss >= 0 ? '+' : ''}{formatCurrency(lotGainLoss)} ({lotGainLossPercent.toFixed(2)}%)
                    </p>
                  )}
                </div>
                <Link to={`/assets/${asset.id}`}>
                  <Button variant="ghost" size="sm">Edit</Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
