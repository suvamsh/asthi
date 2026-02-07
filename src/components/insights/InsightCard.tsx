import { X, AlertTriangle, PieChart, TrendingUp, Newspaper, DollarSign, BarChart3, Scale, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Insight, InsightCategory, InsightSeverity } from '../../lib/insights/insightTypes';

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (id: string) => void;
}

const severityColors: Record<InsightSeverity, string> = {
  critical: '#f14c4c',
  warning: '#cca700',
  info: '#4fc1ff',
  positive: '#4ec9b0',
};

const categoryIcons: Record<InsightCategory, typeof AlertTriangle> = {
  concentration: AlertTriangle,
  sector: PieChart,
  asset_type: BarChart3,
  rebalancing: Scale,
  performance: TrendingUp,
  tax: DollarSign,
  health: Info,
  news_sentiment: Newspaper,
  news_volume: Newspaper,
  news_impact: Newspaper,
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const color = severityColors[insight.severity];
  const Icon = categoryIcons[insight.category] || Info;

  return (
    <div className="flex bg-[#252526] border border-[#3c3c3c] rounded overflow-hidden group">
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />

      <div className="flex-1 px-2 py-1.5 min-w-0">
        {/* Line 1: icon + title + metric + tickers + dismiss */}
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
          <span className="text-xs font-medium text-[#e0e0e0] min-w-0">{insight.title}</span>
          {insight.metric && (
            <span
              className="text-[11px] font-mono px-1 py-0.5 rounded flex-shrink-0"
              style={{ color, backgroundColor: `${color}15` }}
            >
              {insight.metric}
            </span>
          )}
          {insight.tickers?.map(ticker => (
            <Link
              key={ticker}
              to={`/holdings/${ticker}`}
              className="text-[11px] px-1 py-0.5 rounded bg-[#37373d] text-[#4fc1ff] hover:bg-[#45454a] transition-colors flex-shrink-0"
            >
              {ticker}
            </Link>
          ))}
          <div className="flex-1" />
          {onDismiss && (
            <button
              onClick={() => onDismiss(insight.id)}
              className="p-0.5 text-[#6e6e6e] hover:text-[#cccccc] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
              title="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {/* Line 2: description */}
        <p className="text-[11px] text-[#6e6e6e] mt-0.5 ml-[22px]">{insight.description}</p>
      </div>
    </div>
  );
}
