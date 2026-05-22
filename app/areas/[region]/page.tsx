import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { REGIONS } from '@/types/region'
import { MOCK_SPOTS } from '@/lib/mockSpots'
import { getRegionalForecastsByRegion } from '@/lib/forecastRepository'
import { generateBreadcrumbJsonLd } from '@/lib/jsonld'
import DataSourceBadge from '@/components/DataSourceBadge'
import { getReportsByRegion } from '@/lib/fishingReports'

export const revalidate = 86400

type Props = { params: Promise<{ region: string }> }

const AREA_INFO: Record<string, { fish: string[]; tips: string; season: string }> = {
  tokyo_23: {
    fish: ['シーバス', 'クロダイ', 'アジ', 'メバル', 'ハゼ'],
    tips: '東京湾岸の護岸・橋脚周りがポイント。夜釣りのシーバスが人気。潮が動く時間帯を狙うと釣果アップ。',
    season: '通年。春〜秋はシーバス、冬はメバルがおすすめ。',
  },
  hiroshima: {
    fish: ['チヌ', 'メバル', 'アオリイカ', 'タチウオ', 'アジ'],
    tips: '瀬戸内の穏やかな海が広がる。落とし込み釣りでチヌが狙える。夕マズメのアジングも人気。',
    season: '春〜秋がベストシーズン。アジは5〜10月が特に好調。',
  },
  yamaguchi: {
    fish: ['アジ', 'メバル', 'マダイ', 'カサゴ', 'タチウオ'],
    tips: '日本海・瀬戸内の両方にアクセス可能。離島の釣り場も豊富。透明度が高く初心者にもおすすめ。',
    season: '春〜初夏のメバル、秋のタチウオが特によく釣れる。',
  },
  okayama: {
    fish: ['チヌ', 'シーバス', 'アジ', 'メバル', 'ブラックバス'],
    tips: '干満の差が大きい瀬戸内。潮のタイミングが釣果を左右する。児島湖バス釣りも有名。',
    season: '春〜秋がベスト。バスは4〜6月のスポーニング期が狙い目。',
  },
}

export async function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params
  const regionData = REGIONS.find((r) => r.slug === region)
  if (!regionData) return { title: '地域が見つかりません' }
  return {
    title: `${regionData.displayName}の釣り場ガイド｜釣れる魚・おすすめスポット`,
    description: `${regionData.displayName}で釣れる魚種、おすすめ釣りスポット、ベストシーズンを解説。初心者から上級者まで楽しめる釣り場情報。`,
    openGraph: {
      title: `${regionData.displayName}の釣り場ガイド`,
      description: `${regionData.displayName}の釣り場・魚種・シーズン情報`,
      url: `https://fishing-app-omega.vercel.app/areas/${region}`,
    },
  }
}

