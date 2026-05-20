/**
 * @deprecated
 * Use: providers/yahoo/index.ts
 *
 * Removal: after all imports migrate to @/providers/yahoo
 * Cleanup stage: Phase 1 cleanup
 */
const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID!
const BASE_URL = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch'

export interface YahooItem {
  name: string
  price: number
  url: string
  affiliateUrl: string
  image: { medium: string }
  seller: { name: string }
}

export async function searchYahooGear(keyword: string): Promise<YahooItem[]> {
  const params = new URLSearchParams({
    appid: YAHOO_CLIENT_ID,
    query: keyword,
    results: '30',
    sort: '+price',
    category_id: '2502', // 釣り
  })

  const res = await fetch(`${BASE_URL}?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Yahoo API error: ${res.status}`)

  const data = await res.json()
  return data.hits ?? []
}

// @deprecated: Use providers/yahoo instead
export * from '@/providers/yahoo'

// @deprecated: Use providers/yahoo instead
export * from '@/providers/yahoo'
