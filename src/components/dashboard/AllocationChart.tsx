import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { getAssetTypeLabel, formatCurrency } from '../../lib/calculations';
import type { AssetType } from '../../types';

interface AllocationChartProps {
  breakdown: Record<AssetType, number>;
}

// VSCode-style colorful palette
const vscodeColors: Record<AssetType, string> = {
  stock: '#4fc1ff',      // blue
  real_estate: '#4ec9b0', // teal
  gold: '#dcdcaa',       // yellow
  cash: '#c586c0',       // purple
  crypto: '#ce9178',     // orange
  other: '#9cdcfe',      // light blue
};

export function AllocationChart({ breakdown }: AllocationChartProps) {
  const data = Object.entries(breakdown)
    .filter(([_, value]) => value > 0)
    .map(([type, value]) => ({
      name: getAssetTypeLabel(type as AssetType),
      value,
      color: vscodeColors[type as AssetType],
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
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
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <div className="h-64">
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
