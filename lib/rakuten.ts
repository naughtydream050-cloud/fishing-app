/**
 * @deprecated
 * Use: providers/rakuten/index.ts
 *
 * Removal: after all imports migrate to @/providers/rakuten
 * Cleanup stage: Phase 1 cleanup
 */
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID!
const BASE_URL = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706'

export interface RakutenItem {
  itemName: string
  itemPrice: number
  itemUrl: string
  affiliateUrl: string
  mediumImageUrls: { imageUrl: string }[]
  shopName: string
}

export async function searchRakutenGear(keyword: string, page = 1): Promise<RakutenItem[]> {
  const params = new URLSearchParams({
    applicationId: RAKUTEN_APP_ID,
    keyword,
    hits: '30',
    page: String(page),
    sort: '+itemPrice',
    genreId: '101154', // 釣り用品ジャンル
  })

  const res = await fetch(`${BASE_URL}?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Rakuten API error: ${res.status}`)

  const data = await res.json()
  return data.Items?.map((i: { Item: RakutenItem }) => i.Item) ?? []
}

// @deprecated: Use providers/rakuten instead
export * from '@/providers/rakuten'

// @deprecated: Use providers/rakuten instead
export * from '@/providers/rakuten'