export default async function AreaRegionPage({ params }: Props) {
  const { region } = await params
  const regionData = REGIONS.find((r) => r.slug === region)
  if (!regionData) notFound()

  const spots = MOCK_SPOTS[regionData.id] ?? []
  const info = AREA_INFO[regionData.id]
  const forecasts = await getRegionalForecastsByRegion(regionData.id)
  const forecast = forecasts[0] ?? null
  const areaReports = getReportsByRegion(regionData.slug).slice(0, 3)

  const baseUrl = 'https://fishing-app-omega.vercel.app'
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: baseUrl },
    { name: '地域から探す', url: `${baseUrl}/areas` },
    { name: regionData.displayName, url: `${baseUrl}/areas/${region}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 56px' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: 'var(--c-gray-500)', marginBottom: 16 }}>
          <a href="/" style={{ color: 'var(--c-blue-700)' }}>ホーム</a>
          {' › '}
          <a href="/areas" style={{ color: 'var(--c-blue-700)' }}>地域から探す</a>
          {' › '}
          <span>{regionData.displayName}</span>
        </nav>

        {/* Header */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-blue-950)', marginBottom: 6 }}>
          🗺️ {regionData.displayName} — 釣り場ガイド
        </h1>
        <p style={{ fontSize: 14, color: 'var(--c-gray-600)', marginBottom: 20, lineHeight: 1.6 }}>
          {regionData.prefecture} · {info?.tips}
        </p>

        {/* データソースバッジ・免責文 */}
        {forecast && (
          <DataSourceBadge
            isMock={forecast.isMock}
            generatedAt={forecast.generatedAt}
            dataStatus={forecast.dataStatus}
          />
        )}

        {/* 活性スコア */}
        {forecast && (
          <div style={{
            background: 'linear-gradient(135deg, var(--c-blue-50), var(--c-teal-100))',
            border: '1px solid var(--c-blue-200)',
            borderRadius: 'var(--r-card)',
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: `3px solid ${forecast.forecastScore >= 70 ? 'var(--c-green-600)' : forecast.forecastScore >= 40 ? 'var(--c-amber-600)' : 'var(--c-red-600)'}`,
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              color: forecast.forecastScore >= 70 ? 'var(--c-green-600)' : forecast.forecastScore >= 40 ? 'var(--c-amber-600)' : 'var(--c-red-600)',
              fontWeight: 900,
              fontSize: 20,
              flexShrink: 0,
            }}>
              {forecast.forecastScore}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--c-gray-500)', marginBottom: 2 }}>今週の活性スコア</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-blue-900)' }}>
                {forecast.weatherSummary} · 水温{forecast.seaTemperature}℃ · {forecast.tideSummary}
              </div>
              <div style={{ fontSize: 13, color: 'var(--c-gray-600)', marginTop: 4 }}>
                {forecast.aiSummary.slice(0, 60)}…
              </div>
            </div>
          </div>
        )}

        {/* 釣れる魚種 */}
        {info && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 12 }}>
              🐟 主な対象魚
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {info.fish.map((f) => (
                <span key={f} className="badge badge-fish" style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                  {f}
                </span>
              ))}
            </div>
            <div style={{
              background: 'var(--c-gray-50)',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--c-gray-700)',
              lineHeight: 1.6,
            }}>
              📅 ベストシーズン：{info.season}
            </div>
          </section>
        )}

        {/* スポット一覧 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 14 }}>
            📍 おすすめ釣りスポット
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {spots.map((spot) => (
              <a
                key={spot.id}
                href={`/areas/${region}/spots/${spot.id}`}
                className="card card-hover"
                style={{ padding: '16px 18px', display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 4 }}>
                      📍 {spot.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--c-gray-600)', marginBottom: 8, lineHeight: 1.5 }}>
                      {spot.description}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      {spot.fishTypes.slice(0, 3).map((f) => (
                        <span key={f} className="badge badge-fish">{f}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-time">⏰ {spot.bestTime}</span>
                      <span className={`badge ${spot.difficulty === '初心者OK' ? 'badge-easy' : 'badge-inter'}`}>
                        {spot.difficulty === '初心者OK' ? '🟢 初心者OK' : spot.difficulty === '中級者向け' ? '🔵 中級者向け' : '🔴 上級者向け'}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-blue-700)', fontWeight: 700, flexShrink: 0 }}>
                    詳細 →
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* このエリアの釣果レポート */}
        {areaReports.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 14 }}>
              📋 このエリアの釣果レポート
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {areaReports.map((report) => (
                <a
                  key={report.slug}
                  href={`/reports/${report.slug}`}
                  className="card card-hover"
                  style={{ padding: '14px 16px', display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {report.fishNames.slice(0, 3).map((f) => (
                      <span key={f} className="badge badge-fish">{f}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-blue-900)', marginBottom: 4 }}>
                    {report.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-gray-600)', lineHeight: 1.5 }}>
                    {report.summary.slice(0, 60)}…
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-blue-700)', fontWeight: 600, marginTop: 6 }}>
                    詳しく読む →
                  </div>
                </a>
              ))}
            </div>
            <a href={`/reports?region=${regionData.slug}`} style={{ fontSize: 13, color: 'var(--c-blue-700)', fontWeight: 600, display: 'block', marginTop: 10 }}>
              このエリアのレポートをすべて見る →
            </a>
          </section>
        )}

        {/* プレミアム機能プレビューカード */}
        <div className="premium-preview-card" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-blue-800)', marginBottom: 8 }}>
            📊 プレミアムで{regionData.displayName}の詳細情報が見られます
          </div>
          <ul style={{ fontSize: 13, color: 'var(--c-gray-700)', lineHeight: 1.8, paddingLeft: 0, listStyle: 'none', marginBottom: 14 }}>
            <li>✅ 各スポットのリアルタイム活性スコア</li>
            <li>✅ 週間天気連