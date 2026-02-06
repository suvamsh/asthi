import type { NewsSector } from '../../types';

interface SectorChipsProps {
  sectors: NewsSector[];
  onSectorClick: (sector: NewsSector) => void;
}

const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#3b82f6',
  'Communication Services': '#8b5cf6',
  'Consumer Discretionary': '#f59e0b',
  'Consumer Staples': '#10b981',
  'Healthcare': '#ec4899',
  'Financials': '#06b6d4',
  'Energy': '#f97316',
  'Industrials': '#6366f1',
  'Materials': '#a78bfa',
  'Real Estate': '#14b8a6',
  'Utilities': '#84cc16',
  'Commodities': '#eab308',
  'Cryptocurrency': '#f59e0b',
  'Economy': '#0ea5e9',
  'Retirement': '#8b5cf6',
  'Broad Market': '#64748b',
  'Fixed Income': '#94a3b8',
};

function getSectorColor(sectorName: string): string {
  if (SECTOR_COLORS[sectorName]) return SECTOR_COLORS[sectorName];
  // Hash-based fallback
  let hash = 0;
  for (let i = 0; i < sectorName.length; i++) {
    hash = sectorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = Object.values(SECTOR_COLORS);
  return colors[Math.abs(hash) % colors.length];
}

export function SectorChips({ sectors, onSectorClick }: SectorChipsProps) {
  if (sectors.length === 0) {
    return (
      <div className="text-sm text-[#8a8a8a]">
        Add assets to see personalized suggestions
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-[#8a8a8a] mb-2">Based on your portfolio</p>
      <div className="flex flex-wrap gap-2">
        {sectors.map((sector) => {
          const color = getSectorColor(sector.name);
          return (
            <button
              key={sector.name}
              onClick={() => onSectorClick(sector)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors hover:brightness-125 cursor-pointer"
              style={{
                backgroundColor: `${color}20`,
                color: color,
                border: `1px solid ${color}40`,
              }}
            >
              {sector.name}
              <span
                className="text-xs opacity-70"
                style={{ color }}
              >
                ({sector.assetCount})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
