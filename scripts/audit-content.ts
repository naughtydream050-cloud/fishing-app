/**
 * audit-content.ts
 * コンテンツ品質チェックスクリプト
 *
 * 実行: npm run audit:content
 *
 * チェック項目:
 * 1. TCG汚染チェック — ブラックリストワードが含まれていないか
 * 2. ダミーリンクチェック — example ドメイン URL が本番表示されていないか
 * 3. 安すぎるセットチェック — 全商品が ¥500 未満のグループを検出
 * 4. 必須カテゴリチェック — ロッド/リール/安全装備が揃っているか
 * 5. カテゴリ多様性チェック — ユニークカテゴリ数が 3 以上か
 */

// tsx は tsconfig paths を解決しないため相対パスで import
import { isFishingProduct, classifyGearCategory, type GearCategory } from '../lib/productFilter'

// ---- 型定義（dataAccess の GearPrice と互換） ----
interface GearItem {
  id: string
  title: string
  price: number
  url: string
  affiliateUrl: string
  shopName: string
  manufacturer?: string
}

// ---- モックデータを動的 import（tsx 環境用） ----
// 全リージョンを結合・重複排除して網羅的にチェックする
async function loadMockData(): Promise<GearItem[]> {
  const { getMockGearByRegion } = await import('../lib/mockData')
  const regions = ['nationwide', 'chugoku', 'tokyo_23'] as const
  const all = regions.flatMap(r => getMockGearByRegion(r))
  // id で重複排除
  const seen = new Set<string>()
  return all.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  }) as GearItem[]
}

// ---- ブラックリストワード（productFilter と同期） ----
const BLACKLIST_WORDS = [
  'MTG', 'マジック：ザ・ギャザリング', 'マジックザギャザリング',
  'ファウンデーションズ', 'ロルカナ', 'ユニオンアリーナ',
  'ディズニー・ロルカナ', 'ディズニーロルカナ', 'HUNTER×HUNTER',
  'アンコモン', 'アート・カード', 'Magic: The Gathering', 'Magic The Gathering',
  'トレカ', 'トレーディングカード', 'カードゲーム', 'ポケモンカード',
  '遊戯王', 'デュエマ', 'ワンピースカード', 'Foil', 'FDN', 'Foundations',
  'シングルカード', 'TCG', '日本語版', '英語版',
  'booster', 'deck', 'プロモ', 'レアリティ', 'コモン',
  'ゲーム', 'コントローラー', 'フィギュア', 'アニメ', 'マンガ',
]

const BLACKLIST_RE = new RegExp(
  BLACKLIST_WORDS.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
)

const MOCK_DOMAINS = ['example.rakuten.co.jp', 'example.com']

// ---- チェック関数 ----

function checkTcgContamination(items: GearItem[]): string[] {
  const issues: string[] = []
  for (const item of items) {
    const text = [item.title, item.manufacturer, item.shopName].filter(Boolean).join(' ')
    if (BLACKLIST_RE.test(text)) {
      issues.push(`[TCG汚染] id=${item.id} title="${item.title}"`)
    }
  }
  return issues
}

function checkDummyLinks(items: GearItem[]): string[] {
  const issues: string[] = []
  for (const item of items) {
    const hasMockUrl = MOCK_DOMAINS.some(
      d => item.url.includes(d) || item.affiliateUrl.includes(d)
    )
    if (hasMockUrl) {
      issues.push(`[ダミーリンク] id=${item.id} title="${item.title}" url="${item.url}"`)
    }
  }
  return issues
}

function checkCheapItems(items: GearItem[], threshold = 500): string[] {
  const issues: string[] = []
  const allCheap = items.length > 0 && items.every(i => i.price < threshold)
  if (allCheap) {
    const titles = items.map(i => `"${i.title}"(¥${i.price})`).join(', ')
    issues.push(`[安すぎる] 全商品が¥${threshold}未満: ${titles}`)
  }
  return issues
}

