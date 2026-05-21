import type { Metadata } from 'next'
import { getAllReports, getLatestReports, getReportsByRegion } from '@/lib/fishingReports'

type Props = {
  searchParams: Promise<{ region?: string }>
}

export const metadata: Metadata = {
  title: '釣果レポート | 釣り予報AI',
  description:
    '広島・大阪・東京・岡山・山口の最新釣果レポートをお届け。週次・地域別・釣り場別の詳細な釣果傾向と仕掛け情報。',
  openGraph: {
    title: '釣果レポート | 釣り予報AI',
    description: '全国各地の最新釣果レポート。週次・地域別の釣果傾向と有効な仕掛けを解説。',
    url: 'https://fishing-app-omega.vercel.app/reports',
  },
}

const REGION_FILTERS = [
  { label: '全て', slug: '' },
  { label: '広島', slug: 'hiroshima' },
  { label: '大阪', slug: 'osaka' },
  { label: '東京', slug: 'tokyo_23' },
  { label: '岡山', slug: 'okayama' },
  { label: '山口', slug: 'yamaguchi' },
]

const DATA_SOURCE_LABELS: Record<string, string> = {
  manual: '編集部データ',
  mock: 'デモデータ',
  api: 'リアルタイム',
  generated: 'AI生成',
}

const DATA_SOURCE_COLORS: Record<string, string> = {
  manual: '#e8f5e9',
  mock: '#fff8e1',
  api: '#e3f2fd',
  generated: '#f3e5f5',
}

const DATA_SOURCE_TEXT_COLORS: Record<string, string> = {
  manual: '#2e7d32',
  mock: '#f57f17',
  api: '#1565c0',
  generated: '#6a1b9a',
}

function estimateReadMinutes(sections: { body: string }[]): number {
  const totalChars = sections.reduce((sum, s) => sum + s.body.length, 0)
  return Math.max(1, Math.ceil(totalChars / 400))
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  return `${s.getMonth() + 1}/${s.getDate()}〜${e.getMonth() + 1}/${e.getDate()}`
}

export default async function ReportsPage({ searchParams }: Props) {
  const { region: regionFilter = '' } = await searchParams

  const latestReports = getLatestReports(3)
  const allReports = getAllReports()
  const filteredReports = regionFilter
    ? getReportsByRegion(regionFilter)
    : allReports

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 56px' }}>

      {/* ページヘッダー */}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
        🐟 釣果レポート
      </h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        編集部がまとめた地域別・週次の釣果傾向レポート。有効な仕掛け・時間帯・ポイント情報を提供します。
      </p>

      {/* 最新レポート ヒーローセクション */}
      {!regionFilter && latestReports.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a4f8a', marginBottom: 14 }}>
            📌 今週の注目レポート
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {latestReports.map((report, i) => (
              <a
                key={report.slug}
                href={`/reports/${report.slug}`}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  background: i === 0
                    ? 'linear-gradient(135deg, #e8f4fb, #ddf0e8)'
                    : '#fff',
                  border: `1px solid ${i === 0 ? '#b3d9f2' : '#e2e8f0'}`,
                  borderRadius: 14,
                  padding: i === 0 ? '20px 22px' : '16px 18px',
                  boxShadow: i === 0 ? '0 2px 8px rgba(26,79,138,0.10)' : '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                {i === 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1a4f8a', marginBottom: 8, letterSpacing: '0.05em' }}>
                    🔥 最新レポート
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{
                    background: '#e8f4f8', color: '#1a4f8a', fontSize: 11,
                    fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  }}>
                    📍 {report.regionName}
                  </span>
                  {report.fishNames.slice(0, 3).map((f) => (
                    <span key={f} style={{
                      background: '#f0f8e8', color: '#2c7a3f', fontSize: 11,
                      fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    }}>
                      {f}
                    </span>
                  ))}
                  <span style={{
                    background: DATA_SOURCE_COLORS[report.dataSource] ?? '#f5f5f5',
                    color: DATA_SOURCE_TEXT_COLORS[report.dataSource] ?? '#555',
                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                  }}>
                    {DATA_SOURCE_LABELS[report.dataSource]}
                  </span>
                </div>
                <div style={{
                  fontSize: i === 0 ? 17 : 15,
                  fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 6,
                }}>
                  {report.title}
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 8 }}>
                  {report.summary.slice(0, 80)}…
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: '#999' }}>
                  <span>📅 {formatDateRange(report.weekStart, report.weekEnd)}</span>
                  <span>⏱️ 約{estimateReadMinutes(report.bodySections)}分</span>
                  <span style={{ marginLeft: 'auto', color: '#1a4f8a', fontWeight: 700 }}>
                    詳しく読む →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 地域フィルタ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10 }}>
          🗾 地域で絞り込む
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {REGION_FILTERS.map((f) => {
            const isActive = f.slug === regionFilter
            return (
              <a
                key={f.slug}
                href={f.slug ? `/reports?region=${f.slug}` : '/reports'}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: isActive ? '#1a4f8a' : '#f0f4f8',
                  color: isActive ? '#fff' : '#555',
                  border: isActive ? '2px solid #1a4f8a' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </a>
            )
          })}
        </div>
      </div>

      {/* フィルタ結果ラベル */}
      {regionFilter && (
        <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
          「{REGION_FILTERS.find((f) => f.slug === regionFilter)?.label ?? regionFilter}」のレポート {filteredReports.length}件
        </div>
      )}

      {/* レポートカード一覧 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredReports.length === 0 ? (
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '28px 20px', textAlign: 'center', color: '#999', fontSize: 14,
          }}>
            該当するレポートがありません。
            <br />
            <a href="/reports" style={{ color: '#1a4f8a', fontWeight: 600, marginTop: 8, display: 'inline-block' }}>
              全レポートを見る →
            </a>
          </div>
        ) : (
          filteredReports.map((report) => (
            <a
              key={report.slug}
              href={`/reports/${report.slug}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              {/* バッジ行 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  background: '#e8f4f8', color: '#1a4f8a', fontSize: 11,
                  fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                }}>
                  📍 {report.regionName}
                </span>
                {report.fishNames.slice(0, 3).map((f) => (
                  <span key={f} style={{
                    background: '#f0f8e8', color: '#2c7a3f', fontSize: 11,
                    fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  }}>
                    {f}
                  </span>
                ))}
                <span style={{
                  background: DATA_SOURCE_COLORS[report.dataSource] ?? '#f5f5f5',
                  color: DATA_SOURCE_TEXT_COLORS[report.dataSource] ?? '#555',
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                  marginLeft: 'auto',
                }}>
                  {DATA_SOURCE_LABELS[report.dataSource]}
                </span>
              </div>

              {/* タイトル */}
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 6 }}>
                {report.title}
              </div>

              {/* サマリー */}
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>
                {report.summary.slice(0, 70)}…
              </div>

              {/* フッター */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: '#999' }}>
                <span>📅 {formatDateRange(report.weekStart, report.weekEnd)}</span>
                <span>⏱️ 約{estimateReadMinutes(report.bodySections)}分で読める</span>
                <span style={{ marginLeft: 'auto', color: '#1a4f8a', fontWeight: 700, fontSize: 13 }}>
                  詳しく読む →
                </span>
              </div>
            </a>
          ))
        )}
      </div>

      {/* 全レポート数表示 */}
      <div style={{ marginTop: 20, fontSize: 13, color: '#999', textAlign: 'center' }}>
        全{allReports.length}件のレポートを掲載中
      </div>

    </main>
  )
}
