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
    <div className="flex bg-[#252526] border border-[#3c3c3c] rounded-lg overflow-hidden">
      {/* Color stripe */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />

      <div className="flex-1 p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-[#e0e0e0]">{insight.title}</h4>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(insight.id)}
                  className="p-1 text-[#6e6e6e] hover:text-[#cccccc] transition-colors flex-shrink-0"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-[#8a8a8a] mt-1">{insight.description}</p>

            {/* Metric + Ticker chips */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {insight.metric && (
                <span
                  className="text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ color, backgroundColor: `${color}15` }}
                >
                  {insight.metric}
                </span>
              )}
              {insight.tickers?.map(ticker => (
                <Link
                  key={ticker}
                  to={`/holdings/${ticker}`}
                  className="text-xs px-1.5 py-0.5 rounded bg-[#37373d] text-[#4fc1ff] hover:bg-[#45454a] transition-colors"
                >
                  {ticker}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
