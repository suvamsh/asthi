import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercentage } from '../../lib/calculations';

interface NetWorthCardProps {
  totalNetWorth: number;
  change: number | null;
  changePercent: number | null;
  loading?: boolean;
  isFiltered?: boolean;
}

export function NetWorthCard({ totalNetWorth, change, changePercent, loading, isFiltered }: NetWorthCardProps) {
  const isPositive = change !== null && change >= 0;

  return (
    <Card className="bg-gradient-to-br from-[#0e639c]/20 to-[#252526] border-[#0e639c]/30">
      <p className="text-[#9cdcfe] text-sm font-medium mb-1">Total Net Worth</p>
      {loading ? (
        <div className="h-12 bg-[#3c3c3c] rounded animate-pulse" />
      ) : (
        <p className="text-4xl font-bold tracking-tight text-[#4fc1ff]">
          {formatCurrency(totalNetWorth)}
        </p>
      )}

      {change !== null && changePercent !== null && (
        <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}{formatCurrency(change)} ({formatPercentage(changePercent)})
          </span>
          <span className="text-[#8a8a8a] text-sm ml-1">from previous</span>
        </div>
      )}

      {change === null && !isFiltered && totalNetWorth === 0 && (
        <p className="text-[#8a8a8a] text-sm mt-2">
          Add assets to start tracking your net worth
        </p>
      )}

      {isFiltered && (
        <p className="text-[#8a8a8a] text-sm mt-2">
          Showing filtered results
        </p>
      )}
    </Card>
  );
}
