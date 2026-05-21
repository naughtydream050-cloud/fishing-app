#!/usr/bin/env tsx
/**
 * audit-content.ts
 * コンテンツ品質監査スクリプト（統合版）
 *
 * 実行: npm run audit:content
 *
 * Section A: 記事・釣り場コンテンツ品質チェック（既存）
 * Section B: 釣具商品品質チェック（TCG汚染・ダミーリンク等）
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// ---- Section A: 記事・釣り場監査（既存実装） ----
// @/ エイリアスは Next.js ランタイム専用なので相対パスで import
let sectionAAvailable = false
try {
  // これらのモジュールが存在する場合のみ実行
  const { MOCK_ARTICLES } = await import('../lib/mockArticles').catch(() => ({ MOCK_ARTICLES: null }))
  const { MOCK_SPOTS } = await import('../lib/mockSpots').catch(() => ({ MOCK_SPOTS: null }))
  const { auditAllContent } = await import('../lib/contentQualityRules').catch(() => ({ auditAllContent: null }))
  const { queueJobsFromAudit } = await import('../lib/contentAutomation').catch(() => ({ queueJobsFromAudit: null }))

  if (MOCK_ARTICLES && MOCK_SPOTS && auditAllContent && queueJobsFromAudit) {
    sectionAAvailable = true
    console.log('\n=== Section A: 記事・釣り場コンテンツ品質監査 ===\n')

    const allSpots = Object.values(MOCK_SPOTS as Record<string, unknown[]>).flat()
    const auditResult = (auditAllContent as Function)({ articles: MOCK_ARTICLES, spots: allSpots })
    const jobs = (queueJobsFromAudit as Function)(auditResult.results)

    console.log(`[audit-content] ${auditResult.summary}`)
    console.log(`[audit-content] 生成ジョブ数: ${jobs.length}件`)

    // JSON レポート出力
    const ROOT = process.cwd()
    const jsonReport = {
      generatedAt: new Date().toISOString(),
      summary: auditResult.summary,
      totalChecked: auditResult.totalChecked,
      passed: auditResult.passed,
      failed: auditResult.failed,
      jobsQueued: jobs.length,
      results: auditResult.results,
      jobs,
    }
    const jsonPath = path.resolve(ROOT, 'content-audit-report.json')
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf-8')
    console.log(`[audit-content] JSON レポート: ${jsonPath}`)

    const priorityA = (jobs as any[]).filter((j: any) => j.priority === 1)
    if (priorityA.length > 0) {
      console.log(`\n[audit-content] 🔴 優先度A（最優先）: ${priorityA.length}件`)
      for (const job of priorityA) {
        console.log(`  - ${job.contentId} (${job.contentType}): ${job.type} / スコア ${job.qualityScore}`)
      }
    }
  }
} catch {
  // Section A のモジュールが存在しない場合はスキップ
}

if (!sectionAAvailable) {
  console.log('\n[Section A] 記事・釣り場監査モジュール未検出 — スキップ')
}

// ---- Section B: 釣具商品品質チェック ----

import { isFishingProduct, classifyGearCategory, type GearCategory } from '../lib/productFilter'

// 型定義（dataAccess の GearPrice と互換）
interface GearItem {
  id: string
  title: string
  price: number
  url: string
  affiliateUrl: string
  shopName: string
  manufacturer?: string
}

// 全リージョンを結合・重複排除して網羅的にチェックする
async function loadMockGearData(): Promise<GearItem[]> {
  const { getMockGearByRegion } = await import('../lib/mockData')
  const regions = ['nationwide', 'chugoku', 'tokyo_23'] as const
  const all = regions.flatMap(r => getMockGearByRegion(r))
  const seen = new Set<string>()
  return all.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  }) as GearItem[]
}

// ブラックリストワード（productFilter と同期）
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

async function runSectionB(): Promise<boolean> {
  console.log('\n=== Section B: 釣具商品品質監査 ===\n')

  let items: GearItem[]
  try {
    items = await loadMockGearData()
    console.log(`✓ モックデータ読み込み: ${items.length}件\n`)
  } catch (err) {
    console.error('✗ モックデータ読み込み失敗:', err)
    return false
  }

  const allIssues: string[] = []

  const tcgIssues = checkTcgContamination(items)
  if (tcgIssues.length > 0) {
    console.log(`❌ Check 1 TCG汚染: ${tcgIssues.length}件の問題`)
    tcgIssues.forEach(i => console.log('  ' + i))
    allIssues.push(...tcgIssues)
  } else {
    console.log('✅ Check 1 TCG汚染: 問題なし')
  }

  const dummyIssues = checkDummyLinks(items)
  if (dummyIssues.length > 0) {
    console.log(`⚠️  Check 2 ダミーリンク: ${dummyIssues.length}件（[デモ商品]マーク確認を推奨）`)
    dummyIssues.forEach(i => console.log('  ' + i))
  } else {
    console.log('✅ Check 2 ダミーリンク: 問題なし')
  }

  const cheapIssues = checkCheapItems(items)
  if (cheapIssues.length > 0) {
    console.log(`❌ Check 3 安すぎるセット: ${cheapIssues.length}件の問題`)
    cheapIssues.forEach(i => console.log('  ' + i))
    allIssues.push(...cheapIssues)
  } else {
    console.log('✅ Check 3 安すぎるセット: 問題なし')
  }

  const { errors: catErrors, warnings: catWarnings } = checkRequiredCategories(items)
  if (catErrors.length > 0) {
    console.log(`❌ Check 4 必須カテゴリ: ${catErrors.length}件の問題`)
    catErrors.forEach(i => console.log('  ' + i))
    allIssues.push(...catErrors)
  } else {
    console.log('✅ Check 4 必須カテゴリ(ロッド/リール): 問題なし')
  }
  catWarnings.forEach(w => console.log('  ⚠️  ' + w))

  const divIssues = checkCategoryDiversity(items)
  if (divIssues.length > 0) {
    console.log(`❌ Check 5 カテゴリ多様性: ${divIssues.length}件の問題`)
    divIssues.forEach(i => console.log('  ' + i))
    allIssues.push(...divIssues)
  } else {
    console.log('✅ Check 5 カテゴリ多様性: 問題なし')
  }

  console.log('\n=== Section B 結果 ===')
  if (allIssues.length === 0) {
    console.log('✅ 全チェック通過')
    return true
  } else {
    console.log(`❌ ${allIssues.length}件の重大な問題が見つかりました`)
    return false
  }
}

const sectionBOk = await runSectionB()

if (!sectionBOk) {
  process.exit(1)
}
