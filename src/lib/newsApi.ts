import type { NewsArticle } from '../types';

const CORS_PROXY = 'https://corsproxy.io/?';
const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search';
const YAHOO_NEWS_RSS = 'https://feeds.finance.yahoo.com/rss/2.0/headline';

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseRSSFeed(xmlString: string, sourceName: string): NewsArticle[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  if (doc.querySelector('parsererror')) {
    console.error('RSS parse error for', sourceName);
    return [];
  }

  const items = doc.querySelectorAll('item');
  const articles: NewsArticle[] = [];

  items.forEach((item) => {
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const description = item.querySelector('description')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
    const source = item.querySelector('source')?.textContent?.trim() || sourceName;

    if (title && link) {
      // Strip HTML tags from description
      const cleanDescription = description.replace(/<[^>]*>/g, '').trim();

      articles.push({
        id: link,
        title,
        description: cleanDescription,
        url: link,
        source,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  });

  return articles;
}

export async function fetchGoogleNewsRSS(query: string): Promise<NewsArticle[]> {
  const googleUrl = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const url = `${CORS_PROXY}${encodeURIComponent(googleUrl)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    return parseRSSFeed(xml, 'Google News');
  } catch (error) {
    console.error('Error fetching Google News RSS:', error);
    return [];
  }
}

export async function fetchYahooNewsRSS(tickers: string[]): Promise<NewsArticle[]> {
  if (tickers.length === 0) return [];

  const tickerString = tickers.join(',');
  const yahooUrl = `${YAHOO_NEWS_RSS}?s=${encodeURIComponent(tickerString)}&region=US&lang=en-US`;
  const url = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    return parseRSSFeed(xml, 'Yahoo Finance');
  } catch (error) {
    console.error('Error fetching Yahoo News RSS:', error);
    return [];
  }
}

export function deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
}
