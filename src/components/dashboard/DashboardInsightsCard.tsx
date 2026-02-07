import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { InsightCard } from '../insights/InsightCard';
import type { Insight, InsightSeverity } from '../../lib/insights/insightTypes';

interface DashboardInsightsCardProps {
  insights: Insight[];
  loading: boolean;
}

const severityOrder: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
};

export function DashboardInsightsCard({ insights, loading }: DashboardInsightsCardProps) {
  const sortedInsights = [...insights]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return (
    <Card padding="sm" className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="text-sm font-semibold text-[#e0e0e0]">Top Insights</h3>
        <Link
          to="/insights"
          className="flex items-center gap-1 text-xs text-[#4fc1ff] hover:text-[#6dd0ff] transition-colors"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-[#2d2d2d] rounded animate-pulse" />
          ))}
        </div>
      ) : sortedInsights.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
          {sortedInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-[#8a8a8a]">
          No alerts — your portfolio looks healthy
        </div>
      )}
    </Card>
  );
}
