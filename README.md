# Asthi - Personal Net Worth Tracker

A Mint-like net worth tracking web app with support for stocks, real estate, gold, and manual assets. Mobile-friendly React frontend with Supabase backend.

## Features

- **Dashboard** with total net worth, allocation pie chart, and trend line chart
- **Stock Portfolio** tracking with real-time prices from Alpha Vantage
- **Real Estate** tracking with equity calculations
- **Gold/Precious Metals** tracking with spot price lookup
- **Manual Assets** for cash, crypto, and other holdings
- **Historical Tracking** with daily snapshots

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Charts**: Recharts
- **Backend/DB**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Auth**: Google SSO via Supabase Auth
- **Stock API**: Alpha Vantage (free tier)
- **Gold API**: metals.dev

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Alpha Vantage API key (free)

### Setup

1. Clone the repository:
   ```bash
   cd asthi
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key
   - `VITE_ALPHA_VANTAGE_API_KEY`: Your Alpha Vantage API key

4. Set up the database (CLI, no dashboard required):
   - Get your database URL from Supabase Project Settings → Database
   - Set it as an environment variable:
     - `SUPABASE_DB_URL=postgresql://...`
   - Run:
     - `npm run db:migrate`

5. Configure Google OAuth in Supabase:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials

6. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
asthi/
├── src/
│   ├── components/
│   │   ├── layout/       # Header, Sidebar, Layout
│   │   ├── dashboard/    # NetWorthCard, Charts, AssetList
│   │   ├── assets/       # Asset forms and modals
│   │   └── ui/           # Button, Input, Card, Modal
│   ├── hooks/            # useAuth, useAssets, useNetWorth
│   ├── lib/              # Supabase client, API utilities
│   ├── pages/            # Dashboard, Assets, Login
│   └── types/            # TypeScript definitions
├── supabase/
│   ├── migrations/       # SQL migrations
│   └── functions/        # Edge Functions
└── package.json
```

## Database Schema

- `profiles` - User profiles (extends Supabase Auth)
- `assets` - All asset types with type-specific fields
- `net_worth_history` - Daily snapshots for trend charts
- `labels` - User-defined labels for assets
- `asset_labels` - Junction table for asset-label tags
- `price_cache` - Cached stock prices to avoid API limits

## API Limits

- **Alpha Vantage Free Tier**: 25 requests/day
  - Prices are cached for 15 minutes
  - Shared price cache across all users

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Supabase Edge Functions

Deploy the daily snapshot function:
```bash
supabase functions deploy daily-snapshot
```

Set up a cron schedule using Supabase's pg_cron or an external service.

## License

MIT