function checkRequiredCategories(items: GearItem[]): {
  errors: string[]
  warnings: string[]
} {
  const categories = new Set(
    items.map(i => classifyGearCategory(i.title)).filter(Boolean) as GearCategory[]
  )
  const errors: string[] = []
  const warnings: string[] = []

  // ロッド・リールは必須（エラー）
  if (!categories.has('rod')) errors.push('[必須カテゴリ不足] ロッド(rod) が見つかりません')
  if (!categories.has('reel')) errors.push('[必須カテゴリ不足] リール(reel) が見つかりません')
  // 安全装備は推奨（警告）— GearSet 機能が実装されるまでは warning 扱い
  if (!categories.has('safety')) {
    warnings.push('[安全装備推奨] ライフジャケット等の安全装備が含まれていません（GearSet 実装時に必須化予定）')
  }

  return { errors, warnings }
}

function checkCategoryDiversity(items: GearItem[], minCategories = 3): string[] {
  const issues: string[] = []
  const categories = new Set(
    items.map(i => classifyGearCategory(i.title)).filter(Boolean)
  )
  if (categories.size < minCategories) {
    issues.push(
      `[多様性不足] ユニークカテゴリ数=${categories.size}（最低${minCategories}必要）` +
      ` 現在: ${[...categories].join(', ') || 'なし'}`
    )
  }
  return issues
}

// ---- メイン ----

async function main() {
  console.log('=== fishing-app コンテンツ品質監査 ===\n')

  let items: GearItem[]
  try {
    items = await loadMockData()
    console.log(`✓ モックデータ読み込み: ${items.length}件\n`)
  } catch (err) {
    console.error('✗ モックデータ読み込み失敗:', err)
    process.exit(1)
  }

  // 非釣具商品もチェック対象に含める（フィルタ前）
  const allIssues: string[] = []

  // Check 1: TCG汚染
  const tcgIssues = checkTcgContamination(items)
  if (tcgIssues.length > 0) {
    console.log(`❌ Check 1 TCG汚染: ${tcgIssues.length}件の問題`)
    tcgIssues.forEach(i => console.log('  ' + i))
    allIssues.push(...tcgIssues)
  } else {
    console.log('✅ Check 1 TCG汚染: 問題なし')
  }

  // Check 2: ダミーリンク
  const dummyIssues = checkDummyLinks(items)
  if (dummyIssues.length > 0) {
    console.log(`⚠️  Check 2 ダミーリンク: ${dummyIssues.length}件（[デモ商品]マーク確認を推奨）`)
    dummyIssues.forEach(i => console.log('  ' + i))
    // ダミーリンクは警告のみ（モック環境では正常）
  } else {
    console.log('✅ Check 2 ダミーリンク: 問題なし')
  }

  // Check 3: 安すぎるセット
  const cheapIssues = checkCheapItems(items)
  if (cheapIssues.length > 0) {
    console.log(`❌ Check 3 安すぎるセット: ${cheapIssues.length}件の問題`)
    cheapIssues.forEach(i => console.log('  ' + i))
    allIssues.push(...cheapIssues)
  } else {
    console.log('✅ Check 3 安すぎるセット: 問題なし')
  }

  // Check 4: 必須カテゴリ
  const { errors: catErrors, warnings: catWarnings } = checkRequiredCategories(items)
  if (catErrors.length > 0) {
    console.log(`❌ Check 4 必須カテゴリ: ${catErrors.length}件の問題`)
    catErrors.forEach(i => console.log('  ' + i))
    allIssues.push(...catErrors)
  } else {
    console.log('✅ Check 4 必須カテゴリ(ロッド/リール): 問題なし')
  }
  if (catWarnings.length > 0) {
    catWarnings.forEach(w => console.log('  ⚠️  ' + w))
  }

  // Check 5: カテゴリ多様性
  const divIssues = checkCategoryDiversity(items)
  if (divIssues.length > 0) {
    console.log(`❌ Check 5 カテゴリ多様性: ${divIssues.length}件の問題`)
    divIssues.forEach(i => console.log('  ' + i))
    allIssues.push(...divIssues)
  } else {
    console.log('✅ Check 5 カテゴリ多様性: 問題なし')
  }

  console.log('\n=== 監査結果 ===')
  if (allIssues.length === 0) {
    console.log('✅ 全チェック通過')
    process.exit(0)
  } else {
    console.log(`❌ ${allIssues.length}件の重大な問題が見つかりました`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('予期せぬエラー:', err)
  process.exit(1)
})
