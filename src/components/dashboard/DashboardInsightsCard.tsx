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
  const topInsights = [...insights]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 3);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-[#e0e0e0]">Top Insights</h3>
        <Link
          to="/insights"
          className="flex items-center gap-1 text-xs text-[#4fc1ff] hover:text-[#6dd0ff] transition-colors"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#2d2d2d] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : topInsights.length > 0 ? (
        <div className="space-y-2">
          {topInsights.map((insight) => (
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
