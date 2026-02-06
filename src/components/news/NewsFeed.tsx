import { useState } from 'react';
import { NewsArticleCard } from './NewsArticleCard';
import { Button } from '../ui/Button';
import type { NewsArticle } from '../../types';

interface NewsFeedProps {
  articles: NewsArticle[];
  loading: boolean;
  emptyMessage?: string;
}

const PAGE_SIZE = 20;

function NewsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg animate-pulse">
          <div className="h-4 bg-[#3c3c3c] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#3c3c3c] rounded w-full mb-1" />
          <div className="h-3 bg-[#3c3c3c] rounded w-1/2 mb-3" />
          <div className="flex gap-3">
            <div className="h-3 bg-[#3c3c3c] rounded w-16" />
            <div className="h-3 bg-[#3c3c3c] rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewsFeed({ articles, loading, emptyMessage = 'No news found' }: NewsFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (loading) {
    return <NewsSkeleton />;
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-[#8a8a8a]">
        {emptyMessage}
      </div>
    );
  }

  const visible = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <div className="space-y-3">
      {visible.map((article) => (
        <NewsArticleCard key={article.id} article={article} />
      ))}

      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
          >
            Load More ({articles.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
