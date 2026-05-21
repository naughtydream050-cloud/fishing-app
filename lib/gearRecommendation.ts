import { excludeNonFishingProducts, classifyGearCategory } from './productFilter'
import type { GearPrice } from './dataAccess'

export type Product = GearPrice & { isMock: boolean }

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
  product: Product
  category: GearCategory
  isPrimary: boolean
  reason: string
}

export type GearSet = {
  title: string
  context: GearRecommendationContext
  items: GearItem[]
  dataSource: 'manual' | 'mock' | 'api' | 'generated'
  isMock: boolean
  reason: string
}

export function recommendGearSet(
  context: GearRecommendationContext,
  products: Product[]
): GearSet | null {
  const filtered = excludeNonFishingProducts(products) as Product[]

  const categorized = filtered.map(p => ({
    product: p,
    category: (classifyGearCategory(p.title) ?? 'tool') as GearCategory,
  }))

  const hasRod    = categorized.some(c => c.category === 'rod')
  const hasReel   = categorized.some(c => c.category === 'reel')
  const hasSafety = categorized.some(c => c.category === 'safety')

  if (!hasRod || !hasReel || !hasSafety) return null

  const hasReasonablePrice = filtered.some(p => (p.price ?? 0) >= 100)
  if (!hasReasonablePrice) return null

  const primary: GearItem[] = []
  const supplementary: GearItem[] = []
  const categoryCount = new Map<GearCategory, number>()

  const primaryCategories = new Set<GearCategory>(['rod', 'reel', 'safety'])

  for (const { product, category } of categorized) {
    const count = categoryCount.get(category) ?? 0
    if (count >= 2) continue
    categoryCount.set(category, count + 1)

    const isPrimary = primaryCategories.has(category)
    const item: GearItem = {
      product,
      category,
      isPrimary,
      reason: isPrimary
        ? `${category}は釣行の基本装備です`
        : `${category}があると釣果が期待できます`,
    }
    isPrimary ? primary.push(item) : supplementary.push(item)
  }

  const items = [...primary, ...supplementary]
  const isMock = items.every(i => i.product.isMock)
  const dataSource = isMock ? 'mock' : 'api'

  const fishLabel   = context.fishName   ?? '魚'
  const regionLabel = context.regionSlug ?? 'エリア'

  return {
    title: `${regionLabel}で${fishLabel}を狙う釣行セット`,
    context,
    items,
    dataSource,
    isMock,
    reason: `${fishLabel}釣りに必要な基本装備をまとめました。実際の釣果を保証するものではありません。`,
  }
}
