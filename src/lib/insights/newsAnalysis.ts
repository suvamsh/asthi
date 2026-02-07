import type { NewsArticle, AssetWithValue } from '../../types';
import type { Insight, ImpactChain, AffectedTickerDetail } from './insightTypes';
import { IMPACT_CHAINS } from './newsImpactMap';
import { getTickerSectorSync } from '../sectorMapping';
import { getTotalCostBasis } from '../calculations';

// --- Sentiment Analysis ---

const POSITIVE_WORDS = [
  'surge', 'soar', 'rally', 'gain', 'profit', 'growth', 'beat', 'exceed',
  'upgrade', 'bullish', 'record', 'boom', 'strong', 'outperform', 'breakout',
  'recovery', 'momentum', 'upside', 'optimism', 'raise', 'expand', 'positive',
  'dividend', 'buyback', 'innovation', 'breakthrough', 'approval',
];

const NEGATIVE_WORDS = [
  'crash', 'plunge', 'drop', 'loss', 'decline', 'miss', 'cut', 'downgrade',
  'bearish', 'recession', 'layoff', 'default', 'bankrupt', 'fraud', 'scandal',
  'warning', 'risk', 'sell-off', 'selloff', 'slump', 'weak', 'underperform',
  'lawsuit', 'investigation', 'fine', 'penalty', 'debt', 'crisis', 'concern',
];

function scoreArticleSentiment(article: NewsArticle): number {
  const text = `${article.title} ${article.description}`.toLowerCase();
  let score = 0;
  for (const word of POSITIVE_WORDS) {
    if (text.includes(word)) score += 1;
  }
  for (const word of NEGATIVE_WORDS) {
    if (text.includes(word)) score -= 1;
  }
  return score;
}

export function generateSentimentInsights(
  articles: NewsArticle[],
): Insight[] {
  if (articles.length === 0) return [];
  const insights: Insight[] = [];

  // Aggregate sentiment per ticker
  const tickerSentiment = new Map<string, { positive: number; negative: number; total: number }>();

  for (const article of articles) {
    if (!article.relatedTickers || article.relatedTickers.length === 0) continue;
    const score = scoreArticleSentiment(article);
    for (const ticker of article.relatedTickers) {
      const existing = tickerSentiment.get(ticker) || { positive: 0, negative: 0, total: 0 };
      existing.total += 1;
      if (score > 0) existing.positive += 1;
      if (score < 0) existing.negative += 1;
      tickerSentiment.set(ticker, existing);
    }
  }

  for (const [ticker, sentiment] of tickerSentiment) {
    if (sentiment.total < 2) continue;

    const positiveRatio = sentiment.positive / sentiment.total;
    const negativeRatio = sentiment.negative / sentiment.total;

    if (positiveRatio >= 0.6 && sentiment.positive >= 2) {
      insights.push({
        id: `sentiment-pos-${ticker}`,
        category: 'news_sentiment',
        severity: 'positive',
        title: `Positive news sentiment for ${ticker}`,
        description: `${sentiment.positive} of ${sentiment.total} recent articles have positive sentiment. Momentum may continue.`,
        metric: `${Math.round(positiveRatio * 100)}% positive`,
        tickers: [ticker],
      });
    } else if (negativeRatio >= 0.6 && sentiment.negative >= 2) {
      insights.push({
        id: `sentiment-neg-${ticker}`,
        category: 'news_sentiment',
        severity: 'warning',
        title: `Negative news sentiment for ${ticker}`,
        description: `${sentiment.negative} of ${sentiment.total} recent articles have negative sentiment. Monitor closely.`,
        metric: `${Math.round(negativeRatio * 100)}% negative`,
        tickers: [ticker],
      });
    }
  }

  return insights;
}

// --- Volume Alerts ---

export function generateVolumeInsights(
  articles: NewsArticle[],
): Insight[] {
  const insights: Insight[] = [];
  const tickerCounts = new Map<string, number>();

  for (const article of articles) {
    if (!article.relatedTickers) continue;
    for (const ticker of article.relatedTickers) {
      tickerCounts.set(ticker, (tickerCounts.get(ticker) || 0) + 1);
    }
  }

  for (const [ticker, count] of tickerCounts) {
    if (count >= 5) {
      insights.push({
        id: `volume-${ticker}`,
        category: 'news_volume',
        severity: 'info',
        title: `High news volume for ${ticker}`,
        description: `${count} articles mention ${ticker}. Unusual news activity may signal upcoming volatility.`,
        metric: `${count} articles`,
        tickers: [ticker],
      });
    }
  }

  return insights;
}

