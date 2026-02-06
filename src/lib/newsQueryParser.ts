const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'give', 'get', 'show', 'find', 'tell', 'let', 'make',
  'me', 'my', 'i', 'we', 'us', 'our', 'you', 'your',
  'some', 'any', 'all', 'about', 'on', 'in', 'for', 'with', 'of', 'to',
  'and', 'or', 'but', 'not', 'no', 'so', 'if', 'then',
  'what', 'whats', "what's", 'how', 'where', 'when', 'which', 'who',
  'happening', 'going', 'latest', 'recent', 'current', 'today',
  'news', 'update', 'updates', 'headlines', 'stories', 'articles',
  'please', 'thanks', 'hey', 'hi', 'hello',
]);

const CATEGORY_MAP: Record<string, string> = {
  'tech': 'technology stocks',
  'technology': 'technology stocks',
  'ai': 'artificial intelligence stocks',
  'artificial intelligence': 'artificial intelligence stocks',
  'ml': 'machine learning AI stocks',
  'crypto': 'cryptocurrency market',
  'bitcoin': 'bitcoin cryptocurrency',
  'ethereum': 'ethereum cryptocurrency',
  'blockchain': 'blockchain cryptocurrency',
  'real estate': 'real estate market housing',
  'housing': 'real estate housing market',
  'property': 'real estate property market',
  'gold': 'gold commodity price',
  'commodities': 'commodities market',
  'commodity': 'commodities market',
  'energy': 'energy stocks oil gas',
  'oil': 'oil energy commodity',
  'finance': 'financial sector banking stocks',
  'banking': 'banking financial sector stocks',
  'bank': 'banking financial sector stocks',
  'healthcare': 'healthcare pharmaceutical stocks',
  'pharma': 'pharmaceutical healthcare stocks',
  'ev': 'electric vehicle stocks',
  'electric vehicle': 'electric vehicle stocks',
  'semiconductor': 'semiconductor chip stocks',
  'chips': 'semiconductor chip stocks',
  'retail': 'retail consumer stocks',
  'consumer': 'consumer retail stocks',
  'defense': 'defense aerospace stocks',
  'aerospace': 'aerospace defense stocks',
  'cloud': 'cloud computing stocks',
  'saas': 'SaaS cloud software stocks',
  'market': 'stock market',
  'stocks': 'stock market',
  'bonds': 'bond market treasury',
  'treasury': 'treasury bonds yield',
  'fed': 'federal reserve interest rate',
  'inflation': 'inflation economy',
  'recession': 'recession economy',
  'economy': 'economy market',
  'earnings': 'earnings season stocks',
  'ipo': 'IPO stocks market',
  'dividend': 'dividend stocks income',
  'retirement': 'retirement 401k IRA investing',
};

export function extractKeywords(input: string): string[] {
  const normalized = input.toLowerCase().trim();
  const words = normalized.split(/\s+/).filter(Boolean);

  // Check multi-word categories first
  const multiWordMatches: string[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < words.length - 1; i++) {
    const twoWord = `${words[i]} ${words[i + 1]}`;
    if (CATEGORY_MAP[twoWord]) {
      multiWordMatches.push(twoWord);
      usedIndices.add(i);
      usedIndices.add(i + 1);
    }
  }

  // Filter remaining single words
  const singleWords = words.filter((word, idx) => {
    if (usedIndices.has(idx)) return false;
    if (STOP_WORDS.has(word)) return false;
    if (word.length < 2) return false;
    return true;
  });

  return [...multiWordMatches, ...singleWords];
}

function mapKeywordToCategory(keyword: string): string {
  // Exact match
  if (CATEGORY_MAP[keyword]) return CATEGORY_MAP[keyword];

  // Fuzzy substring match
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(keyword) || keyword.includes(key)) {
      return value;
    }
  }

  // Return as-is with financial context
  return `${keyword} stocks market`;
}

export function parseNewsQuery(input: string): string {
  const keywords = extractKeywords(input);

  if (keywords.length === 0) {
    return 'stock market financial news';
  }

  const mapped = keywords.map(mapKeywordToCategory);
  // Deduplicate mapped terms
  const unique = [...new Set(mapped)];

  return unique.join(' OR ');
}
