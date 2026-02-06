import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { getAssetTypeLabel, formatCurrency } from '../../lib/calculations';
import type { AssetType, AssetWithValueAndLabels } from '../../types';

interface CustomAllocationChartProps {
  breakdown: Record<AssetType, number>;
  assets: AssetWithValueAndLabels[];
}

type ViewMode = 'type' | 'holding';

const vscodeColors: Record<AssetType, string> = {
  stock: '#4fc1ff',
  real_estate: '#4ec9b0',
  gold: '#dcdcaa',
  cash: '#c586c0',
  crypto: '#ce9178',
  tax_advantaged: '#569cd6',
  other: '#9cdcfe',
};

const holdingPalette = [
  '#4fc1ff', '#4ec9b0', '#dcdcaa', '#c586c0', '#ce9178',
  '#9cdcfe', '#d7ba7d', '#b5cea8', '#f48771', '#569cd6',
  '#d4d4d4',
];

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

function buildTypeData(breakdown: Record<AssetType, number>): ChartDataItem[] {
  return Object.entries(breakdown)
    .filter(([_, value]) => value > 0)
    .map(([type, value]) => ({
      name: getAssetTypeLabel(type as AssetType),
      value,
      color: vscodeColors[type as AssetType],
    }));
}

function buildHoldingData(assets: AssetWithValueAndLabels[]): ChartDataItem[] {
  const holdings = new Map<string, number>();

  for (const asset of assets) {
    if (asset.is_account) continue;
    const key = (asset.type === 'stock' || asset.type === 'tax_advantaged') && asset.ticker
      ? asset.ticker
      : asset.name;
    holdings.set(key, (holdings.get(key) || 0) + asset.calculated_value);
  }

  const sorted = Array.from(holdings.entries())
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  const top = sorted.slice(0, 10);
  const otherTotal = sorted.slice(10).reduce((sum, [_, v]) => sum + v, 0);

  const data: ChartDataItem[] = top.map(([name, value], i) => ({
    name,
    value,
    color: holdingPalette[i % holdingPalette.length],
  }));

  if (otherTotal > 0) {
    data.push({ name: 'Other', value: otherTotal, color: holdingPalette[10] });
  }

  return data;
}

export function CustomAllocationChart({ breakdown, assets }: CustomAllocationChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('type');

  const data = viewMode === 'type' ? buildTypeData(breakdown) : buildHoldingData(assets);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <div className="h-64 flex items-center justify-center text-[#8a8a8a]">
          No assets to display
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Asset Allocation</CardTitle>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          className="text-xs bg-[#3c3c3c] text-[#cccccc] border border-[#555] rounded px-2 py-1 outline-none focus:border-[#4fc1ff]"
        >
          <option value="type">By Asset Type</option>
          <option value="holding">By Holding</option>
        </select>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="#1e1e1e"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatCurrency(value as number), '']}
              contentStyle={{
                backgroundColor: '#252526',
                border: '1px solid #3c3c3c',
                borderRadius: '6px',
                color: '#cccccc',
              }}
              itemStyle={{ color: '#cccccc' }}
              labelStyle={{ color: '#cccccc' }}
            />
            <Legend
              formatter={(value) => {
                const item = data.find(d => d.name === value);
                const percent = item ? ((item.value / total) * 100).toFixed(1) : '0';
                return <span style={{ color: '#cccccc' }}>{value} ({percent}%)</span>;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
