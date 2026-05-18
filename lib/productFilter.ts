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

// === BLACKLIST ===
// これらのワードを含む商品は絶対に表示しない
const BLACKLIST_WORDS = [
  'MTG',
  'マジック：ザ・ギャザリング',
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
 * 釣り用品として適切な商品かどうかを判定する
 * @param product - 判定対象の商品
 * @returns true なら表示可、false なら非表示
 */
export function isFishingProduct(product: FilterableProduct): boolean {
  const text = [product.title, product.manufacturer, product.shopName]
    .filter(Boolean)
    .join(' ')

  // 1. ブラックリストに該当 → 絶対に除外
  if (BLACKLIST_RE.test(text)) return false

  // 2. ホワイトリストに該当するものだけ表示
  return WHITELIST_RE.test(text)
}
