import type { GearPrice } from '@/lib/dataAccess'

export type GearCategory =
  | 'rod'
  | 'reel'
  | 'lure'
  | 'worm'
  | 'jighead'
  | 'line'
  | 'hook'
  | 'rig'
  | 'safety'
  | 'cooler'
  | 'storage'
  | 'light'
  | 'tool'
  | 'wear'
  | 'unknown'

export type FishingStyle =
  | 'ajing'
  | 'mebaring'
  | 'seabass_lure'
  | 'sabiki'
  | 'eging'
  | 'fukase'
  | 'tenya'
  | 'bass_lure'
  | 'shore_jig'
  | 'general'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type PriceTier = 'budget' | 'mid' | 'premium'

export interface GearRecommendationContext {
  spotId: string
  spotName: string
  regionId: string
  fishTypes: string[]
  style: FishingStyle
  level: ExperienceLevel
  targetPriceTier: PriceTier
}

export interface ScoredGearItem {
  item: GearPrice
  category: GearCategory
  categoryScore: number
  priceTier: PriceTier
  reason: string
  isPrimaryItem: boolean
}

export interface GearSet {
  title: string
  context: GearRecommendationContext
  items: ScoredGearItem[]
  totalEstimatedCost: number
  dataSource: 'mock' | 'api'
  generatedAt: string
}

// 順序厳守: safety を line より先にチェックして誤マッチを防ぐ
const CATEGORY_PATTERNS: [GearCategory, RegExp][] = [
  ['safety',  /ライフジャケット|救命胴衣/],
  ['reel',    /リール/],
  ['rod',     /ロッド|釣竿|釣り竿|磯竿|バスロッド|投げ竿|船竿/],
  ['worm',    /ワーム/],
  ['jighead', /ジグヘッド|ジグ単/],
  ['lure',    /ルアー|バイブレーション|ミノー|クランクベイト|トップウォーター|スピナー/],
  ['rig',     /仕掛け|サビキ|テンヤ|エギ|天秤|胴突き/],
  ['line',    /ライン|釣り糸|フロロ|ナイロン/],
  ['hook',    /フック|針|ハリ/],
  ['cooler',  /クーラーボックス|クーラー/],
  ['tool',    /フィッシュグリップ|タモ|ランディングネット|プライヤー|グリップ/],
  ['storage', /タックルボックス|バッカン/],
  ['light',   /ライト|ヘッドライト/],
  ['wear',    /フィッシングベスト|ウェア|グローブ|手袋/],
]

const STYLE_REQUIRED_CATEGORIES: Record<FishingStyle, GearCategory[]> = {
  ajing:        ['rod', 'reel', 'jighead', 'worm', 'line'],
  mebaring:     ['rod', 'reel', 'jighead', 'worm', 'line'],
  seabass_lure: ['rod', 'reel', 'lure', 'line'],
  sabiki:       ['rod', 'reel', 'rig', 'line'],
  eging:        ['rod', 'reel', 'rig', 'line'],
  fukase:       ['rod', 'reel', 'hook', 'line'],
  tenya:        ['rod', 'reel', 'rig'],
  bass_lure:    ['rod', 'reel', 'lure', 'worm'],
  shore_jig:    ['rod', 'reel', 'lure', 'line'],
  general:      ['rod', 'reel', 'rig', 'line'],
}

const STYLE_KEYWORDS: Record<FishingStyle, string[]> = {
  ajing:        ['アジング', 'アジ'],
  mebaring:     ['メバリング', 'メバル'],
  seabass_lure: ['シーバス', 'スズキ'],
  sabiki:       ['サビキ', 'アジ', 'サバ'],
  eging:        ['エギング', 'イカ', 'アオリ'],
  fukase:       ['フカセ', 'チヌ', 'グレ'],
  tenya:        ['テンヤ', 'タイ', '鯛'],
  bass_lure:    ['バス', 'ブラックバス'],
  shore_jig:    ['ショアジギ', 'ブリ', 'カンパチ'],
  general:      ['釣り', 'フィッシング'],
}

const MAJOR_BRANDS = /シマノ|ダイワ|がまかつ|ヤマシタ|メジャークラフト|アブガルシア|ラパラ/

