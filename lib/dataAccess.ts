import { excludeNonFishingProducts, classifyGearCategory } from '@/lib/productFilter'

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
  dataSource?: 'live' | 'mock'
}

const USE_MOCK = process.env.USE_MOCK_DATA === 'true'

/** example ドメインを持つ URL かどうか判定 */
function isMockUrl(url: string): boolean {
  return url.includes('example.rakuten.co.jp') || url.includes('example.com')
}

/**
 * モックデータにラベルを付ける
 * - dataSource = 'mock'
 * - title に [デモ商品] を付加（重複しないよう確認）
 */
function markMockItems(items: GearPrice[]): GearPrice[] {
  return items.map((item) => {
    if (!isMockUrl(item.url) && !isMockUrl(item.affiliateUrl)) return item
    return {
      ...item,
      dataSource: 'mock' as const,
      title: item.title.endsWith('[デモ商品]')
        ? item.title
        : `${item.title} [デモ商品]`,
    }
  })
}

/**
 * カテゴリ多様性 + 価格帯の複合スコアでソート（昇順）
 * score = (price / maxPrice) * 0.7 + (categoryCount / total) * 0.3
 * → 安い & カテゴリが希少な商品が上位
 */
function sortByDiversityAndPrice(items: GearPrice[]): GearPrice[] {
  if (items.length === 0) return items

  const categorized = items.map((item) => ({
    item,
    category: classifyGearCategory(item.title) ?? 'other',
  }))

  const counts: Record<string, number> = {}
  for (const { category } of categorized) {
    counts[category] = (counts[category] ?? 0) + 1
  }

  const maxPrice = Math.max(...items.map((i) => i.price), 1)
  const total = items.length

  return categorized
    .map(({ item, category }) => ({
      item,
      score:
        (item.price / maxPrice) * 0.7 +
        (counts[category] / total) * 0.3,
    }))
    .sort((a, b) => a.score - b.score)
    .map(({ item }) => item)
}

/**
 * 価格500円以上を優先し、その後500円未満を並べる（後方互換用）
 */
export function sortGearWithPrimaryFirst(items: GearPrice[]): GearPrice[] {
  const primary = items.filter(i => i.price >= 500).sort((a, b) => a.price - b.price)
  const supplementary = items.filter(i => i.price < 500).sort((a, b) => a.price - b.price)
  return [...primary, ...supplementary]
}

async function getMockGear(region = 'nationwide'): Promise<GearPrice[]> {
  const { getMockGearByRegion } = await import('@/lib/mockData')
  const items = await getMockGearByRegion(region as 'nationwide' | 'chugoku' | 'tokyo_23')
  return markMockItems(items)
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
    const mapped: GearPrice[] = data.map(row => ({
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
    const filtered = excludeNonFishingProducts(mapped)
    return sortByDiversityAndPrice(markMockItems(filtered))
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
  const raw: GearPrice[] = [
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
  // フィルタ → モックマーク → 多様性ソート
  const filtered = excludeNonFishingProducts(raw)
  const marked = markMockItems(filtered)
  return sortByDiversityAndPrice(marked)
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
    const item = MOCK_GEAR.find(g => g.id === id) ?? null
    if (!item) return null
    return markMockItems([item])[0]
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
