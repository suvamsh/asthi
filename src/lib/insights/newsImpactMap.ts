export interface ImpactChainTemplate {
  theme: string;
  keywords: string[];
  impact: string;
  affectedSectors: string[];
  affectedIndustries: string[];
}

export const IMPACT_CHAINS: ImpactChainTemplate[] = [
  // AI & Technology
  {
    theme: 'AI Boom',
    keywords: ['artificial intelligence', 'ai boom', 'chatgpt', 'generative ai', 'ai model', 'ai chip'],
    impact: 'Increased demand for GPUs, cloud infrastructure, and AI software',
    affectedSectors: ['Technology'],
    affectedIndustries: ['Semiconductors', 'Cloud Computing', 'Software'],
  },
  {
    theme: 'Semiconductor Demand',
    keywords: ['chip shortage', 'semiconductor', 'chip demand', 'wafer', 'foundry'],
    impact: 'Supply constraints boost chip prices and semiconductor revenue',
    affectedSectors: ['Technology'],
    affectedIndustries: ['Semiconductors'],
  },
  {
    theme: 'Cloud Computing Growth',
    keywords: ['cloud computing', 'cloud revenue', 'data center', 'cloud migration'],
    impact: 'Growing enterprise cloud spending benefits cloud providers',
    affectedSectors: ['Technology'],
    affectedIndustries: ['Cloud Computing', 'Software', 'IT Services'],
  },

  // Interest Rates & Fed
  {
    theme: 'Interest Rate Cuts',
    keywords: ['rate cut', 'rate pause', 'dovish fed', 'lower rates', 'fed easing'],
    impact: 'Lower rates benefit growth stocks and real estate, hurt bank margins',
    affectedSectors: ['Technology', 'Real Estate', 'Consumer Discretionary'],
    affectedIndustries: ['Software', 'REITs', 'E-Commerce'],
  },
  {
    theme: 'Interest Rate Hikes',
    keywords: ['rate hike', 'hawkish fed', 'higher rates', 'fed tightening', 'rate increase'],
    impact: 'Higher rates pressure growth stocks but benefit banks and bonds',
    affectedSectors: ['Financials'],
    affectedIndustries: ['Banking', 'Insurance'],
  },
  {
    theme: 'Inflation',
    keywords: ['inflation', 'cpi', 'consumer prices', 'price increases', 'cost of living'],
    impact: 'Inflation erodes purchasing power, benefits commodities and pricing-power companies',
    affectedSectors: ['Energy', 'Materials', 'Consumer Staples'],
    affectedIndustries: ['Oil & Gas', 'Mining', 'Household Products'],
  },

  // Trade & Tariffs
  {
    theme: 'Trade Tariffs',
    keywords: ['tariff', 'trade war', 'import duty', 'trade restriction', 'trade deficit'],
    impact: 'Tariffs increase costs for importers, benefit domestic producers',
    affectedSectors: ['Industrials', 'Consumer Discretionary', 'Materials'],
    affectedIndustries: ['Machinery', 'Retail', 'Mining'],
  },
  {
    theme: 'China Trade',
    keywords: ['china trade', 'china tariff', 'us china', 'decoupling', 'chinese exports'],
    impact: 'Trade tensions with China affect supply chains and tech companies',
    affectedSectors: ['Technology', 'Consumer Discretionary', 'Industrials'],
    affectedIndustries: ['Semiconductors', 'Consumer Electronics', 'E-Commerce'],
  },

  // Energy
  {
    theme: 'Oil Prices Rising',
    keywords: ['oil price rise', 'crude oil up', 'opec cut', 'oil rally', 'energy crisis'],
    impact: 'Higher oil benefits energy producers, hurts transportation and consumers',
    affectedSectors: ['Energy'],
    affectedIndustries: ['Oil & Gas', 'Oil Services'],
  },
  {
    theme: 'Renewable Energy Push',
    keywords: ['renewable energy', 'solar', 'wind power', 'clean energy', 'ev mandate', 'green energy'],
    impact: 'Government incentives and demand shift benefit clean energy companies',
    affectedSectors: ['Utilities', 'Consumer Discretionary'],
    affectedIndustries: ['Electric Utilities', 'Electric Vehicles'],
  },

  // Regulation
  {
    theme: 'Tech Regulation',
    keywords: ['antitrust', 'tech regulation', 'big tech', 'monopoly', 'data privacy', 'regulate ai'],
    impact: 'Regulatory action could limit growth and force structural changes',
    affectedSectors: ['Technology', 'Communication Services'],
    affectedIndustries: ['Internet Services', 'Social Media', 'Software'],
  },
  {
    theme: 'Financial Regulation',
    keywords: ['banking regulation', 'bank capital', 'dodd-frank', 'financial regulation', 'bank stress test'],
    impact: 'Tighter rules increase compliance costs but reduce systemic risk',
    affectedSectors: ['Financials'],
    affectedIndustries: ['Banking', 'Investment Banking', 'Brokerage'],
  },
  {
    theme: 'Crypto Regulation',
    keywords: ['crypto regulation', 'sec crypto', 'bitcoin etf', 'stablecoin', 'crypto crackdown'],
    impact: 'Regulatory clarity can boost or suppress crypto and fintech',
    affectedSectors: ['Financials', 'Technology'],
    affectedIndustries: ['Fintech', 'Payments'],
  },

  // Economy
  {
    theme: 'Recession Risk',
    keywords: ['recession', 'economic slowdown', 'gdp decline', 'downturn', 'layoffs surge'],
    impact: 'Economic slowdown hurts cyclical stocks, benefits defensive sectors',
    affectedSectors: ['Consumer Staples', 'Healthcare', 'Utilities'],
    affectedIndustries: ['Household Products', 'Pharmaceuticals', 'Electric Utilities'],
  },
  {
    theme: 'Consumer Spending',
    keywords: ['consumer spending', 'retail sales', 'consumer confidence', 'holiday sales', 'consumer demand'],
    impact: 'Consumer spending trends directly impact retail and discretionary stocks',
    affectedSectors: ['Consumer Discretionary', 'Consumer Staples'],
    affectedIndustries: ['Retail', 'E-Commerce', 'Restaurants'],
  },
  {
    theme: 'Housing Market',
    keywords: ['housing market', 'home prices', 'mortgage rates', 'housing starts', 'real estate market'],
    impact: 'Housing trends affect homebuilders, REITs, and mortgage lenders',
    affectedSectors: ['Real Estate', 'Financials'],
    affectedIndustries: ['REITs', 'Banking', 'Home Improvement'],
  },

  // Healthcare
  {
    theme: 'Drug Approvals',
    keywords: ['fda approval', 'drug approval', 'clinical trial', 'pharma breakthrough', 'biotech'],
    impact: 'Drug approvals drive revenue for pharma and biotech companies',
    affectedSectors: ['Healthcare'],
    affectedIndustries: ['Pharmaceuticals', 'Biotechnology'],
  },
  {
    theme: 'Healthcare Reform',
    keywords: ['healthcare reform', 'drug pricing', 'medicare', 'health insurance', 'healthcare cost'],
    impact: 'Policy changes can compress margins for insurers and pharma',
    affectedSectors: ['Healthcare'],
    affectedIndustries: ['Insurance', 'Pharmaceuticals'],
  },

  // Geopolitical
  {
    theme: 'Geopolitical Tension',
    keywords: ['geopolitical', 'conflict', 'sanctions', 'military', 'war', 'invasion'],
    impact: 'Uncertainty drives flight to safety — gold, defense, and utilities benefit',
    affectedSectors: ['Industrials', 'Energy'],
    affectedIndustries: ['Defense', 'Oil & Gas'],
  },
  {
    theme: 'Supply Chain Disruption',
    keywords: ['supply chain', 'shipping disruption', 'port congestion', 'logistics crisis', 'supply shortage'],
    impact: 'Disruptions increase costs and delay deliveries across industries',
    affectedSectors: ['Industrials', 'Consumer Discretionary'],
    affectedIndustries: ['Logistics', 'Retail', 'Machinery'],
  },

  // Dollar & Commodities
  {
    theme: 'Strong Dollar',
    keywords: ['strong dollar', 'dollar rally', 'dollar index', 'usd strength'],
    impact: 'Strong dollar hurts exporters and multinationals, benefits importers',
    affectedSectors: ['Technology', 'Industrials'],
    affectedIndustries: ['Software', 'Machinery', 'Consumer Electronics'],
  },
  {
    theme: 'Gold Rally',
    keywords: ['gold price', 'gold rally', 'gold demand', 'safe haven', 'precious metals'],
    impact: 'Gold benefits from uncertainty and inflation expectations',
    affectedSectors: ['Materials'],
    affectedIndustries: ['Mining'],
  },

  // Labor & Employment
  {
    theme: 'Labor Market',
    keywords: ['jobs report', 'unemployment', 'hiring', 'labor shortage', 'wage growth'],
    impact: 'Tight labor raises costs for employers, strong jobs support consumer spending',
    affectedSectors: ['Consumer Discretionary', 'Industrials'],
    affectedIndustries: ['Restaurants', 'Retail', 'Logistics'],
  },
  {
    theme: 'Tech Layoffs',
    keywords: ['tech layoffs', 'layoff', 'workforce reduction', 'job cuts tech'],
    impact: 'Cost cuts can improve margins short-term but signal demand concerns',
    affectedSectors: ['Technology'],
    affectedIndustries: ['Software', 'Internet Services', 'Social Media'],
  },
];