const CATEGORY_REASON: Record<GearCategory, string> = {
  rod:     'ロッドは釣りの基本。魚種に合った長さと硬さを選びましょう。',
  reel:    'リールはラインの巻き取りに使います。バランスの良いものを選びましょう。',
  lure:    '魚を誘うルアー。カラーやサイズを魚種に合わせます。',
  worm:    'ワームはソフトルアー。アジングやメバリングに必須です。',
  jighead: 'ジグヘッドにワームを付けて使います。重さで沈み方が変わります。',
  line:    'ラインは釣果に直結します。強度と感度を確認しましょう。',
  hook:    '針は魚種に合ったサイズを選びます。',
  rig:     '仕掛けは釣り方に特化したセットです。',
  safety:  'ライフジャケットは堤防・防波堤での着用を推奨します。安全第一です。',
  cooler:  'クーラーボックスで釣った魚を鮮度よく持ち帰れます。',
  storage: 'タックルボックスで小物を整理すると釣りがスムーズになります。',
  light:   '夜釣りにはライトが必須です。ヘッドライトが両手を自由にします。',
  tool:    'フィッシュグリップやタモがあると安全に魚を取り込めます。',
  wear:    'フィッシングベストはポケットが多く便利です。',
  unknown: '釣りに役立つアイテムです。',
}

const STYLE_LABELS: Record<FishingStyle, string> = {
  ajing:        'アジング',
  mebaring:     'メバリング',
  seabass_lure: 'シーバスルアー',
  sabiki:       'サビキ釣り',
  eging:        'エギング',
  fukase:       'フカセ釣り',
  tenya:        'テンヤ',
  bass_lure:    'バスルアー',
  shore_jig:    'ショアジギング',
  general:      '釣り',
}

// mockデータのフォールバックセット（API未接続時）
const MOCK_STARTER_ITEMS: GearPrice[] = [
  { id: 'mock-rod-s', title: 'メバリングロッド 7.6フィート 入門セット', price: 5980, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString(), manufacturer: 'メジャークラフト' },
  { id: 'mock-reel-s', title: '小型スピニングリール 2000番', price: 4980, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString(), manufacturer: 'シマノ' },
  { id: 'mock-jig-s', title: 'ジグヘッド 1g 10個セット アジング用', price: 680, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString() },
  { id: 'mock-worm-s', title: 'アジングワーム 2インチ グロー 10本入り', price: 580, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString() },
  { id: 'mock-life-s', title: 'ライフジャケット 自動膨張式 桜マーク', price: 8800, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString() },
]

const MOCK_UPGRADE_ITEMS: GearPrice[] = [
  { id: 'mock-rod-u', title: 'メバリングロッド 7.9フィート UL ハイエンド', price: 18000, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString(), manufacturer: 'シマノ' },
  { id: 'mock-reel-u', title: '小型スピニングリール ハイギア 2000HG', price: 15800, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString(), manufacturer: 'ダイワ' },
  { id: 'mock-jig-u', title: 'ジグヘッド 各種 アソート 10個 がまかつ', price: 880, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString(), manufacturer: 'がまかつ' },
  { id: 'mock-worm-u', title: 'アジングワーム 2.5インチ グロー 10本', price: 780, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString() },
  { id: 'mock-life-u', title: 'ライフジャケット 固定式 フィッシング用 桜マーク', price: 6500, platform: 'rakuten', url: '#', affiliateUrl: '#', shopName: 'デモショップ', fetchedAt: new Date().toISOString() },
]

export function getPriceTier(price: number): PriceTier {
  if (price <= 3000) return 'budget'
  if (price <= 15000) return 'mid'
  return 'premium'
}

export function detectGearCategory(item: GearPrice): GearCategory {
  const text = `${item.title} ${item.manufacturer ?? ''}`
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category
  }
  return 'unknown'
}

export function scoreGearItem(item: GearPrice, context: GearRecommendationContext): ScoredGearItem {
  const category = detectGearCategory(item)
  const priceTier = getPriceTier(item.price)
  const styleRequired = STYLE_REQUIRED_CATEGORIES[context.style]

  let score = 0

  if (styleRequired.includes(category)) score += 40
  if (priceTier === context.targetPriceTier) score += 20

  const titleText = item.title
  if (context.fishTypes.some(f => titleText.includes(f))) score += 10
  if (STYLE_KEYWORDS[context.style].some(kw => titleText.includes(kw))) score += 10

  const brandText = `${item.title} ${item.manufacturer ?? ''}`
  if (MAJOR_BRANDS.test(brandText)) score += 20

  score = Math.min(100, score)
  const isPrimaryItem = item.price >= 500
  const reason = CATEGORY_REASON[category]

  return { item, category, categoryScore: score, priceTier, reason, isPrimaryItem }
}

