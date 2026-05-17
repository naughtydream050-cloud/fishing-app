import { getTrendingGears } from '@/lib/dataAccess'
import GearList from '@/app/GearList'
import { REGIONS } from '@/types/region'
import { getForecastsForRegion } from '@/lib/forecasts'
import { generateFaqJsonLd } from '@/lib/jsonld'

export const revalidate = 3600

export default async function HomePage() {
  const [nationwide, chugoku, tokyo_23] = await Promise.all([
    getTrendingGears('釣り竿', 'nationwide').catch(() => []),
    getTrendingGears('釣り竿', 'chugoku').catch(() => []),
    getTrendingGears('釣り竿', 'tokyo_23').catch(() => []),
  ])

  // Fetch top forecast for each region (highest score this week)
  const regionForecasts = await Promise.all(
    REGIONS.map(async (region) => {
      const forecasts = await getForecastsForRegion(region.id).catch(() => [])
      const top = forecasts.sort((a, b) => b.forecastScore - a.forecastScore)[0]
      return { region, top }
    })
  )

  const allRegionGear = { nationwide, chugoku, tokyo_23 }

  const faqItems = [
    {
      question: '今週どこで釣れる？全国の釣り予報は？',
      answer: regionForecasts
        .filter((r) => r.top)
        .map((r) => `${r.region.displayName}（活性スコア${r.top!.forecastScore}/100）`)
        .join('、'),
    },
    {
      question: '釣り用品の最安値はどこで買える？',
      answer: '楽天・Yahoo!ショッピングの最安値をAIが毎日比較。このサイトで今日の最安値が確認できます。',
    },
  ]

  const faqJsonLd = generateFaqJsonLd(faqItems)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
            🎣 釣り予報AI — 今週どこで釣れる？
          </h1>
          <p style={{ fontSize: 15, color: '#666', lineHeight: 1.5 }}>
            気象庁データ×AIで毎日更新。地域ごとの活性予報と釣具最安値を一括チェック。
          </p>
        </div>

        {/* Date badge */}
        <div style={{
          display: 'inline-block', background: '#eef2f8', borderRadius: 8,
          padding: '6px 14px', fontSize: 14, color: '#1a4f8a', fontWeight: 600, marginBottom: 24,
        }}>
          📅 {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} 更新
        </div>

        {/* Regional Forecast Cards */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>
            🗾 今週の地域別釣り予報
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {regionForecasts.map(({ region, top }) => {
              const score = top?.forecastScore ?? 0
              const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
              return (
                <a
                  key={region.id}
                  href={`/region/${region.slug}`}
                  style={{
                    display: 'block', textDecoration: 'none',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                    padding: '16px 20px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
                        {region.displayName}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {top ? `🌡️ ${top.seaTemperature}℃ | ${top.tideSummary}` : '予報データ生成中...'}
                      </div>
                      {top && (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                          {top.weatherSummary}
                        </div>
                      )}
                    </div>
                    {top && (
                      <div style={{ textAlign: 'center', minWidth: 48 }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                          {score}
                        </div>
                        <div style={{ fontSize: 10, color: '#888' }}>活性</div>
                      </div>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </div>

        {/* Gear Section */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24, marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#1a1a1a' }}>
            🛒 本日の目玉釣具（最安値）
          </h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            楽天・Yahoo!の最安値をAIが毎日自動比較
          </p>
        </div>

        <GearList initialGear={nationwide} allRegionGear={allRegionGear} />
      </main>
    </>
  )
}
