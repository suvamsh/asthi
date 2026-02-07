import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/calculations';
import type { NetWorthHistory } from '../../types';

interface TrendChartProps {
  history: NetWorthHistory[];
  getHistoryForRange: (days: number) => NetWorthHistory[];
  loading?: boolean;
}

const timeRanges = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 0 },
];

export function TrendChart({ getHistoryForRange, loading }: TrendChartProps) {
  const [selectedRange, setSelectedRange] = useState(30);

  const data = getHistoryForRange(selectedRange).map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    value: item.total_value,
  }));

  return (
    <Card padding="sm" className="h-full flex flex-col">
      <CardHeader className="mb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">Trend</CardTitle>
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <Button
                key={range.label}
                variant={selectedRange === range.days ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full bg-[#3c3c3c]/30 rounded animate-pulse" />
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#8a8a8a]">
            No history data yet. Check back after a few days.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3c3c3c" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#8a8a8a' }}
                stroke="#3c3c3c"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#8a8a8a' }}
                stroke="#3c3c3c"
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(value)
                }
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), 'Net Worth']}
                contentStyle={{
                  backgroundColor: '#252526',
                  border: '1px solid #3c3c3c',
                  borderRadius: '6px',
                  color: '#cccccc',
                }}
                itemStyle={{ color: '#4fc1ff' }}
                labelStyle={{ color: '#cccccc' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4fc1ff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#4fc1ff', stroke: '#1e1e1e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
