import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import type { PortfolioHealthScore as HealthScore } from '../../lib/insights/insightTypes';

interface PortfolioHealthScoreProps {
  score: HealthScore;
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#4ec9b0';
  if (score >= 50) return '#cca700';
  if (score >= 25) return '#ce9178';
  return '#f14c4c';
}

function SubScore({ label, value }: { label: string; value: number }) {
  const color = getScoreColor(value);
  const barWidth = Math.max(4, value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#8a8a8a] w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#3c3c3c] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export function PortfolioHealthScoreCard({ score }: PortfolioHealthScoreProps) {
  const color = getScoreColor(score.overall);

  const chartData = [
    { name: 'score', value: score.overall, fill: color },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Health Score</CardTitle>
      </CardHeader>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Gauge */}
        <div className="relative w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={210}
              endAngle={-30}
              data={chartData}
              barSize={10}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={5}
                background={{ fill: '#3c3c3c' }}
                isAnimationActive={true}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color }}>{score.overall}</span>
            <span className="text-[10px] text-[#8a8a8a]">/ 100</span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="flex-1 w-full space-y-2">
          <SubScore label="Concentration" value={score.concentration} />
          <SubScore label="Sector Diversity" value={score.sectorDiversity} />
          <SubScore label="Type Balance" value={score.typeBalance} />
          <SubScore label="Holding Count" value={score.holdingCount} />
        </div>
      </div>
    </Card>
  );
}
