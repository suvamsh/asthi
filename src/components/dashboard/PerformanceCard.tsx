import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../lib/calculations';

interface PerformanceCardProps {
  totalCostBasis: number;
  totalCurrentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  loading?: boolean;
}

export function PerformanceCard({
  totalCostBasis,
  totalCurrentValue,
  gainLoss,
  gainLossPercent,
  loading,
}: PerformanceCardProps) {
  const isPositive = gainLoss >= 0;

  if (totalCostBasis === 0) {
    return (
      <Card className="bg-gradient-to-br from-[#1e1e1e] to-[#252526] border-[#3c3c3c]">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-[#8a8a8a]" />
          <p className="text-[#9cdcfe] text-sm font-medium">Portfolio Performance</p>
        </div>
        <p className="text-[#8a8a8a] text-sm">
          Add cost basis to your assets to track performance
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#1e1e1e] to-[#252526] border-[#3c3c3c]">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-[#9cdcfe]" />
        <p className="text-[#9cdcfe] text-sm font-medium">Portfolio Performance</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-8 bg-[#3c3c3c] rounded animate-pulse" />
          <div className="h-6 bg-[#3c3c3c] rounded animate-pulse w-2/3" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-[#8a8a8a] mb-1">Cost Basis</p>
              <p className="text-lg font-semibold text-[#e0e0e0]">
                {formatCurrency(totalCostBasis)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8a8a8a] mb-1">Current Value</p>
              <p className="text-lg font-semibold text-[#4fc1ff]">
                {formatCurrency(totalCurrentValue)}
              </p>
            </div>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isPositive ? 'bg-[#4ec9b0]/10' : 'bg-[#f14c4c]/10'
          }`}>
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-[#4ec9b0]" />
              ) : (
                <TrendingDown className="w-5 h-5 text-[#f14c4c]" />
              )}
              <span className="text-sm text-[#8a8a8a]">Total Return</span>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isPositive ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
              </p>
              <p className={`text-sm ${isPositive ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
                {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
