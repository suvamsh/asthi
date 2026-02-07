import type { PortfolioHealthScore as HealthScore } from '../../lib/insights/insightTypes';

interface PortfolioHealthBannerProps {
  score: HealthScore;
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#4ec9b0';
  if (score >= 50) return '#cca700';
  if (score >= 25) return '#ce9178';
  return '#f14c4c';
}

function RingGauge({ value, size = 40 }: { value: number; size?: number }) {
  const color = getScoreColor(value);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#3c3c3c"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  const color = getScoreColor(value);
  const barWidth = Math.max(4, value);

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <span className="text-[11px] text-[#8a8a8a] w-[72px] flex-shrink-0 truncate">{label}</span>
      <div className="w-16 h-1.5 bg-[#3c3c3c] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-mono w-5 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export function PortfolioHealthBanner({ score }: PortfolioHealthBannerProps) {
  return (
    <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg px-4 py-3 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <RingGauge value={score.overall} />
        <div className="flex-shrink-0">
          <div className="text-xs font-medium text-[#e0e0e0]">Health Score</div>
          <div className="text-[10px] text-[#6e6e6e]">/ 100</div>
        </div>
      </div>

      <div className="h-8 w-px bg-[#3c3c3c] hidden sm:block" />

      <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap">
        <MiniBar label="Concentration" value={score.concentration} />
        <MiniBar label="Sectors" value={score.sectorDiversity} />
        <MiniBar label="Type Balance" value={score.typeBalance} />
        <MiniBar label="Holdings" value={score.holdingCount} />
      </div>
    </div>
  );
}
