/**
 * audit-content.ts
 * コンテンツ品質チェックスクリプト
 * 実行: npm run audit:content
 */

import { getAllReports } from '../lib/fishingReports'
import type { FishingReport } from '../lib/fishingReports'

// ─── ANSI カラー ────────────────────────────────────────────────
const RED   = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE  = '\x1b[34m'
const RESET = '\x1b[0m'
const BOLD  = '\x1b[1m'

function ok(msg: string)   { console.log(`  ${GREEN}✅${RESET} ${msg}`) }
function warn(msg: string) { console.log(`  ${YELLOW}⚠️ ${RESET} ${msg}`) }
function fail(msg: string) { console.log(`  ${RED}❌${RESET} ${msg}`) }

// ─── レポート品質チェック ────────────────────────────────────────

function auditReports(reports: FishingReport[]) {
  console.log(`\n${BOLD}${BLUE}== 釣果レポート品質チェック ==${RESET}`)
  console.log(`対象: ${reports.length} 件\n`)

  let totalErrors = 0
  let totalWarnings = 0

  for (const report of reports) {
    const errors: string[] = []
    const warnings: string[] = []

    // 1. reviewed=false なのに公開されているレポートを検出
    //    （getAllReports() は reviewed=true のみ返すので、ここでは再度確認）
    if (!report.reviewed) {
      errors.push('reviewed=false なのにレポートが存在します（getAllReports の filter 漏れ）')
    }

    // 2. 本文が 800 文字未満のレポートを検出
    const totalBodyChars = report.bodySections.reduce(
      (sum, s) => sum + s.body.length + s.heading.length,
      0,
    )
    if (totalBodyChars < 800) {
      errors.push(`本文が 800 文字未満（現在 ${totalBodyChars} 文字）`)
    } else if (totalBodyChars < 1200) {
      warnings.push(`本文が比較的少ない（${totalBodyChars} 文字、推奨 1200 以上）`)
    }

    // 3. relatedSpotSlugs が空のレポートを検出
    if (report.relatedSpotSlugs.length === 0) {
      warnings.push('relatedSpotSlugs が空です（釣り場との紐付けなし）')
    }

    // 4. relatedGearKeywords が空のレポートを検出
    if (report.relatedGearKeywords.length === 0) {
      errors.push('relatedGearKeywords が空です')
    }

    // 5. ctaType がないレポートを検出
    if (!report.ctaType) {
      errors.push('ctaType が設定されていません')
    }

    // 6. dataSource 表示なしのレポートを検出
    const validDataSources = ['manual', 'mock', 'api', 'generated']
    if (!validDataSources.includes(report.dataSource)) {
      errors.push(`dataSource が不正な値です: "${report.dataSource}"`)
    }

    // 7. highlights が 3〜5 件かどうか
    if (report.highlights.length < 3) {
      errors.push(`highlights が 3 件未満（現在 ${report.highlights.length} 件）`)
    } else if (report.highlights.length > 5) {
      warnings.push(`highlights が 5 件超（現在 ${report.highlights.length} 件）`)
    }

    // 8. bodySections に必須セクションが含まれているか
    const requiredHeadings = [
      '先週の全体傾向',
      'よく釣れていた魚',
      '反応が良かった時間帯',
      '釣果が出やすかった釣り場',
      '有効だった釣り方・仕掛け',
      '今週狙うならどこか',
      '初心者向けの狙い方',
      '注意点',
    ]
    const existingHeadings = report.bodySections.map((s) => s.heading)
    for (const required of requiredHeadings) {
      if (!existingHeadings.includes(required)) {
        errors.push(`必須セクション「${required}」がありません`)
      }
    }

    // 9. 断定表現チェック（「釣れます」等）
    const bodyText = report.bodySections.map((s) => s.body).join(' ')
    const forbiddenPatterns = [/釣れます。/, /釣れました。/, /保証します/]
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(bodyText)) {
        warnings.push(`断定表現が含まれている可能性があります: ${pattern.source}`)
      }
    }

    // 10. isGenerated=true && reviewed=false の組み合わせは notFound になるべき
    if (report.isGenerated && !report.reviewed) {
      errors.push('isGenerated=true && reviewed=false のレポートは公開すべきではありません')
    }

    // 結果出力
    const hasIssues = errors.length > 0 || warnings.length > 0
    const icon = errors.length > 0 ? `${RED}❌${RESET}` : warnings.length > 0 ? `${YELLOW}⚠️ ${RESET}` : `${GREEN}✅${RESET}`
    console.log(`${icon} ${BOLD}${report.slug}${RESET}`)

    for (const e of errors) {
      fail(e)
      totalErrors++
    }
    for (const w of warnings) {
      warn(w)
      totalWarnings++
    }
    if (!hasIssues) {
      ok(`問題なし（本文 ${totalBodyChars} 文字、sections ${report.bodySections.length} 件）`)
    }
    console.log()
  }

  return { totalErrors, totalWarnings }
}

// ─── メイン実行 ──────────────────────────────────────────────────

function main() {
  console.log(`\n${BOLD}${BLUE}=== コンテンツ品質監査 ===${RESET}`)
  console.log(`実行日時: ${new Date().toLocaleString('ja-JP')}`)

  const allReports = getAllReports()
  const { totalErrors, totalWarnings } = auditReports(allReports)

  // サマリー
  console.log(`${BOLD}${BLUE}== 監査サマリー ==${RESET}`)
  console.log(`  レポート数: ${allReports.length}`)
  console.log(`  ${totalErrors > 0 ? RED : GREEN}エラー: ${totalErrors}${RESET}`)
  console.log(`  ${totalWarnings > 0 ? YELLOW : GREEN}警告: ${totalWarnings}${RESET}`)

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(`\n${GREEN}${BOLD}✅ すべてのチェックをパスしました！${RESET}\n`)
  } else if (totalErrors === 0) {
    console.log(`\n${YELLOW}${BOLD}⚠️  警告があります。確認してください。${RESET}\n`)
  } else {
    console.log(`\n${RED}${BOLD}❌ エラーがあります。修正が必要です。${RESET}\n`)
    process.exit(1)
  }
}

main()