export function markSupplementaryItems(items: ScoredGearItem[]): ScoredGearItem[] {
  return items.map(i => ({ ...i, isPrimaryItem: i.item.price >= 500 }))
}

export function diversifyGearCategories(items: ScoredGearItem[], maxItems = 6): ScoredGearItem[] {
  const result: ScoredGearItem[] = []
  const usedCategories = new Set<GearCategory>()

  // 必須カテゴリを優先して確保
  const priorityCategories: GearCategory[] = ['rod', 'reel', 'jighead', 'lure', 'worm', 'rig', 'safety']

  for (const cat of priorityCategories) {
    if (result.length >= maxItems) break
    if (usedCategories.has(cat)) continue
    const candidate = items
      .filter(i => i.category === cat)
      .sort((a, b) => b.categoryScore - a.categoryScore)[0]
    if (candidate) {
      result.push(candidate)
      usedCategories.add(cat)
    }
  }

  // 残りスロットを高スコア順で埋める（同カテゴリ2件まで許容）
  const remaining = items
    .filter(i => !result.includes(i))
    .sort((a, b) => b.categoryScore - a.categoryScore)

  for (const item of remaining) {
    if (result.length >= maxItems) break
    const catCount = result.filter(r => r.category === item.category).length
    if (catCount < 2) result.push(item)
  }

  return result
}

function buildTitle(context: GearRecommendationContext, levelLabel: string): string {
  const fish = context.fishTypes[0] ?? ''
  const fishPart = fish ? `${fish}を狙う` : ''
  return `${context.spotName}で${fishPart}${STYLE_LABELS[context.style]}セット（${levelLabel}）`
}

export function buildStarterSet(allGear: GearPrice[], context: GearRecommendationContext): GearSet {
  const ctx: GearRecommendationContext = { ...context, level: 'beginner', targetPriceTier: 'budget' }
  const gearToUse = allGear.length > 0 ? allGear : MOCK_STARTER_ITEMS
  const dataSource: 'mock' | 'api' = allGear.length > 0 ? 'api' : 'mock'

  const scored = gearToUse.map(g => scoreGearItem(g, ctx))
  const marked = markSupplementaryItems(scored)
  const diversified = diversifyGearCategories(marked)
  const totalEstimatedCost = diversified
    .filter(i => i.isPrimaryItem)
    .reduce((sum, i) => sum + i.item.price, 0)

  return {
    title: buildTitle(ctx, '初心者向け'),
    context: ctx,
    items: diversified,
    totalEstimatedCost,
    dataSource,
    generatedAt: new Date().toISOString(),
  }
}

export function buildUpgradeSet(allGear: GearPrice[], context: GearRecommendationContext): GearSet {
  const ctx: GearRecommendationContext = { ...context, targetPriceTier: 'mid' }
  const gearToUse = allGear.length > 0 ? allGear : MOCK_UPGRADE_ITEMS
  const dataSource: 'mock' | 'api' = allGear.length > 0 ? 'api' : 'mock'

  const scored = gearToUse.map(g => scoreGearItem(g, ctx))
  const marked = markSupplementaryItems(scored)
  const sortedByScore = [...marked].sort((a, b) => b.categoryScore - a.categoryScore)
  const diversified = diversifyGearCategories(sortedByScore)
  const totalEstimatedCost = diversified
    .filter(i => i.isPrimaryItem)
    .reduce((sum, i) => sum + i.item.price, 0)

  const levelLabel = context.level === 'advanced' ? '上級者向け' : '中級者向け'

  return {
    title: buildTitle(ctx, levelLabel),
    context: ctx,
    items: diversified,
    totalEstimatedCost,
    dataSource,
    generatedAt: new Date().toISOString(),
  }
}

export function recommendGearSet(allGear: GearPrice[], context: GearRecommendationContext): GearSet {
  if (context.level === 'beginner') return buildStarterSet(allGear, context)
  return buildUpgradeSet(allGear, context)
}

export function sortGearWithPrimaryFirst(items: GearPrice[]): GearPrice[] {
  const primary = items.filter(i => i.price >= 500).sort((a, b) => a.price - b.price)
  const supplementary = items.filter(i => i.price < 500).sort((a, b) => a.price - b.price)
  return [...primary, ...supplementary]
}
