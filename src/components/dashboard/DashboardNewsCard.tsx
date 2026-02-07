import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { NewsArticleCard } from '../news/NewsArticleCard';
import type { NewsArticle } from '../../types';

interface DashboardNewsCardProps {
  articles: NewsArticle[];
  loading: boolean;
}

export function DashboardNewsCard({ articles, loading }: DashboardNewsCardProps) {
  const topArticles = articles.slice(0, 3);

  return (
    <Card padding="sm" className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#e0e0e0]">Latest News</h3>
        <Link
          to="/news"
          className="flex items-center gap-1 text-xs text-[#4fc1ff] hover:text-[#6dd0ff] transition-colors"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#2d2d2d] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : topArticles.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {topArticles.map((article) => (
            <NewsArticleCard key={article.id} article={article} compact />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-[#8a8a8a]">
          No news available right now
        </div>
      )}
    </Card>
  );
}
