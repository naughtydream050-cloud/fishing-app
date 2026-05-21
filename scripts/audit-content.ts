#!/usr/bin/env tsx
import * as fs from 'node:fs'
import * as path from 'node:path'

// 相対パス import（@/ エイリアスはNext.jsランタイム専用）
import { MOCK_ARTICLES } from '../lib/mockArticles'
import { MOCK_SPOTS } from '../lib/mockSpots'
import { auditAllContent, type QualityResult } from '../lib/contentQualityRules'
import { queueJobsFromAudit, type ContentJob } from '../lib/contentAutomation'

const ROOT = process.cwd()

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

async function main() {
  console.log('[audit-content] コンテンツ品質監査を開始します...')

  const allSpots = Object.values(MOCK_SPOTS).flat()
  const auditResult = auditAllContent({ articles: MOCK_ARTICLES, spots: allSpots })
  const jobs = queueJobsFromAudit(auditResult.results)

  console.log(`[audit-content] ${auditResult.summary}`)
  console.log(`[audit-content] 生成ジョブ数: ${jobs.length}件`)

  // JSON レポート出力
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

  // Markdown レポート出力
  const mdReport = buildMarkdownReport(auditResult, jobs)
  const mdPath = path.resolve(ROOT, 'content-audit-report.md')
  fs.writeFileSync(mdPath, mdReport, 'utf-8')
  console.log(`[audit-content] Markdown レポート: ${mdPath}`)

  // 優先度A の表示
  const priorityA = jobs.filter(j => j.priority === 1)
  if (priorityA.length > 0) {
    console.log(`\n[audit-content] 🔴 優先度A（最優先）: ${priorityA.length}件`)
    for (const job of priorityA) {
      console.log(`  - ${job.contentId} (${job.contentType}): ${job.type} / スコア ${job.qualityScore}`)
    }
  }

  console.log(`\n[audit-content] 監査完了`)
}

main().catch(err => {
  console.error('[audit-content] エラー:', err)
  process.exit(1)
})
