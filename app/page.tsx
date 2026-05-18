import { REGIONS } from '@/types/region'
import { getForecastsForRegion } from '@/lib/forecasts'
import { getTrendingGears } from '@/lib/dataAccess'
import { isFishingProduct } from '@/lib/productFilter'
import { generateFaqJsonLd } from '@/lib/jsonld'
import { MOCK_FISHING_REPORTS } from '@/lib/mockFishingReports'
import { MOCK_ARTICLES } from '@/lib/mockArticles'

export const revalidate = 3600

export default async function HomePage() {
  // 地域別予報（最高スコア）
  const regionForecasts = await Promise.all(
    REGIONS.map(async (region) => {
      const forecasts = await getForecastsForRegion(region.id).catch(() => [])
      const top = forecasts.sort((a, b) => b.forecastScore - a.forecastScore)[0]
      return { region, top }
    })
  )

  // 釣具（フィルタ済み・トップ3件）
  const rawGear = await getTrendingGears('釣り竿', 'nationwide').catch(() => [])
  const topGear = rawGear.filter(isFishingProduct).slice(0, 3)

  const faqJsonLd = generateFaqJsonLd([
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
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* ━━ Hero ━━ */}
        <section style={{
          background: 'linear-gradient(135deg, #1a4f8a 0%, #0d6b5e 100%)',
          borderRadius: 16,
          padding: '28px 24px',
          marginBottom: 32,
          color: '#fff',
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4, marginBottom: 10 }}>
            🎣 今日の釣り場・釣果・激安釣具をまとめてチェック
          </h1>
          <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, marginBottom: 18 }}>
            地域別の釣果情報、今週の釣り予想、釣具セールを毎日更新。気象庁データ×AIで全国の釣り場を分析します。
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="/forecast" style={heroBtnStyle('#fff', '#1a4f8a')}>📅 今週の予想</a>
            <a href="/deals" style={heroBtnStyle('transparent', '#fff')}>🛒 激安釣具を見る</a>
          </div>
        </section>

        {/* ━━ 今週の地域別釣り予想 ━━ */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader emoji="🗾" title="今週の地域別釣り予想" href="/forecast" linkLabel="すべて見る" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {regionForecasts.map(({ region, top }) => {
              const score = top?.forecastScore ?? 0
              const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
              const badge = score >= 70 ? '🟢 好調' : score >= 40 ? '🟡 普通' : '🔴 渋め'
              return (
                <a
                  key={region.id}
                  href={`/region/${region.slug}`}
                  style={forecastCardStyle}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
                        {region.displayName}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                        {top ? `🌡️ ${top.seaTemperature}℃ | ${top.tideSummary}` : 'データ生成中...'}
                      </div>
                      {top && (
                        <div style={{ fontSize: 11, color: '#888' }}>{top.weatherSummary}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center', marginLeft: 12 }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor }}>{score || '—'}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>活性</div>
                      {top && <div style={{ fontSize: 10, marginTop: 2 }}>{badge}</div>}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* ━━ 最近の釣果報告 ━━ */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader emoji="🐟" title="最近の釣果報告" href="/reports" linkLabel="すべて見る" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_FISHING_REPORTS.slice(0, 3).map((report) => (
              <a key={report.id} href={report.sourceUrl} style={reportCardStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#1a4f8a', fontWeight: 600, marginBottom: 4 }}>
                    📍 {report.area} | {report.fishName.join('・')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 6 }}>
                    {report.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                    {report.summary}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                    {report.sourceName} · {report.publishedAt}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ━━ 全国特集・記事 ━━ */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader emoji="📰" title="全国特集・記事まとめ" href="/articles" linkLabel="すべて見る" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {MOCK_ARTICLES.slice(0, 4).map((article) => (
              <a key={article.id} href={`/articles`} style={articleCardStyle}>
                {article.imageUrl && (
                  <div style={{
                    height: 100, background: '#e8f0f8', borderRadius: 8,
                    marginBottom: 10, overflow: 'hidden',
                    backgroundImage: `url(${article.imageUrl})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                )}
                <div style={{ fontSize: 11, color: '#1a4f8a', fontWeight: 600, marginBottom: 4 }}>
                  {article.category}
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {article.title}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>{article.publishedAt}</div>
              </a>
            ))}
          </div>
        </section>

        {/* ━━ 激安釣具（最大3件） ━━ */}
        <section>
          <SectionHeader emoji="🛒" title="本日の激安釣具（最安値）" href="/deals" linkLabel="もっと見る →" />
          {topGear.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14, padding: '16px 0' }}>データ取得中...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topGear.map((item, i) => {
                const rakutenPrice = item.platform === 'rakuten' ? item.price : item.competitorPrice
                const yahooPrice = item.platform === 'yahoo' ? item.price : item.competitorPrice
                const cheaperPlatform = (rakutenPrice ?? Infinity) <= (yahooPrice ?? Infinity) ? 'rakuten' : 'yahoo'
                const bestPrice = cheaperPlatform === 'rakuten' ? rakutenPrice : yahooPrice
                return (
                  <div key={item.id} style={compactGearCardStyle}>
                    {/* Rank + Image */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={rankBadgeStyle}>{i + 1}</div>
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.title}
                          width={64} height={64}
                          style={{ objectFit: 'contain', borderRadius: 8, border: '1px solid #eee', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {item.manufacturer && (
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{item.manufacturer}</div>
                        )}
                        <div style={{
                          fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 13, color: '#e44', fontWeight: 700, marginTop: 4 }}>
                          最安値 ¥{bestPrice?.toLocaleString() ?? '—'}
                          <span style={{ fontSize: 11, color: '#888', fontWeight: 400, marginLeft: 6 }}>
                            ({cheaperPlatform === 'rakuten' ? '楽天' : 'Yahoo!'})
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={item.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={ctaBtnSmallStyle}
                    >
                      最安値で見る →
                    </a>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="/deals" style={{
              display: 'inline-block',
              background: '#fff',
              color: '#1a4f8a',
              border: '2px solid #1a4f8a',
              padding: '10px 32px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}>
              🛒 釣具をもっと見る
            </a>
          </div>
        </section>

      </main>
    </>
  )
}

// ── Styles ──

function SectionHeader({
  emoji, title, href, linkLabel,
}: { emoji: string; title: string; href: string; linkLabel: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
        {emoji} {title}
      </h2>
      <a href={href} style={{ fontSize: 13, color: '#1a4f8a', textDecoration: 'none', fontWeight: 600 }}>
        {linkLabel}
      </a>
    </div>
  )
}

const forecastCardStyle: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '14px 16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
}

const reportCardStyle: React.CSSProperties = {
  display: 'flex',
  textDecoration: 'none',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '14px 16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
}

const articleCardStyle: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '14px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
}

const compactGearCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '14px 16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const rankBadgeStyle: React.CSSProperties = {
  background: '#1a4f8a',
  color: '#fff',
  borderRadius: 8,
  width: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 15,
  flexShrink: 0,
}

const ctaBtnSmallStyle: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  background: '#1a4f8a',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
}

function heroBtnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    border: `2px solid ${color === '#fff' ? 'rgba(255,255,255,0.6)' : color}`,
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-block',
  }
}
