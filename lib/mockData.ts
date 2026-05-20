import type { GearPrice } from '@/lib/dataAccess'

export type Region = 'nationwide' | 'chugoku' | 'tokyo_23'

const BASE_GEAR: GearPrice[] = [
  {
    id: 'mock-001',
    title: 'シマノ ソアレ BB アジング S74UL-S',
    manufacturer: 'シマノ',
    price: 12800,
    platform: 'rakuten',
    url: 'https://example.rakuten.co.jp/item/001',
    affiliateUrl: 'https://example.rakuten.co.jp/item/001?af=1',
    image: 'https://placehold.co/200x200/e8f4f8/2c5f7a?text=ロッド',
    shopName: 'フィッシング山田',
    fetchedAt: '2026-05-14T00:00:00Z',
    competitorPrice: 13500,
    competitorPlatform: 'yahoo',
  },
  {
    id: 'mock-002',
    title: 'ダイワ レブロス LT2000S',
    manufacturer: 'ダイワ',
    price: 7980,
    platform: 'yahoo',
    url: 'https://store.shopping.yahoo.co.jp/item/002',
    affiliateUrl: 'https://store.shopping.yahoo.co.jp/item/002?af=1',
    image: 'https://placehold.co/200x200/f0f8e8/2c7a3f?text=リール',
    shopName: '釣具のポイント',
    fetchedAt: '2026-05-14T00:00:00Z',
    competitorPrice: 8500,
    competitorPlatform: 'rakuten',
  },
  {
    id: 'mock-003',
    title: 'がまかつ サビキ仕掛け 6号 5セット',
    manufacturer: 'がまかつ',
    price: 980,
    platform: 'rakuten',
    url: 'https://example.rakuten.co.jp/item/003',
    affiliateUrl: 'https://example.rakuten.co.jp/item/003?af=1',
    image: 'https://placehold.co/200x200/f8f0e8/7a4f2c?text=仕掛け',
    shopName: 'つり具センター',
    fetchedAt: '2026-05-14T00:00:00Z',
    competitorPrice: 1080,
    competitorPlatform: 'yahoo',
  },
]

const CHUGOKU_GEAR: GearPrice[] = [
  {
    id: 'mock-chugoku-001',
    title: 'シマノ スピニングロッド ホリデー磯 2号 450',
    manufacturer: 'シマノ',
    price: 9800,
    platform: 'rakuten',
    url: 'https://example.rakuten.co.jp/item/c001',
    affiliateUrl: 'https://example.rakuten.co.jp/item/c001?af=1',
    image: 'https://placehold.co/200x200/e8f0f8/2c3f7a?text=磯竿',
    shopName: '中国フィッシング',
    fetchedAt: '2026-05-14T00:00:00Z',
    competitorPrice: 10200,
    competitorPlatform: 'yahoo',
  },
  {
    id: 'mock-chugoku-002',
    title: 'ダイワ タチウオ専用テンヤ 30号',
    manufacturer: 'ダイワ',
    price: 680,
    platform: 'yahoo',
    url: 'https://store.shopping.yahoo.co.jp/item/c002',
    affiliateUrl: 'https://store.shopping.yahoo.co.jp/item/c002?af=1',
    image: 'https://placehold.co/200x200/f8f8e8/7a7a2c?text=テンヤ',
    shopName: '瀬戸内釣具店',
    fetchedAt: '2026-05-14T00:00:00Z',
    competitorPrice: 750,
    competitorPlatform: 'rakuten',
  },
]

const TOKYO_GEAR: GearPrice[] = [
  {
    id: 'mock-tokyo-001',
    title: 'シマノ エンカウンター S96M',
    manufacturer: 'シマノ',
    price: 15800,
    platform: 'rakuten',
    url: 'https://example.rakuten.co.jp/item/t001',
    affiliateUrl: 'https://example.rakuten.co.jp/item/t001?af=1',
    image: 'https://placehold.co/200x200/f8e8f8/7a2c7a?text=シーバス',
    shopName: '東京湾フィッシング',
    fetchedAt: '2026-05-14T00:00:00Z',
    competitorPrice: 16500,
    competitorPlatform: 'yahoo',
  },
  {
    id: 'mock-tokyo-002',
    title: 'ヤマシタ タコ釣り エギ 3.5号',
    manufacturer: 'ヤマシタ',
    price: 1280,
    platform: 'yahoo',
    url: 'https://store.shopping.yahoo.co.jp/item/t002',
    affiliateUrl: 'https://store.shopping.yahoo.co.jp/item/t002?af=1',
    image: 'https://placehold.co/200x200/e8e8f8/2c2c7a?text=エギ',
    shopName: '江東区釣具',
    fetchedAt: '2026-05-14T00:00:00Z',
    competitorPrice: 1380,
    competitorPlatform: 'rakuten',
  },
]

export function getMockGearByRegion(region: Region): GearPrice[] {
  switch (region) {
    case 'chugoku': return [...CHUGOKU_GEAR, ...BASE_GEAR].slice(0, 6)
    case 'tokyo_23': return [...TOKYO_GEAR, ...BASE_GEAR].slice(0, 6)
    default: return BASE_GEAR  // nationwide
  }
}

export const MOCK_GEAR = BASE_GEAR
