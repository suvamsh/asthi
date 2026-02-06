import { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { NewsQueryCard } from '../components/news/NewsQueryCard';
import { SectorChips } from '../components/news/SectorChips';
import { NewsFeed } from '../components/news/NewsFeed';
import { Button } from '../components/ui/Button';
import type { AssetWithValueAndLabels, NewsSector } from '../types';

interface NewsProps {
  assets: AssetWithValueAndLabels[];
}

export function News({ assets }: NewsProps) {
  const {
    portfolioNews,
    searchResults,
    suggestedSectors,
    loading,
    searchLoading,
    error,
    searchNews,
    refresh,
  } = useNews(assets);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasSearched = searchResults.length > 0;

  const handleSectorClick = (sector: NewsSector) => {
    // Fill search input and trigger search
    if (searchInputRef.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      nativeInputValueSetter?.call(searchInputRef.current, sector.name);
      searchInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    searchNews(sector.searchTerms[0]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e0e0e0]">News</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <NewsQueryCard
        onSearch={searchNews}
        loading={searchLoading}
        searchInputRef={searchInputRef}
      />

      {/* Sector suggestions */}
      <SectorChips
        sectors={suggestedSectors}
        onSectorClick={handleSectorClick}
      />

      {/* Error */}
      {error && (
        <div className="p-3 bg-[#f14c4c]/10 border border-[#f14c4c]/30 rounded-lg text-sm text-[#f14c4c]">
          {error}
        </div>
      )}

      {/* News feed */}
      {hasSearched ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#cccccc]">Search Results</h2>
            <button
              onClick={() => searchNews('')}
              className="text-xs text-[#8a8a8a] hover:text-[#cccccc] transition-colors"
            >
              Clear search
            </button>
          </div>
          <NewsFeed
            articles={searchResults}
            loading={searchLoading}
            emptyMessage="No results found. Try a different search."
          />
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-medium text-[#cccccc] mb-3">
            {assets.length > 0 ? 'Portfolio News' : 'Financial News'}
          </h2>
          <NewsFeed
            articles={portfolioNews}
            loading={loading}
            emptyMessage="No news available right now."
          />
        </div>
      )}
    </div>
  );
}
