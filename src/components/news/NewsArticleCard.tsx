import { ExternalLink, Newspaper, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../lib/newsApi';
import type { NewsArticle } from '../../types';

function isRedditSource(source: string): boolean {
  return source.startsWith('r/');
}

interface NewsArticleCardProps {
  article: NewsArticle;
  compact?: boolean;
}

export function NewsArticleCard({ article, compact }: NewsArticleCardProps) {
  const isReddit = isRedditSource(article.source);

  return (
    <div className={`${compact ? 'p-2.5' : 'p-4'} bg-[#252526] border rounded-lg hover:border-[#4a4a4a] transition-colors ${isReddit ? 'border-[#ff4500]/25' : 'border-[#3c3c3c]'}`}>
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
            {isReddit ? (
              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[#ff4500]/10 text-[#ff6a33] border border-[#ff4500]/20">
                <MessageCircle className="w-3 h-3" />
                {article.source}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[#0e639c]/10 text-[#4fc1ff] border border-[#0e639c]/20">
                <Newspaper className="w-3 h-3" />
                {article.source}
              </span>
            )}
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
