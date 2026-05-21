import type { GearPrice } from '@/lib/dataAccess'
import { isFishingProduct } from '@/lib/productFilter'

export type GearCategory =
  | 'rod' | 'reel' | 'lure' | 'worm' | 'jighead' | 'line'
  | 'hook' | 'rig' | 'safety' | 'cooler' | 'storage' | 'light'
  | 'tool' | 'wear'

export type GearRecommendationContext = {
  regionSlug?: string
  spotSlug?: string
  fishName?: string
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
}

export type GearItem = {
  product: GearPrice
  category: GearCategory
  isPrimary: boolean
  reason: string
}

export type GearSet = {
  title: string
  context: GearRecommendationContext
  items: GearItem[]
  isMock: boolean
  reason: string
}

// More specific patterns first to avoid false matches (e.g. jighead before lure/jig)
const CATEGORY_PATTERNS: [GearCategory, RegExp][] = [
  ['safety',  /ライフジャケット|フローティングベスト/i],
  ['jighead', /ジグヘッド/i],
  ['rod',     /ロッド|釣竿|釣り竿|磯竿|バスロッド|投げ竿|船竿/i],
  ['reel',    /リール/i],
  ['worm',    /ワーム/i],
  ['lure',    /ルアー|ミノー|ジグ|エギ/i],
  ['line',    /PEライン|フロロ|ナイロン|釣り糸|ライン/i],
  ['hook',    /フック|釣り針|釣り 針/i],
  ['rig',     /仕掛け|天秤|テンヤ|サビキ/i],
  ['cooler',  /クーラーボックス/i],
  ['tool',    /フィッシュグリップ|タモ|ランディングネット|ペンチ|ハサミ/i],
  ['wear',    /フィッシングベスト|グローブ|ウェーダー/i],
]

export function classifyGearCategory(title: string): GearCategory | null {
  for (const [category, re] of CATEGORY_PATTERNS) {
    if (re.test(title)) return category
  }
  return null
}

const PRIMARY_CATEGORIES = new Set<GearCategory>(['rod', 'reel', 'safety'])
const SUPPLEMENTARY_CATEGORIES = new Set<GearCategory>(['lure', 'worm', 'rig', 'line', 'tool', 'cooler'])

export function recommendGearSet(
  context: GearRecommendationContext,
  products: GearPrice[]
): GearSet | null {
  const fishing = products.filter(p =>
    isFishingProduct({ title: p.title, shopName: p.shopName, manufacturer: p.manufacturer })
  )
  if (fishing.length === 0) return null

  const isMock = fishing.every(p => p.price < 100 || p.affiliateUrl.includes('example'))

  const seen = new Set<GearCategory>()
  const items: GearItem[] = []

  for (const product of fishing) {
    const category = classifyGearCategory(product.title)
    if (!category) continue
    if (seen.has(category)) continue
    seen.add(category)
    const isPrimary = PRIMARY_CATEGORIES.has(category)
    items.push({ product, category, isPrimary, reason: isPrimary ? '必須アイテム' : 'あると便利' })
  }

  const hasRod    = items.some(i => i.category === 'rod')
  const hasReel   = items.some(i => i.category === 'reel')
  const hasSafety = items.some(i => i.category === 'safety')
  if (!hasRod || !hasReel || !hasSafety) return null

  if (items.every(i => i.product.price < 100)) return null

  const primary      = items.filter(i => PRIMARY_CATEGORIES.has(i.category))
  const supplementary = items.filter(i => SUPPLEMENTARY_CATEGORIES.has(i.category))

  const fish = context.fishName ? `${context.fishName}釣り` : '釣り'

  return {
    title: `${fish}おすすめタックルセット`,
    context,
    items: [...primary, ...supplementary],
    isMock,
    reason: 'ロッド・リール・安全装備を含む釣行セットです。商品の傾向に基づいた参考セットです。',
  }
}
