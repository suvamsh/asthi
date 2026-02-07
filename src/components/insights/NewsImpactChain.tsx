import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ExternalLink, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import type { ImpactChain, ImpactDirection } from '../../lib/insights/insightTypes';
import { formatCurrency } from '../../lib/calculations';

interface NewsImpactChainProps {
  chains: ImpactChain[];
}

const directionConfig: Record<ImpactDirection, {
  border: string;
  bg: string;
  text: string;
  icon: typeof TrendingUp;
  label: string;
}> = {
  bullish: {
    border: 'border-l-green-500',
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    icon: TrendingUp,
    label: 'Bullish',
  },
  bearish: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    icon: TrendingDown,
    label: 'Bearish',
  },
  mixed: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    icon: Minus,
    label: 'Mixed',
  },
};

function ImpactChainCard({ chain }: { chain: ImpactChain }) {
  const [expanded, setExpanded] = useState(false);
  const config = directionConfig[chain.direction];
  const DirectionIcon = config.icon;

  return (
    <div
      className={`border border-[#3c3c3c] border-l-4 ${config.border} rounded overflow-hidden group/chain`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-2 py-1.5 hover:bg-[#2a2a2a] transition-colors"
      >
        {/* Line 1: direction + theme + exposure + tickers + chevron */}
        <div className="flex items-center gap-2">
          <DirectionIcon className={`w-3.5 h-3.5 ${config.text} flex-shrink-0`} />
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${config.bg} ${config.text} flex-shrink-0`}>
            {chain.theme}
          </span>
          <span className="text-[11px] text-[#cccccc] font-mono flex-shrink-0">
            {formatCurrency(chain.exposureValue)} ({chain.exposurePercent.toFixed(1)}%)
          </span>
          <span className="text-[11px] text-[#6e6e6e] flex-shrink-0">
            {chain.articles.length} {chain.articles.length === 1 ? 'article' : 'articles'}
          </span>
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            {chain.affectedTickers.map(t => (
              <span key={t.ticker} className="text-[11px] px-1 py-0.5 rounded bg-[#37373d] text-[#4fc1ff]">
                {t.ticker}
              </span>
            ))}
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#6e6e6e] ml-1" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#6e6e6e] ml-1" />
            )}
          </div>
        </div>
        {/* Line 2: impact text */}
        <p className="text-[11px] text-[#6e6e6e] mt-0.5 ml-[22px]">{chain.impact}</p>
      </button>

      {/* Expanded: articles + holdings inline */}
      {expanded && (
        <div className="border-t border-[#3c3c3c] px-2 py-1.5 space-y-1.5">
          {/* Articles */}
          {chain.articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-[#4fc1ff] hover:text-[#6dd0ff] transition-colors group/link ml-[22px]"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover/link:opacity-100" />
              <span className="min-w-0">{article.title}</span>
              <span className="text-[#6e6e6e] flex-shrink-0">({article.source})</span>
            </a>
          ))}

          {/* Holdings — compact inline rows */}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 ml-[22px] pt-1 border-t border-[#3c3c3c]">
            {chain.affectedTickers.map(t => {
              const hasCostBasis = t.costBasis > 0;
              const isPositive = t.gainLoss >= 0;
              return (
                <div key={t.ticker} className="flex items-center gap-1.5 text-[11px]">
                  <Link
                    to={`/holdings/${t.ticker}`}
                    className="text-[#4fc1ff] hover:text-[#6dd0ff] font-medium"
                  >
                    {t.ticker}
                  </Link>
                  <span className="text-[#8a8a8a]">{formatCurrency(t.currentValue)}</span>
                  {hasCostBasis && (
                    <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                      {isPositive ? '+' : ''}{t.gainLossPercent.toFixed(1)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function NewsImpactChainContent({ chains }: NewsImpactChainProps) {
  return (
    <div className="space-y-1">
      {chains.map(chain => (
        <ImpactChainCard key={chain.id} chain={chain} />
      ))}
    </div>
  );
}

export function NewsImpactChainSection({ chains }: NewsImpactChainProps) {
  if (chains.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#cca700]" />
          <CardTitle>News Impact Chains ({chains.length})</CardTitle>
        </div>
      </CardHeader>

      <NewsImpactChainContent chains={chains} />
    </Card>
  );
}
