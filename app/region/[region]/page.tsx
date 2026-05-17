import { notFound } from 'next/navigation'
import { generateFaqJsonLd, generateBreadcrumbJsonLd, generateArticleJsonLd } from '@/lib/jsonld'
import { FISH_SPECIES } from '@/types/fish'
import { REGIONS } from '@/types/region'
import { getForecastsForRegion } from '@/lib/forecasts'

export const revalidate = 10800 // 3h ISR

type Props = {
  params: Promise<{ region: string }>
}

export async function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.slug }))
}

export default async function RegionPage({ params }: Props) {
  const { region } = await params

  const regionData = REGIONS.find((r) => r.slug === region)
  if (!regionData) notFound()

  const forecasts = await getForecastsForRegion(regionData.id)

  const baseUrl = 'https://fishing-app-omega.vercel.app'
  const pageUrl = `${baseUrl}/region/${region}`

  const topFish = forecasts.sort((a, b) => b.forecastScore - a.forecastScore)

  const faqItems = [
    {
      question: `今週${regionData.displayName}で釣れる魚は？`,
      answer: topFish.length > 0
        ? topFish.map((f) => {
            const fish = FISH_SPECIES.find((s) => s.id === f.fishId)
            return `${fish?.displayName ?? f.fishId}（活性スコア${f.forecastScore}/100）`
          }).join('、')
        : '現在予報データを生成中です。',
    },
    {
      question: `${regionData.displayName}の現在の海水温は？`,
      answer: topFish[0]
        ? `${topFish[0].seaTemperature}℃（${topFish[0].generatedAt.slice(0, 10)} 更新）`
        : 'データ取得中です。',
    },
  ]

  const faqJsonLd = generateFaqJsonLd(faqItems)
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: baseUrl },
    { name: regionData.displayName, url: pageUrl },
  ])
  const articleJsonLd = generateArticleJsonLd({
    title: `【AI予報】${regionData.displayName}で今週釣れる魚・釣り場情報`,
    description: `${regionData.displayName}の釣り予報。海水温・潮汐・天気データからAIが毎日分析する魚の活性情報。`,
    url: pageUrl,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          <a href="/" style={{ color: '#1a4f8a' }}>ホーム</a>
          {' › '}
          <span>{regionData.displayName}</span>
        </nav>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          🗾 {regionData.displayName} — 今週の釣り予報
        </h1>
        <p style={{ fontSize: 15, color: '#555', marginBottom: 24 }}>
          海水温・潮汐・天気データからAIが分析した釣れる魚ランキング
        </p>

        {/* Fish forecast cards */}
        {topFish.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {topFish.map((forecast) => {
              const fish = FISH_SPECIES.find((f) => f.id === forecast.fishId)
              if (!fish) return null
              const scoreColor =
                forecast.forecastScore >= 70 ? '#16a34a' :
                forecast.forecastScore >= 40 ? '#d97706' : '#dc2626'
              return (
                <a
                  key={fish.id}
                  href={`/region/${region}/${fish.slug}`}
                  style={{
                    display: 'block', textDecoration: 'none',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                    padding: '16px 20px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>
                        {fish.displayName}
                      </div>
                      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                        🌡️ {forecast.seaTemperature}℃ &nbsp;|&nbsp;
                        🌊 {forecast.tideSummary} &nbsp;|&nbsp;
                        🌤️ {forecast.weatherSummary}
                      </div>
                      <div style={{ fontSize: 13, color: '#444', marginTop: 6, lineHeight: 1.5 }}>
                        {forecast.aiSummary.slice(0, 60)}…
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 56 }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor }}>{forecast.forecastScore}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>活性</div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div style={{ background: '#fef9c3', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 14, color: '#854d0e' }}>
            予報データ生成中です。翌日以降に更新されます。
          </div>
        )}

        {/* FAQ */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>❓ よくある質問</h2>
          {faqItems.map((item, i) => (
            <div key={i} style={{
              background: '#f8fafc', borderRadius: 8, padding: '14px 16px', marginBottom: 10,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1a4f8a' }}>
                Q: {item.question}
              </div>
              <div style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>A: {item.answer}</div>
            </div>
          ))}
        </div>

        <a href="/" style={{ fontSize: 14, color: '#1a4f8a' }}>← 全国の釣り予報を見る</a>
      </main>
    </>
  )
}
