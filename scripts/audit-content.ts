#!/usr/bin/env tsx
/**
 * audit-content.ts — 統合コンテンツ品質監査スクリプト
 *
 * Section A: 記事・釣り場・釣果レポートの品質チェック
 * Section B: 釣具商品品質チェック（TCG汚染・ダミーリンク・カテゴリ）
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

// Section A imports
import { MOCK_ARTICLES } from '../lib/mockArticles'
import { MOCK_SPOTS } from '../lib/mockSpots'
import { auditAllContent, type QualityResult } from '../lib/contentQualityRules'
import { queueJobsFromAudit, type ContentJob } from '../lib/contentAutomation'
import { getAllReports, type FishingReport } from '../lib/fishingReports'

// Section B imports
import { classifyGearCategory, type GearCategory } from '../lib/productFilter'

const ROOT = process.cwd()

// ─── Section A: 記事・釣り場 ──────────────────────────────────────

function severityEmoji(severity: string): string {
  if (severity === 'error') return '🔴'
  if (severity === 'warning') return '🟡'
  return '🔵'
}

function priorityLabel(priority: number): string {
  if (priority === 1) return 'A（最優先）'
  if (priority === 2) return 'B（優先）'
  return 'C（通常）'
}

function buildMarkdownReport(
  auditResult: ReturnType<typeof auditAllContent>,
  jobs: ContentJob[]
): string {
  const lines: string[] = []
  const now = new Date().toISOString()

  lines.push(`# コンテンツ品質監査レポート`)
  lines.push(``)
  lines.push(`生成日時: ${now}`)
  lines.push(``)
  lines.push(`## サマリー`)
  lines.push(``)
  lines.push(`- **総チェック数**: ${auditResult.totalChecked}件`)
  lines.push(`- **合格**: ${auditResult.passed}件`)
  lines.push(`- **不合格**: ${auditResult.failed}件`)
  lines.push(`- **生成ジョブ数**: ${jobs.length}件`)
  lines.push(``)

  const priorityA = jobs.filter(j => j.priority === 1)
  const priorityB = jobs.filter(j => j.priority === 2)
  const priorityC = jobs.filter(j => j.priority >= 3)

  lines.push(`## 優先度別ジョブ`)
  lines.push(``)
  lines.push(`| 優先度 | 件数 | 内容 |`)
  lines.push(`|--------|------|------|`)
  lines.push(`| A（最優先） | ${priorityA.length} | スコア40未満 |`)
  lines.push(`| B（優先） | ${priorityB.length} | スコア40-69 |`)
  lines.push(`| C（通常） | ${priorityC.length} | スコア70以上だが不合格 |`)
  lines.push(``)

  if (priorityA.length > 0) {
    lines.push(`## 優先度A: 次に生成すべきコンテンツ`)
    lines.push(``)
    for (const job of priorityA) {
      lines.push(`- **${job.contentId}** (${job.contentType}) → \`${job.type}\` / スコア: ${job.qualityScore}`)
    }
    lines.push(``)
  }

  lines.push(`## 記事チェック詳細`)
  lines.push(``)
  const articleResults = auditResult.results.filter(r => r.contentType === 'article')
  for (const r of articleResults) {
    const statusEmoji = r.passed ? '✅' : '❌'
    lines.push(`### ${statusEmoji} ${r.id} (スコア: ${r.score}/100)`)
    if (r.issues.length > 0) {
      lines.push(``)
      lines.push(`**課題:**`)
      for (const issue of r.issues) {
        lines.push(`- ${severityEmoji(issue.severity)} \`${issue.field}\`: ${issue.message}`)
      }
    }
    if (r.recommendations.length > 0) {
      lines.push(``)
      lines.push(`**推奨アクション:**`)
      for (const rec of r.recommendations) {
        lines.push(`- ${rec}`)
      }
    }
    lines.push(``)
  }

  lines.push(`## 釣り場チェック詳細`)
  lines.push(``)
  const spotResults = auditResult.results.filter(r => r.contentType === 'spot')
  for (const r of spotResults) {
    const statusEmoji = r.passed ? '✅' : '❌'
    lines.push(`### ${statusEmoji} ${r.id} (スコア: ${r.score}/100)`)
    if (r.issues.length > 0) {
      lines.push(``)
      lines.push(`**課題:**`)
      for (const issue of r.issues) {
        lines.push(`- ${severityEmoji(issue.severity)} \`${issue.field}\`: ${issue.message}`)
      }
    }
    if (r.recommendations.length > 0) {
      lines.push(``)
      lines.push(`**推奨アクション:**`)
      for (const rec of r.recommendations) {
        lines.push(`- ${rec}`)
      }
    }
    lines.push(``)
  }

  lines.push(`## 全ジョブキュー`)
  lines.push(``)
  lines.push(`| ID | 種別 | タイプ | 優先度 | スコア |`)
  lines.push(`|----|------|--------|--------|--------|`)
  for (const job of jobs) {
    lines.push(`| ${job.contentId} | ${job.contentType} | ${job.type} | ${priorityLabel(job.priority)} | ${job.qualityScore} |`)
  }
  lines.push(``)

  return lines.join('\n')
}

// ─── Section A: 釣果レポート ──────────────────────────────────────

function auditReports(reports: FishingReport[]) {
  console.log(`\n[audit-content] 📋 釣果レポート品質チェック (${reports.length}件)`)

  let reportErrors = 0
  let reportWarnings = 0

  for (const report of reports) {
    const issues: string[] = []
    const warns: string[] = []

    if (!report.reviewed) issues.push('reviewed=false なのに公開されています')

    const totalBodyChars = report.bodySections.reduce((sum, s) => sum + s.body.length + s.heading.length, 0)
    if (totalBodyChars < 800) issues.push(`本文 ${totalBodyChars}文字 < 800文字`)

    if (report.relatedSpotSlugs.length === 0) warns.push('relatedSpotSlugs が空')
    if (report.relatedGearKeywords.length === 0) issues.push('relatedGearKeywords が空')
    if (!report.ctaType) issues.push('ctaType が未設定')

    if (!['manual', 'mock', 'api', 'generated'].includes(report.dataSource)) {
      issues.push(`dataSource が不正: "${report.dataSource}"`)
    }

    if (report.isGenerated && !report.reviewed) {
      issues.push('isGenerated=true && reviewed=false（公開禁止）')
    }

    if (issues.length > 0 || warns.length > 0) {
      const status = issues.length > 0 ? '❌' : '⚠️ '
      console.log(`  ${status} ${report.slug}`)
      for (const e of issues) { console.log(`       🔴 ${e}`); reportErrors++ }
      for (const w of warns) { console.log(`       🟡 ${w}`); reportWarnings++ }
    } else {
      console.log(`  ✅ ${report.slug} (本文 ${totalBodyChars}文字)`)
    }
  }

  if (reportErrors > 0) {
    console.log(`[audit-content] レポートエラー: ${reportErrors}件`)
  } else {
    console.log(`[audit-content] レポートチェック完了 (エラー: 0, 警告: ${reportWarnings})`)
  }

  return { reportErrors, reportWarnings }
}

// ─── Section B: 釣具商品品質チェック ─────────────────────────────

interface GearItem {
  id: string
  title: string
  price: number
  url: string
  affiliateUrl: string
  shopName: string
  manufacturer?: string
}

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
  return items
    .filter(item => BLACKLIST_RE.test([item.title, item.manufacturer, item.shopName].filter(Boolean).join(' ')))
    .map(item => `[TCG汚染] id=${item.id} title="${item.title}"`)
}

function checkDummyLinks(items: GearItem[]): string[] {
  return items
    .filter(item => MOCK_DOMAINS.some(d => item.url.includes(d) || item.affiliateUrl.includes(d)))
    .map(item => `[ダミーリンク] id=${item.id} title="${item.title}" url="${item.url}"`)
}

function checkCheapItems(items: GearItem[], threshold = 500): string[] {
  if (items.length > 0 && items.every(i => i.price < threshold)) {
    return [`[安すぎる] 全商品が¥${threshold}未満: ${items.map(i => `"${i.title}"(¥${i.price})`).join(', ')}`]
  }
  return []
}

function checkRequiredCategories(items: GearItem[]): { errors: string[]; warnings: string[] } {
  const categories = new Set(items.map(i => classifyGearCategory(i.title)).filter(Boolean) as GearCategory[])
  const errors: string[] = []
  const warnings: string[] = []
  if (!categories.has('rod')) errors.push('[必須カテゴリ不足] ロッド(rod) が見つかりません')
  if (!categories.has('reel')) errors.push('[必須カテゴリ不足] リール(reel) が見つかりません')
  if (!categories.has('safety')) {
    warnings.push('[安全装備推奨] ライフジャケット等の安全装備が含まれていません（GearSet 実装時に必須化予定）')
  }
  return { errors, warnings }
}

function checkCategoryDiversity(items: GearItem[], minCategories = 3): string[] {
  const categories = new Set(items.map(i => classifyGearCategory(i.title)).filter(Boolean))
  if (categories.size < minCategories) {
    return [`[多様性不足] ユニークカテゴリ数=${categories.size}（最低${minCategories}必要） 現在: ${[...categories].join(', ') || 'なし'}`]
  }
  return []
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

  const tcg = checkTcgContamination(items)
  tcg.length > 0
    ? (console.log(`❌ Check 1 TCG汚染: ${tcg.length}件の問題`), tcg.forEach(i => console.log('  ' + i)), allIssues.push(...tcg))
    : console.log('✅ Check 1 TCG汚染: 問題なし')

  const dummy = checkDummyLinks(items)
  dummy.length > 0
    ? (console.log(`⚠️  Check 2 ダミーリンク: ${dummy.length}件（[デモ商品]マーク確認を推奨）`), dummy.forEach(i => console.log('  ' + i)))
    : console.log('✅ Check 2 ダミーリンク: 問題なし')

  const cheap = checkCheapItems(items)
  cheap.length > 0
    ? (console.log(`❌ Check 3 安すぎるセット: ${cheap.length}件の問題`), cheap.forEach(i => console.log('  ' + i)), allIssues.push(...cheap))
    : console.log('✅ Check 3 安すぎるセット: 問題なし')

  const { errors: catErr, warnings: catWarn } = checkRequiredCategories(items)
  catErr.length > 0
    ? (console.log(`❌ Check 4 必須カテゴリ: ${catErr.length}件の問題`), catErr.forEach(i => console.log('  ' + i)), allIssues.push(...catErr))
    : console.log('✅ Check 4 必須カテゴリ(ロッド/リール): 問題なし')
  catWarn.forEach(w => console.log('  ⚠️  ' + w))

  const div = checkCategoryDiversity(items)
  div.length > 0
    ? (console.log(`❌ Check 5 カテゴリ多様性: ${div.length}件の問題`), div.forEach(i => console.log('  ' + i)), allIssues.push(...div))
    : console.log('✅ Check 5 カテゴリ多様性: 問題なし')

  console.log('\n=== Section B 結果 ===')
  if (allIssues.length === 0) {
    console.log('✅ 全チェック通過')
    return true
  }
  console.log(`❌ ${allIssues.length}件の重大な問題が見つかりました`)
  return false
}

// ─── エントリポイント ─────────────────────────────────────────────

async function main() {
  console.log('[audit-content] コンテンツ品質監査を開始します...')

  // Section A: 記事・釣り場
  const allSpots = Object.values(MOCK_SPOTS).flat()
  const auditResult = auditAllContent({ articles: MOCK_ARTICLES, spots: allSpots })
  const jobs = queueJobsFromAudit(auditResult.results)

  console.log(`[audit-content] ${auditResult.summary}`)
  console.log(`[audit-content] 生成ジョブ数: ${jobs.length}件`)

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

  const mdReport = buildMarkdownReport(auditResult, jobs)
  const mdPath = path.resolve(ROOT, 'content-audit-report.md')
  fs.writeFileSync(mdPath, mdReport, 'utf-8')
  console.log(`[audit-content] Markdown レポート: ${mdPath}`)

  const priorityA = jobs.filter(j => j.priority === 1)
  if (priorityA.length > 0) {
    console.log(`\n[audit-content] 🔴 優先度A（最優先）: ${priorityA.length}件`)
    for (const job of priorityA) {
      console.log(`  - ${job.contentId} (${job.contentType}): ${job.type} / スコア ${job.qualityScore}`)
    }
  }
  console.log(`\n[audit-content] 監査完了`)

  // Section A: 釣果レポート
  const allReports = getAllReports()
  const { reportErrors } = auditReports(allReports)

  // Section B: 釣具商品品質チェック
  const sectionBOk = await runSectionB()

  if (reportErrors > 0 || !sectionBOk) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('[audit-content] エラー:', err)
  process.exit(1)
})
