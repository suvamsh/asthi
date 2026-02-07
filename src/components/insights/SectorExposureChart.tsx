import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import type { SectorAllocation } from '../../lib/insights/insightTypes';

interface SectorExposureChartProps {
  allocations: SectorAllocation[];
}

const COLORS = [
  '#4fc1ff', '#4ec9b0', '#cca700', '#ce9178', '#c586c0',
  '#9cdcfe', '#d7ba7d', '#569cd6', '#d16969', '#6a9955',
  '#b5cea8',
];

interface DeviationRow {
  sector: string;
  diffPct: number;
  hasExposure: boolean;
}

function SectorExposureInner({ allocations }: SectorExposureChartProps) {
  const held = allocations.filter(a => a.portfolioWeight > 0.001);

  if (held.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-[#8a8a8a] text-sm">
        No sector data available
      </div>
    );
  }

  const donutData = held.map(a => ({
    name: a.sector,
    value: Math.round(a.portfolioWeight * 1000) / 10,
  }));

  // Deviations: >2% absolute diff OR missing major sectors (benchmark >5%, portfolio 0%)
  const deviations: DeviationRow[] = allocations
    .filter(a => {
      const absDiff = Math.abs(a.diff);
      const missingMajor = a.portfolioWeight < 0.001 && a.benchmarkWeight > 0.05;
      return absDiff > 0.02 || missingMajor;
    })
    .map(a => ({
      sector: a.sector,
      diffPct: Math.round(a.diff * 100),
      hasExposure: a.portfolioWeight > 0.001,
    }))
    .sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct));

  return (
    <>
      {/* Donut chart */}
      <div className="h-[160px] -mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              dataKey="value"
              strokeWidth={1}
              stroke="#252526"
            >
              {donutData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Inline legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4 justify-center">
        {donutData.map((entry, i) => (
          <span key={entry.name} className="flex items-center gap-1 text-[10px] text-[#8a8a8a]">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {entry.name} {entry.value}%
          </span>
        ))}
      </div>

      {/* Deviation list */}
      {deviations.length > 0 && (
        <div className="border-t border-[#3c3c3c] pt-3">
          <h4 className="text-[11px] text-[#6e6e6e] uppercase tracking-wider mb-2">vs S&P 500</h4>
          <div className="space-y-1.5">
            {deviations.map(d => {
              const Icon = d.diffPct > 0 ? TrendingUp : d.diffPct < 0 ? TrendingDown : Minus;
              const color = d.diffPct > 0 ? '#cca700' : d.diffPct < 0 ? '#4fc1ff' : '#6e6e6e';

              return (
                <div key={d.sector} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#cccccc]">
                    <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
                    <span className="truncate">{d.sector}</span>
                  </div>
                  <span className="font-mono ml-2 flex-shrink-0" style={{ color }}>
                    {!d.hasExposure ? (
                      <span className="text-[#6e6e6e]">No exposure</span>
                    ) : (
                      `${d.diffPct > 0 ? '+' : ''}${d.diffPct}%`
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export function SectorExposureContent({ allocations }: SectorExposureChartProps) {
  return <SectorExposureInner allocations={allocations} />;
}

export function SectorExposureChart({ allocations }: SectorExposureChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector Exposure</CardTitle>
      </CardHeader>
      <SectorExposureInner allocations={allocations} />
    </Card>
  );
}
