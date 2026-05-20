import { notFound } from 'next/navigation'
import { generateFaqJsonLd, generateBreadcrumbJsonLd, generateArticleJsonLd } from '@/lib/jsonld'
import { FISH_SPECIES } from '@/types/fish'
import { REGIONS } from '@/types/region'
import { getForecastForFish } from '@/lib/forecasts'

export const revalidate = 10800 // 3h ISR

type Props = {
  params: Promise<{ region: string; fish: string }>
}

export async function generateStaticParams() {
  return REGIONS.flatMap((region) =>
    FISH_SPECIES.map((fish) => ({
      region: region.slug,
      fish: fish.slug,
    }))
  )
}

export default async function ForecastPage({ params }: Props) {
  const { region, fish } = await params

  const regionData = REGIONS.find((r) => r.slug === region)
  const fishData = FISH_SPECIES.find((f) => f.slug === fish)

  if (!regionData || !fishData) notFound()

  const forecast = await getForecastForFish(regionData.id, fishData.id)

  const baseUrl = 'https://fishing-app-omega.vercel.app'
  const pageUrl = `${baseUrl}/region/${region}/${fish}`

  const faqItems = [
    {
      question: `今週${regionData.displayName}で${fishData.displayName}は釣れる？`,
      answer: forecast
        ? `${forecast.aiSummary}（活性スコア: ${forecast.forecastScore}/100）`
        : `現在${regionData.displayName}の${fishData.displayName}予報データを生成中です。`,
    },
    {
      question: `${regionData.displayName}で${fishData.displayName}を釣るおすすめの時間帯は？`,
      answer: '早朝5〜7時と夕マズメ17〜19時が活性が高い傾向です。潮が動く時間帯を狙いましょう。',
    },
    {
      question: `${regionData.displayName}の現在の海水温は？`,
      answer: forecast
        ? `${forecast.seaTemperature}℃（${forecast.generatedAt.slice(0, 10)} 時点）`
        : 'データ取得中です。',
    },
  ]

  const faqJsonLd = generateFaqJsonLd(faqItems)
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: baseUrl },
    { name: regionData.displayName, url: `${baseUrl}/region/${region}` },
    { name: fishData.displayName, url: pageUrl },
  ])
  const articleJsonLd = generateArticleJsonLd({
    title: `【AI予報】${regionData.displayName}で今週${fishData.displayName}は釣れる？海水温・潮データから分析`,
    description: forecast?.aiSummary ?? `${regionData.displayName}の${fishData.displayName}釣り予報。海水温・潮汐データからAIが毎日分析。`,
    url: pageUrl,
  })

  const scoreColor = !forecast
    ? '#999'
    : forecast.forecastScore >= 70
    ? '#16a34a'
    : forecast.forecastScore >= 40
    ? '#d97706'
    : '#dc2626'

  // GEO page control: noindex for low-value pages (score < 40 = weak signal)
  const shouldIndex = !forecast || forecast.forecastScore >= 40

  return (
    <>
      {!shouldIndex && (
        <meta name="robots" content="noindex, nofollow" />
      )}
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
          <a href={`/region/${region}`} style={{ color: '#1a4f8a' }}>{regionData.displayName}</a>
          {' › '}
          <span>{fishData.displayName}</span>
        </nav>

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4, marginBottom: 8 }}>
          🎣 {regionData.displayName}で今週{fishData.displayName}は釣れる？
          <br />
          <span style={{ fontSize: 15, fontWeight: 500, color: '#555' }}>
            海水温・潮汐データからAI分析
          </span>
        </h1>

        {/* Activity Score */}
        {forecast ? (
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '20px 24px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                  {forecast.forecastScore}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>活性スコア / 100</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>今週の状況</div>
                <div style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{forecast.aiSummary}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fef9c3', borderRadius: 8, padding: 16, marginBottom: 20, fontSize: 14, color: '#854d0e' }}>
            予報データ生成中です。翌日以降に更新されます。
          </div>
        )}

        {/* Data Table */}
        {forecast && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📊 データサマリー</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {[
                  ['🌤️ 天気', forecast.weatherSummary],
                  ['🌊 潮', forecast.tideSummary],
                  ['🌡️ 海水温', `${forecast.seaTemperature}℃`],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 0', color: '#555', width: '40%' }}>{label}</td>
                    <td style={{ padding: '10px 0', fontWeight: 600 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FAQ Section */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>❓ よくある質問</h2>
          {faqItems.map((item, i) => (
            <div key={i} style={{
              background: '#f8fafc', borderRadius: 8, padding: '14px 16px', marginBottom: 10,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1a4f8a' }}>
                Q: {item.question}
              </div>
              <div style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>
                A: {item.answer}
              </div>
            </div>
          ))}
        </div>

        {/* Back link */}
        <a href={`/region/${region}`} style={{ fontSize: 14, color: '#1a4f8a' }}>
          ← {regionData.displayName}の全魚種予報を見る
        </a>
      </main>
    </>
  )
}