// --- Impact Chain Matching ---

export function matchImpactChains(
  articles: NewsArticle[],
  assets: AssetWithValue[],
  totalPortfolioValue: number,
): ImpactChain[] {
  if (articles.length === 0 || assets.length === 0) return [];

  // Build lookup: sector/industry -> tickers in portfolio
  const sectorTickers = new Map<string, Set<string>>();
  const industryTickers = new Map<string, Set<string>>();

  // Build ticker -> aggregated asset data (handles multiple lots)
  const tickerAssets = new Map<string, AssetWithValue[]>();

  for (const asset of assets) {
    if (asset.is_account || !asset.ticker) continue;
    if (asset.type !== 'stock' && asset.type !== 'tax_advantaged') continue;

    const info = getTickerSectorSync(asset.ticker);
    if (!info) continue;

    if (!sectorTickers.has(info.sector)) sectorTickers.set(info.sector, new Set());
    sectorTickers.get(info.sector)!.add(asset.ticker);

    if (!industryTickers.has(info.industry)) industryTickers.set(info.industry, new Set());
    industryTickers.get(info.industry)!.add(asset.ticker);

    if (!tickerAssets.has(asset.ticker)) tickerAssets.set(asset.ticker, []);
    tickerAssets.get(asset.ticker)!.push(asset);
  }

  // Match articles to themes, accumulating all matching articles per theme
  const themeArticles = new Map<string, { title: string; url: string; source: string; publishedAt: string }[]>();

  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();

    for (const template of IMPACT_CHAINS) {
      const matched = template.keywords.some(kw => text.includes(kw));
      if (!matched) continue;

      if (!themeArticles.has(template.theme)) themeArticles.set(template.theme, []);
      const existing = themeArticles.get(template.theme)!;
      // Deduplicate by URL
      if (!existing.some(a => a.url === article.url)) {
        existing.push({
          title: article.title,
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt,
        });
      }
    }
  }

  // Build chains for themes that matched at least one article
  const chains: ImpactChain[] = [];

  for (const template of IMPACT_CHAINS) {
    const matchedArticles = themeArticles.get(template.theme);
    if (!matchedArticles || matchedArticles.length === 0) continue;

    // Find affected tickers in user's portfolio
    const affectedTickerSet = new Set<string>();
    for (const sector of template.affectedSectors) {
      const tickers = sectorTickers.get(sector);
      if (tickers) tickers.forEach(t => affectedTickerSet.add(t));
    }
    for (const industry of template.affectedIndustries) {
      const tickers = industryTickers.get(industry);
      if (tickers) tickers.forEach(t => affectedTickerSet.add(t));
    }

    if (affectedTickerSet.size === 0) continue;

    // Calculate exposure and gain/loss per ticker
    let exposureValue = 0;
    const affectedTickers: AffectedTickerDetail[] = [];

    for (const ticker of Array.from(affectedTickerSet).sort()) {
      const lots = tickerAssets.get(ticker);
      if (!lots) continue;

      const currentValue = lots.reduce((sum, a) => sum + a.calculated_value, 0);
      const costBasis = lots.reduce((sum, a) => sum + getTotalCostBasis(a), 0);
      const gainLoss = costBasis > 0 ? currentValue - costBasis : 0;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      exposureValue += currentValue;
      affectedTickers.push({ ticker, currentValue, costBasis, gainLoss, gainLossPercent });
    }

    const exposurePercent = totalPortfolioValue > 0 ? (exposureValue / totalPortfolioValue) * 100 : 0;

    chains.push({
      id: `impact-${template.theme}`,
      theme: template.theme,
      direction: template.direction,
      impact: template.impact,
      articles: matchedArticles,
      exposureValue,
      exposurePercent,
      affectedTickers,
    });
  }

  // Sort by exposure descending, cap at 8
  chains.sort((a, b) => b.exposureValue - a.exposureValue);
  return chains.slice(0, 8);
}
