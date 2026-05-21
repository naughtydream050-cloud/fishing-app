/**
 * productFilter.ts
 * 釣り関連商品のみを表示するためのフィルタ関数
 * - BLACKLIST に一致したら必ず除外
 * - WHITELIST に一致しないものも除外
 */

export type FilterableProduct = {
  title: string
  shopName?: string
  manufacturer?: string
}

export type GearCategory =
  | 'rod'
  | 'reel'
  | 'lure'
  | 'line'
  | 'terminal'
  | 'safety'
  | 'storage'
  | 'other'

// === BLACKLIST ===
// これらのワードを含む商品は絶対に表示しない
const BLACKLIST_WORDS = [
  'MTG',
  'マジック：ザ・ギャザリング',
  'マジックザギャザリング',
  'ファウンデーションズ',
  'ロルカナ',
  'ユニオンアリーナ',
  'ディズニー・ロルカナ',
  'ディズニーロルカナ',
  'HUNTER×HUNTER',
  'アンコモン',
  'アート・カード',
  'Magic: The Gathering',
  'Magic The Gathering',
  'トレカ',
  'トレーディングカード',
  'カードゲーム',
  'ポケモンカード',
  '遊戯王',
  'デュエマ',
  'ワンピースカード',
  'Foil',
  'FDN',
  'Foundations',
  'シングルカード',
  'TCG',
  '日本語版',
  '英語版',
  // 追加ブラックリスト
  'booster',
  'deck',
  'プロモ',
  'レアリティ',
  'コモン',
  'ゲーム',
  'コントローラー',
  'フィギュア',
  'アニメ',
  'マンガ',
]

// === WHITELIST ===
// これらのワードを少なくとも1つ含む商品のみ表示
const WHITELIST_WORDS = [
  '釣竿',
  '釣り竿',
  'ロッド',
  'リール',
  'ルアー',
  'ワーム',
  'ジグ',
  'エギ',
  '釣り糸',
  'ライン',
  'フック',
  '仕掛け',
  'タックル',
  'クーラーボックス',
  'フィッシュグリップ',
  'ランディングネット',
  'タモ',
  'ライフジャケット',
  'フィッシングベスト',
  '釣具',
  '釣り具',
  'フィッシング',
  '釣り',
  '磯竿',
  'アジング',
  'バスロッド',
  'シーバス',
  'タチウオ',
  'サビキ',
  'テンヤ',
  'エギング',
  'ショアジギ',
  'サーフ',
  '投げ竿',
  '船竿',
  'ウキ',
  'オモリ',
  // 追加ホワイトリスト（英語）
  'rod',
  'reel',
  'lure',
  'worm',
  'jighead',
  'line',
  'hook',
  'rig',
  'bait',
  'float',
  'sinker',
  'bobber',
  'net',
  'gaff',
  'creel',
  'vest',
  'wader',
  'polarized',
  // 追加ホワイトリスト（日本語）
  'バス釣り',
  'トラウト',
  'メバリング',
  'プライヤー',
  'えさ',
  'エサ',
  '餌',
]

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const BLACKLIST_RE = new RegExp(
  BLACKLIST_WORDS.map(escapeRegex).join('|'),
  'i'
)

const WHITELIST_RE = new RegExp(
  WHITELIST_WORDS.map(escapeRegex).join('|'),
  'i'
)

/**
 * 全角英数字・記号を半角に変換し lowercase にする
 */
export function normalizeProductText(text: string): string {
  return text
    .replace(/[Ａ-Ｚａ-ｚ０-９！-～]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .toLowerCase()
}

/**
 * 釣り用品として適切な商品かどうかを判定する（FilterableProduct 版）
 * @param product - 判定対象の商品
 * @returns true なら表示可、false なら非表示
 */
export function isFishingProduct(product: FilterableProduct): boolean {
  const raw = [product.title, product.manufacturer, product.shopName]
    .filter(Boolean)
    .join(' ')
  const text = normalizeProductText(raw)

  // 1. ブラックリストに該当 → 絶対に除外
  if (BLACKLIST_RE.test(text)) return false

  // 2. ホワイトリストに該当するものだけ表示
  return WHITELIST_RE.test(text)
}

/**
 * 釣り用品として適切な商品かどうかを判定する（name/description 版）
 * Phase 1 仕様: isRealFishingGearProduct
 */
export function isRealFishingGearProduct(product: {
  name: string
  description?: string
}): boolean {
  return isFishingProduct({
    title: [product.name, product.description].filter(Boolean).join(' '),
  })
}

/**
 * 配列から非釣具商品を除外する
 * GearPrice の title フィールド、または name フィールドを優先して使用
 */
export function excludeNonFishingProducts<
  T extends {
    title?: string
    name?: string
    manufacturer?: string
    shopName?: string
  }
>(products: T[]): T[] {
  return products.filter((p) =>
    isFishingProduct({
      title: p.title ?? p.name ?? '',
      manufacturer: p.manufacturer,
      shopName: p.shopName,
    })
  )
}

// カテゴリ判定用キーワードマップ
const CATEGORY_RULES: Array<{ category: GearCategory; words: string[] }> = [
  {
    category: 'rod',
    words: [
      'ロッド',
      '釣竿',
      '釣り竿',
      '磯竿',
      'バスロッド',
      '投げ竿',
      '船竿',
      'rod',
      'spinning',
      'baitcasting',
      // 釣法名（製品名でロッドを示す）
      'アジング',
      'メバリング',
      'エギングロッド',
      'ショアジギングロッド',
    ],
  },
  {
    category: 'reel',
    words: [
      'リール',
      'reel',
      'スピニングリール',
      'ベイトリール',
      // ダイワ代表モデル
      'レブロス',
      'カルディア',
      'フリームス',
      'セルテート',
      'イグジスト',
      'セオリー',
      'ジョイナス',
      // シマノ代表モデル
      'ストラディック',
      'ヴァンキッシュ',
      'ツインパワー',
      'ナスキー',
      'シエナ',
      'アルテグラ',
      'セフィア',
    ],
  },
  {
    category: 'lure',
    words: [
      'ルアー',
      'ワーム',
      'ジグ',
      'エギ',
      '仕掛け',
      'サビキ',
      'テンヤ',
      'lure',
      'worm',
      'jig',
      'rig',
      'bait',
      'えさ',
      'エサ',
      '餌',
    ],
  },
  {
    category: 'line',
    words: ['ライン', '釣り糸', 'line', 'pe', 'フロロ', 'ナイロン'],
  },
  {
    category: 'terminal',
    words: [
      'フック',
      '針',
      'オモリ',
      'シンカー',
      'ウキ',
      'スイベル',
      'フロート',
      'hook',
      'sinker',
      'float',
      'bobber',
    ],
  },
  {
    category: 'safety',
    words: ['ライフジャケット', 'フィッシングベスト', 'vest', 'wader'],
  },
  {
    category: 'storage',
    words: [
      'クーラーボックス',
      'タモ',
      'ランディングネット',
      'フィッシュグリップ',
      'プライヤー',
      'net',
      'gaff',
      'creel',
    ],
  },
]

/**
 * 商品名からギアカテゴリを分類する
 * @returns カテゴリ、判定不能なら null
 */
export function classifyGearCategory(productName: string): GearCategory | null {
  const normalized = normalizeProductText(productName)
  for (const { category, words } of CATEGORY_RULES) {
    if (words.some((w) => normalized.includes(normalizeProductText(w)))) {
      return category
    }
  }
  // ホワイトリストには通ったが特定カテゴリ不明
  if (WHITELIST_RE.test(normalized)) return 'other'
  return null
}
