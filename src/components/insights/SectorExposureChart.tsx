import { Card, CardHeader, CardTitle } from '../ui/Card';
import type { SectorAllocation } from '../../lib/insights/insightTypes';

interface SectorExposureChartProps {
  allocations: SectorAllocation[];
}

export function SectorExposureChart({ allocations }: SectorExposureChartProps) {
  // Only show sectors with either portfolio or benchmark weight
  const visible = allocations.filter(
    a => a.portfolioWeight > 0.001 || a.benchmarkWeight > 0.01
  );

  if (visible.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sector Exposure vs S&P 500</CardTitle>
        </CardHeader>
        <div className="h-32 flex items-center justify-center text-[#8a8a8a] text-sm">
          No sector data available
        </div>
      </Card>
    );
  }

  const maxWeight = Math.max(
    ...visible.map(a => Math.max(a.portfolioWeight, a.benchmarkWeight)),
    0.01,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sector Exposure vs S&P 500</CardTitle>
          <div className="flex items-center gap-3 text-[10px] text-[#8a8a8a]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4fc1ff]" />
              Portfolio
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#6e6e6e]" />
              S&P 500
            </span>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-3">
        {visible.map(alloc => {
          const portfolioPct = (alloc.portfolioWeight * 100).toFixed(0);
          const benchmarkPct = (alloc.benchmarkWeight * 100).toFixed(0);
          const diffPct = (alloc.diff * 100).toFixed(0);
          const diffColor = alloc.diff > 0.02 ? '#cca700' : alloc.diff < -0.02 ? '#8a8a8a' : '#4ec9b0';

          return (
            <div key={alloc.sector}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#cccccc] w-36 flex-shrink-0 truncate">{alloc.sector}</span>
                <span className="text-[10px] font-mono" style={{ color: diffColor }}>
                  {alloc.diff >= 0 ? '+' : ''}{diffPct}%
                </span>
              </div>
              {/* Portfolio bar */}
              <div className="h-2 bg-[#1e1e1e] rounded-full mb-0.5 overflow-hidden">
                <div
                  className="h-full bg-[#4fc1ff] rounded-full transition-all duration-500"
                  style={{ width: `${(alloc.portfolioWeight / maxWeight) * 100}%` }}
                />
              </div>
              {/* Benchmark bar */}
              <div className="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6e6e6e] rounded-full"
                  style={{ width: `${(alloc.benchmarkWeight / maxWeight) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#6e6e6e] mt-0.5">
                <span>{portfolioPct}%</span>
                <span>{benchmarkPct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
