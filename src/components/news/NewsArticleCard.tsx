import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../lib/newsApi';
import type { NewsArticle } from '../../types';

interface NewsArticleCardProps {
  article: NewsArticle;
  compact?: boolean;
}

export function NewsArticleCard({ article, compact }: NewsArticleCardProps) {
  return (
    <div className={`${compact ? 'p-2.5' : 'p-4'} bg-[#252526] border border-[#3c3c3c] rounded-lg hover:border-[#4a4a4a] transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2"
          >
            <h3 className="text-sm font-medium text-[#e0e0e0] group-hover:text-[#4fc1ff] transition-colors line-clamp-2">
              {article.title}
            </h3>
            <ExternalLink className="w-3.5 h-3.5 text-[#8a8a8a] flex-shrink-0 mt-0.5 group-hover:text-[#4fc1ff]" />
          </a>

          {!compact && article.description && (
            <p className="mt-1 text-xs text-[#8a8a8a] line-clamp-2">
              {article.description}
            </p>
          )}

          <div className={`${compact ? 'mt-1' : 'mt-2'} flex items-center gap-3`}>
            <span className="text-xs text-[#6e6e6e]">
              {article.source}
            </span>
            <span className="text-xs text-[#6e6e6e]">
              {formatRelativeTime(article.publishedAt)}
            </span>

            {article.relatedTickers && article.relatedTickers.length > 0 && (
              <div className="flex items-center gap-1 ml-1">
                {article.relatedTickers.slice(0, 5).map((ticker) => (
                  <Link
                    key={ticker}
                    to={`/holdings/${ticker}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#0e639c]/20 text-[#4fc1ff] border border-[#0e639c]/30 hover:bg-[#0e639c]/30 transition-colors"
                  >
                    {ticker}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
