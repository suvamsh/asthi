import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import type { StrategyAlignmentScore, AllocationComparison, SectorComparison, AlignmentSuggestion } from '../../lib/insights/strategyAnalysis';

// --- Shared helpers (same as PortfolioHealthScore.tsx) ---

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
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#3c3c3c" strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-500"
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
      <span className="text-[11px] text-[#8a8a8a] w-[80px] flex-shrink-0 truncate">{label}</span>
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

// --- Strategy Alignment Banner ---

interface StrategyAlignmentBannerProps {
  score: StrategyAlignmentScore;
}

export function StrategyAlignmentBanner({ score }: StrategyAlignmentBannerProps) {
  return (
    <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg px-4 py-3 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <RingGauge value={score.overall} />
        <div className="flex-shrink-0">
          <div className="text-xs font-medium text-[#e0e0e0]">Strategy Alignment</div>
          <div className="text-[10px] text-[#6e6e6e]">/ 100</div>
        </div>
      </div>

      <div className="h-8 w-px bg-[#3c3c3c] hidden sm:block" />

      <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap">
        <MiniBar label="Asset Alloc" value={score.assetAllocation} />
        <MiniBar label="Sectors" value={score.sectorAlignment} />
        <MiniBar label="Risk Match" value={score.riskConsistency} />
      </div>
    </div>
  );
}

// --- Allocation Comparison Chart ---

interface AllocationComparisonChartProps {
  data: AllocationComparison[];
}

export function AllocationComparisonChart({ data }: AllocationComparisonChartProps) {
  if (data.length === 0) {
    return <p className="text-xs text-[#6e6e6e] text-center py-4">No allocation data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3c3c3c" />
        <XAxis dataKey="category" tick={{ fill: '#8a8a8a', fontSize: 11 }} />
        <YAxis tick={{ fill: '#8a8a8a', fontSize: 11 }} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 6 }}
          labelStyle={{ color: '#e0e0e0', fontSize: 12 }}
          itemStyle={{ fontSize: 11 }}
          formatter={(value) => [`${value}%`]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8a8a8a' }} />
        <Bar dataKey="actual" name="Actual" fill="#4fc1ff" radius={[2, 2, 0, 0]} />
        <Bar dataKey="target" name="Target" fill="#4ec9b0" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Sector Comparison Table ---

interface SectorComparisonTableProps {
  data: SectorComparison[];
}

const prefColors: Record<string, string> = {
  overweight: '#4ec9b0',
  neutral: '#4fc1ff',
  underweight: '#f14c4c',
};

export function SectorComparisonTable({ data }: SectorComparisonTableProps) {
  if (data.length === 0) {
    return <p className="text-xs text-[#6e6e6e] text-center py-4">No sector data available.</p>;
  }

  return (
    <div className="space-y-1">
      {data.map(row => (
        <div key={row.sector} className="flex items-center gap-2 py-1 px-1">
          <span className="text-xs text-[#cccccc] w-[130px] truncate flex-shrink-0">{row.sector}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 w-[52px] text-center"
            style={{
              color: prefColors[row.preference],
              backgroundColor: `${prefColors[row.preference]}15`,
            }}
          >
            {row.preference === 'overweight' ? 'Over' : row.preference === 'underweight' ? 'Under' : 'Neutral'}
          </span>
          <span className="text-xs font-mono text-[#8a8a8a] w-[42px] text-right flex-shrink-0">
            {row.actualPercent}%
          </span>
          <div className="flex-shrink-0">
            {row.aligned ? (
              <CheckCircle className="w-3.5 h-3.5 text-[#4ec9b0]" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-[#cca700]" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Alignment Suggestions ---

interface AlignmentSuggestionsProps {
  suggestions: AlignmentSuggestion[];
}

export function AlignmentSuggestions({ suggestions }: AlignmentSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <p className="text-xs text-[#6e6e6e] text-center py-4">
        Your portfolio is well-aligned with your strategy!
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {suggestions.map(s => {
        const color = s.severity === 'warning' ? '#cca700' : '#4fc1ff';
        const Icon = s.severity === 'warning' ? AlertTriangle : Info;

        return (
          <div key={s.id} className="flex bg-[#1e1e1e] border border-[#3c3c3c] rounded overflow-hidden">
            <div className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />
            <div className="flex-1 px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                <span className="text-xs font-medium text-[#e0e0e0]">{s.title}</span>
              </div>
              <p className="text-[11px] text-[#6e6e6e] mt-0.5 ml-[22px]">{s.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
