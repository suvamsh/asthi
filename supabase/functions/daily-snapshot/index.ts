// Daily snapshot Edge Function
// Schedule this function to run daily using Supabase's pg_cron
// or an external cron service

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Asset {
  id: string
  user_id: string
  name: string
  type: string
  ticker?: string
  shares?: number
  current_value?: number
  mortgage_amount?: number
  weight_oz?: number
  manual_value?: number
}

interface PriceCache {
  ticker: string
  price: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all users with assets
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')

    if (usersError) throw usersError

    // Get price cache
    const { data: priceCache } = await supabase
      .from('price_cache')
      .select('ticker, price')

    const stockPrices: Record<string, number> = {}
    priceCache?.forEach((p: PriceCache) => {
      stockPrices[p.ticker] = p.price
    })

    // Approximate gold price (you could fetch this from an API)
    const goldPrice = 2000 // USD per oz, approximate

    const today = new Date().toISOString().split('T')[0]
    const snapshots: { user_id: string; date: string; total_value: number; breakdown: Record<string, number> }[] = []

    for (const user of users || []) {
      // Get user's assets
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)

      if (assetsError) {
        console.error(`Error fetching assets for user ${user.id}:`, assetsError)
        continue
      }

      if (!assets || assets.length === 0) continue

      // Calculate values
      const breakdown: Record<string, number> = {
        stock: 0,
        real_estate: 0,
        gold: 0,
        cash: 0,
        crypto: 0,
        other: 0,
      }

      let totalValue = 0

      for (const asset of assets as Asset[]) {
        let value = 0

        switch (asset.type) {
          case 'stock':
            if (asset.ticker && asset.shares) {
              const price = stockPrices[asset.ticker] || 0
              value = price * asset.shares
            }
            break
          case 'real_estate':
            const currentValue = asset.current_value || 0
            const mortgage = asset.mortgage_amount || 0
            value = currentValue - mortgage // equity
            break
          case 'gold':
            if (asset.weight_oz) {
              value = asset.weight_oz * goldPrice
            }
            break
          default:
            value = asset.manual_value || 0
        }

        breakdown[asset.type] = (breakdown[asset.type] || 0) + value
        totalValue += value
      }

      snapshots.push({
        user_id: user.id,
        date: today,
        total_value: totalValue,
        breakdown,
      })
    }

    // Upsert all snapshots
    if (snapshots.length > 0) {
      const { error: upsertError } = await supabase
        .from('net_worth_history')
        .upsert(snapshots, {
          onConflict: 'user_id,date',
        })

      if (upsertError) throw upsertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${snapshots.length} snapshots for ${today}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in daily-snapshot:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
