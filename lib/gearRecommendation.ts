import type { GearPrice } from '@/lib/dataAccess'
import { isFishingProduct } from '@/lib/productFilter'
import type { FilterableProduct } from '@/lib/productFilter'

export type GearCategory =
  | 'rod' | 'reel' | 'lure' | 'worm' | 'jighead' | 'line'
  | 'hook' | 'rig' | 'safety' | 'cooler' | 'storage' | 'light' | 'tool' | 'wear'

export type GearRecommendationContext = {
  regionSlug?: string
  spotSlug?: string
  fishName?: string
  fishingMethod?: string
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
}

export type GearItem = {
  gear: GearPrice
  category: GearCategory
  isPrimary: boolean
  reason: string
}

export type GearSet = {
  title: string
  context: GearRecommendationContext
  items: GearItem[]
  dataSource: 'mock' | 'api' | 'manual'
  isMock: boolean
  reason: string
}

// キーワードマッチでカテゴリを推定
const CATEGORY_KEYWORDS: { category: GearCategory; patterns: RegExp }[] = [
  { category: 'rod',     patterns: /ロッド|釣り竿|釣竿|rod/i },
  { category: 'reel',    patterns: /リール|reel/i },
  { category: 'lure',    patterns: /ルアー|lure|ミノー|バイブ|スプーン/i },
  { category: 'worm',    patterns: /ワーム|worm|ソフト/i },
  { category: 'jighead', patterns: /ジグヘッド|jighead|jig head/i },
  { category: 'line',    patterns: /ライン|道糸|ハリス|leader|フロロ|ナイロン|PE/i },
  { category: 'hook',    patterns: /フック|針|hook/i },
  { category: 'rig',     patterns: /仕掛け|仕掛|リグ|rig|天秤|サビキ/i },
  { category: 'safety',  patterns: /ライフジャケット|救命|安全|life jacket|vest/i },
  { category: 'cooler',  patterns: /クーラー|cooler|保冷/i },
  { category: 'storage', patterns: /タックルボックス|収納|ケース|box/i },
  { category: 'light',   patterns: /ヘッドライト|ランタン|light|ライト/i },
  { category: 'tool',    patterns: /プライヤー|グリップ|tool|フィッシュグリップ|メジャー/i },
  { category: 'wear',    patterns: /グローブ|手袋|帽子|偏光|サングラス|wear/i },
]

export function classifyGearCategory(title: string): GearCategory {
  for (const { category, patterns } of CATEGORY_KEYWORDS) {
    if (patterns.test(title)) return category
  }
  return 'tool'
}

const PRIMARY_CATEGORIES = new Set<GearCategory>(['rod', 'reel', 'safety'])

function toFilterable(g: GearPrice): FilterableProduct {
  return { title: g.title, shopName: g.shopName }
}

export function isDummyUrl(url: string | undefined | null): boolean {
  if (!url) return true
  return url.includes('example.rakuten.co.jp') || url.includes('example.com')
}

/** @deprecated use isDummyUrl */
function isExampleUrl(url: string): boolean {
  return isDummyUrl(url)
}

export function recommendGearSet(
  context: GearRecommendationContext,
  gears: GearPrice[]
): GearSet | null {
  // 1. 非釣具除外
  const filtered = gears.filter(g => isFishingProduct(toFilterable(g)))

  // 2. 全商品 100円未満なら品質不足で null
  const hasReasonablePrice = filtered.some(g => g.price >= 100)
  if (!hasReasonablePrice) return null

  // 3. カテゴリ付与・選定（各カテゴリ最大2件）
  const countByCategory = new Map<GearCategory, number>()
  const items: GearItem[] = []

  for (const g of filtered) {
    const cat = classifyGearCategory(g.title)
    const count = countByCategory.get(cat) ?? 0
    if (count >= 2) continue
    countByCategory.set(cat, count + 1)

    const isPrimary = PRIMARY_CATEGORIES.has(cat)
    items.push({
      gear: g,
      category: cat,
      isPrimary,
      reason: isPrimary
        ? `${cat === 'rod' ? 'ロッド' : cat === 'reel' ? 'リール' : '安全装備'}は釣行の基本装備です`
        : `${g.title.slice(0, 12)}…があると釣果が期待できます`,
    })
  }

  // 4. rod / reel / safety 必須
  const hasRod    = items.some(i => i.category === 'rod')
  const hasReel   = items.some(i => i.category === 'reel')
  const hasSafety = items.some(i => i.category === 'safety')
  if (!hasRod || !hasReel || !hasSafety) return null

  // 5. dataSource・isMock 判定
  const allExampleUrl = items.every(i => isExampleUrl(i.gear.affiliateUrl))
  const isMock = allExampleUrl
  const dataSource: GearSet['dataSource'] = isMock ? 'mock' : 'api'

  const regionLabel = context.regionSlug ?? 'エリア'
  const fishLabel   = context.fishName   ?? '魚'

  return {
    title: `${regionLabel}で${fishLabel}を狙う釣行セット`,
    context,
    items,
    dataSource,
    isMock,
    reason: `${fishLab