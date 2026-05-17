export type GearPrice = {
  id: string
  title: string
  price: number
  platform: 'rakuten' | 'yahoo'
  url: string
  affiliateUrl: string
  image?: string
  shopName: string
  fetchedAt: string
  manufacturer?: string
  competitorPrice?: number
  competitorPlatform?: 'rakuten' | 'yahoo'
}

const USE_MOCK = process.env.USE_MOCK_DATA === 'true'

async function getMockGear(region = 'nationwide'): Promise<GearPrice[]> {
  const { getMockGearByRegion } = await import('@/lib/mockData')
  return getMockGearByRegion(region as 'nationwide' | 'chugoku' | 'tokyo_23')
}

async function getCachedGear(keyword: string): Promise<GearPrice[] | null> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const since = new Date(Date.now() - 3600 * 1000).toISOString()
    const { data, error } = await supabaseAdmin
      .from('gear_prices')
      .select('*')
      .ilike('gear_name', `%${keyword}%`)
      .gte('fetched_at', since)
      .order('price', { ascending: true })
      .limit(20)
    if (error || !data?.length) return null
    return data.map(row => ({
      id: row.id,
      title: row.gear_name,
      price: row.price,
      platform: row.shop as 'rakuten' | 'yahoo',
      url: row.url,
      affiliateUrl: row.affiliate_url,
      image: row.image_url,
      shopName: row.shop_name,
      fetchedAt: row.fetched_at,
    }))
  } catch { return null }
}

async function fetchFromProviders(keyword: string): Promise<GearPrice[]> {
  const { searchRakutenGear } = await import('@/providers/rakuten')
  const { searchYahooGear } = await import('@/providers/yahoo')
  const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), ms))])
  const [rakuten, yahoo] = await Promise.allSettled([
    withTimeout(searchRakutenGear(keyword), 5000),
    withTimeout(searchYahooGear(keyword), 5000),
  ])
  if (rakuten.status === 'rejected') console.warn('[dataAccess] Rakuten failed:', rakuten.reason)
  if (yahoo.status === 'rejected') console.warn('[dataAccess] Yahoo failed:', yahoo.reason)
  const items: GearPrice[] = [
    ...(rakuten.status === 'fulfilled' ? rakuten.value.map((i: any, idx: number) => ({
      id: `rakuten-${idx}-${Date.now()}`,
      title: i.itemName,
      price: i.itemPrice,
      platform: 'rakuten' as const,
      url: i.itemUrl,
      affiliateUrl: i.affiliateUrl || i.itemUrl,
      image: i.mediumImageUrls?.[0]?.imageUrl,
      shopName: i.shopName,
      fetchedAt: new Date().toISOString(),
    })) : []),
    ...(yahoo.status === 'fulfilled' ? yahoo.value.map((i: any, idx: number) => ({
      id: `yahoo-${idx}-${Date.now()}`,
      title: i.name,
      price: i.price,
      platform: 'yahoo' as const,
      url: i.url,
      affiliateUrl: i.affiliateUrl || i.url,
      image: i.image?.medium,
      shopName: i.seller?.name ?? '',
      fetchedAt: new Date().toISOString(),
    })) : []),
  ]
  return items.sort((a, b) => a.price - b.price)
}

export async function getTrendingGears(keyword = '釣り竿', region = 'nationwide'): Promise<GearPrice[]> {
  if (USE_MOCK) return getMockGear(region)
  const cached = await getCachedGear(keyword)
  if (cached) return cached
  const fresh = await fetchFromProviders(keyword)
  if (fresh.length > 0) {
    import('@/lib/supabase').then(({ supabaseAdmin }) => {
      supabaseAdmin.from('gear_prices').upsert(
        fresh.map(g => ({
          gear_name: keyword, shop: g.platform, price: g.price,
          url: g.url, affiliate_url: g.affiliateUrl,
          image_url: g.image ?? '', shop_name: g.shopName, fetched_at: g.fetchedAt,
        })),
        { onConflict: 'gear_name,shop,shop_name' }
      ).then(({ error }) => { if (error) console.warn('[cache write]', error) })
    })
  }
  return fresh
}

export async function getGearById(id: string): Promise<GearPrice | null> {
  if (USE_MOCK) {
    const { MOCK_GEAR } = await import('@/lib/mockData')
    return MOCK_GEAR.find(g => g.id === id) ?? null
  }
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data, error } = await supabaseAdmin.from('gear_prices').select('*').eq('id', id).single()
    if (error || !data) return null
    return {
      id: data.id, title: data.gear_name, price: data.price,
      platform: data.shop as 'rakuten' | 'yahoo', url: data.url,
      affiliateUrl: data.affiliate_url, image: data.image_url,
      shopName: data.shop_name, fetchedAt: data.fetched_at,
    }
  } catch { return null }
}
data.shop as 'rakuten' | 'yahoo', url: data.url,
      affiliateUrl: data.affiliate_url, image: data.image_url,
      shopName: data.shop_name, fetchedAt: data.fetched_at,
    }
  } catch { return null }
}
