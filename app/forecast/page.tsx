import { REGIONS } from '@/types/region'
import { getForecastsForRegion } from '@/lib/forecasts'

export const revalidate = 3600

export default async function ForecastPage() {
  const regionForecasts = await Promise.all(
    REGIONS.map(async (region) => {
      const forecasts = await getForecastsForRegion(region.id).catch(() => [])
      const top = forecasts.sort((a, b) => b.forecastScore - a.forecastScore)[0]
      return { region, top }
    })
  )

  const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 48px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
        📅 今週の釣り予想
      </h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
        気象庁データ×AIで分析。{today}更新。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {regionForecasts.map(({ region, top }) => {
          const score = top?.forecastScore ?? 0
          const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
          const badge = score >= 70 ? '🟢 好調' : score >= 40 ? '🟡 普通' : '🔴 渋め'

          return (
            <a
              key={region.id}
              href={`/region/${region.slug}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '18px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
                    🗺️ {region.displayName}
                  </div>
                  {top ? (
                    <>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                        🌡️ 水温 {top.seaTemperature}℃ ｜ {top.tideSummary}
                      </div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                        ☁️ {top.weatherSummary}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: '#aaa' }}>予報データ生成中...</div>
                  )}
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    詳細を見る →
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginLeft: 16, minWidth: 60 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                    {score || '—'}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>活性スコア</div>
                  {top && <div style={{ fontSize: 12 }}>{badge}</div>}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </main>
  )
}
