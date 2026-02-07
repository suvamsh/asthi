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
      className={`border border-[#3c3c3c] border-l-4 ${config.border} rounded-lg overflow-hidden`}
    >
      {/* Collapsed state — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 hover:bg-[#2a2a2a] transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Direction + Theme */}
            <div className="flex items-center gap-2 mb-1.5">
              <DirectionIcon className={`w-3.5 h-3.5 ${config.text} flex-shrink-0`} />
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                {chain.theme}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-xs bg-[#37373d] text-[#8a8a8a]`}>
                {chain.articles.length} {chain.articles.length === 1 ? 'article' : 'articles'}
              </span>
            </div>

            {/* Impact text */}
            <p className="text-xs text-[#8a8a8a] line-clamp-1 mb-1.5">
              {chain.impact}
            </p>

            {/* Exposure + first headline */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#cccccc] font-medium flex-shrink-0">
                {formatCurrency(chain.exposureValue)} ({chain.exposurePercent.toFixed(1)}%)
              </span>
              <span className="text-[#6e6e6e] truncate">
                &ldquo;{chain.articles[0]?.title}&rdquo;
              </span>
            </div>
          </div>

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#6e6e6e] flex-shrink-0 mt-0.5" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6e6e6e] flex-shrink-0 mt-0.5" />
          )}
        </div>
      </button>

      {/* Expanded state */}
      {expanded && (
        <div className="border-t border-[#3c3c3c] px-3 pb-3">
          {/* Articles list */}
          <div className="mt-3 mb-3">
            <p className="text-xs text-[#6e6e6e] mb-1.5 font-medium">Articles</p>
            <div className="space-y-1">
              {chain.articles.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 text-xs text-[#4fc1ff] hover:text-[#6dd0ff] transition-colors group"
                >
                  <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                  <span className="line-clamp-1">{article.title}</span>
                  <span className="text-[#6e6e6e] flex-shrink-0">({article.source})</span>
                </a>
              ))}
            </div>
          </div>

          {/* Exposed Holdings table */}
          <div>
            <p className="text-xs text-[#6e6e6e] mb-1.5 font-medium">Exposed Holdings</p>
            <div className="rounded border border-[#3c3c3c] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#2a2a2a] text-[#6e6e6e]">
                    <th className="text-left py-1.5 px-2 font-medium">Ticker</th>
                    <th className="text-right py-1.5 px-2 font-medium">Value</th>
                    <th className="text-right py-1.5 px-2 font-medium">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {chain.affectedTickers.map(t => {
                    const hasCostBasis = t.costBasis > 0;
                    const isPositive = t.gainLoss >= 0;
                    return (
                      <tr key={t.ticker} className="border-t border-[#3c3c3c]">
                        <td className="py-1.5 px-2">
                          <Link
                            to={`/holdings/${t.ticker}`}
                            className="text-[#4fc1ff] hover:text-[#6dd0ff]"
                          >
                            {t.ticker}
                          </Link>
                        </td>
                        <td className="text-right py-1.5 px-2 text-[#cccccc]">
                          {formatCurrency(t.currentValue)}
                        </td>
                        <td className="text-right py-1.5 px-2">
                          {hasCostBasis ? (
                            <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                              {isPositive ? '+' : ''}{formatCurrency(t.gainLoss)} ({isPositive ? '+' : ''}{t.gainLossPercent.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-[#6e6e6e]">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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

      <div className="space-y-3">
        {chains.map(chain => (
          <ImpactChainCard key={chain.id} chain={chain} />
        ))}
      </div>
    </Card>
  );
}
