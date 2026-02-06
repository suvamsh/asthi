import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import type { ImpactChain } from '../../lib/insights/insightTypes';

interface NewsImpactChainProps {
  chains: ImpactChain[];
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

      <div className="space-y-4">
        {chains.map(chain => (
          <div key={chain.id} className="border border-[#3c3c3c] rounded-lg p-3">
            {/* Headline */}
            <p className="text-xs text-[#cccccc] font-medium line-clamp-2 mb-2">
              "{chain.headline}"
            </p>

            {/* Chain visualization */}
            <div className="flex items-start gap-2 text-xs">
              {/* Theme */}
              <span className="px-2 py-1 rounded bg-[#cca700]/15 text-[#cca700] flex-shrink-0 font-medium">
                {chain.theme}
              </span>

              <ArrowRight className="w-3 h-3 mt-1 text-[#6e6e6e] flex-shrink-0" />

              {/* Impact */}
              <span className="text-[#8a8a8a] flex-1 min-w-0">
                {chain.impact}
              </span>

              <ArrowRight className="w-3 h-3 mt-1 text-[#6e6e6e] flex-shrink-0" />

              {/* Affected holdings */}
              <div className="flex flex-wrap gap-1 flex-shrink-0">
                {chain.affectedTickers.map(ticker => (
                  <Link
                    key={ticker}
                    to={`/holdings/${ticker}`}
                    className="px-1.5 py-0.5 rounded bg-[#37373d] text-[#4fc1ff] hover:bg-[#45454a] transition-colors"
                  >
                    {ticker}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
