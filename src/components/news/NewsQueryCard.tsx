import { useState, type KeyboardEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface NewsQueryCardProps {
  onSearch: (query: string) => void;
  loading: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function NewsQueryCard({ onSearch, loading, searchInputRef }: NewsQueryCardProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try: 'tech news', 'what's happening in AI', 'AAPL earnings'"
            className="w-full pl-10 pr-3 py-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded-md text-[#cccccc] placeholder-[#6e6e6e] focus:outline-none focus:ring-2 focus:ring-[#0e639c] focus:border-[#0e639c]"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          size="md"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>
    </Card>
  );
}
