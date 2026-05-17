import { supabaseAdmin } from './supabase'

export interface GearPrice {
  id?: string
  gear_name: string
  shop: 'rakuten' | 'yahoo'
  price: number
  url: string
  affiliate_url: string
  image_url: string
  shop_name: string
  fetched_at: string
}

export async function upsertGearPrices(prices: GearPrice[]) {
  const { error } = await supabaseAdmin
    .from('gear_prices')
    .upsert(prices, { onConflict: 'gear_name,shop,shop_name' })

  if (error) throw error
}

export async function getLowestPrices(gearName: string) {
  const { data, error } = await supabaseAdmin
    .from('gear_prices')
    .select('*')
    .ilike('gear_name', `%${gearName}%`)
    .order('price', { ascending: true })
    .limit(10)

  if (error) throw error
  return data
}

export async function getTrendingGear() {
  const { data, error } = await supabaseAdmin
    .from('gear_prices')
    .select('gear_name, price, url, affiliate_url, image_url, shop_name, shop')
    .order('fetched_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}
