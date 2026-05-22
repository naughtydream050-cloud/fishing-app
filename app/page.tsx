import { REGIONS } from '@/types/region'
import { getRegionalForecastsByRegion } from '@/lib/forecastRepository'
import { getTrendingGears } from '@/lib/dataAccess'
import { isFishingProduct } from '@/lib/productFilter'
import { isDummyUrl } from '@/lib/gearRecommendation'
import { generateFaqJsonLd, generateBreadcrumbJsonLd, generateArticleJsonLd } from '@/lib/jsonld'
import { MOCK_ARTICLES } from '@/lib/mockArticles'
import { getLatestReports } from '@/lib/fishingReports'
import DataSourceBadge from '@/components/DataSourceBadge'
import GearSetCard from '@/components/GearSetCard'
import { recommendGearSet, type GearRecommendationContext } from '@/lib/gearRecommendation'
import type { FishId } from '@/types/fish'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '釣り予報AI｜今日どこで釣れる？地域別の釣れそう度を30秒でチェック',
  description: '地域別の活性スコア・今日釣れそうな場所がわかる釣り予報サービス。広島・山口・岡山・東京湾の釣り場情報を毎日更新。',
  openGraph: {
    title: '釣り予報AI｜今日どこで釣れる？',
    description: '地域別の活性スコアで、今日釣れそうな場所が30秒でわかる。',
    url: 'https://fishing-app-omega.vercel.app',
  },
}

// ── Fish display metadata ──────────────────────────────────────
type FishMeta = {
  name: string
  emoji: string
  time: string
  difficulty: '初心者OK' | '中級者向け'
}
const FISH_META: Record<FishId, FishMeta> = {
  seabass:    { name: 'シーバス',     emoji: '🎣', time: '夜〜朝マズメ', difficulty: '中級者向け' },
  aji:        { name: 'アジ',         emoji: '🐟', time: '夕マズメ〜夜', difficulty: '初心者OK'   },
  mebaru:     { name: 'メバル',       emoji: '🐡', time: '夜釣り',       difficulty: '初心者OK'   },
  black_bass: { name: 'ブラックバス', emoji: '🎣', time: '朝・夕マズメ', difficulty: '初心者OK'   },
}

function scoreColor(score: number): string {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}
function scoreBadge(score: number): string {
  if (score >= 70) return '好調'
  if (score >= 40) return '普通'
  return '渋め'
}

const QUICK_CHIPS = [
  { label: '広島', slug: 'hiroshima', active: true },
  { label: '山口', slug: 'yamaguchi', active: true },
  { label: '岡山', slug: 'okayama', active: true },
  { label: '東京湾', slug: 'tokyo_23', active: true },
  { label: '大阪', slug: null, active: false },
  { label: '兵庫', slug: null, active: false },
]

export default async function HomePage() {
  const regionForecasts = await Promise.all(
    REGIONS.map(async (region) => {
      const forecasts = await getRegionalForecastsByRegion(region.id).catch(() => [])
      const top = forecasts.sort((a, b) => b.forecastScore - a.forecastScore)[0]
      return { region, top }
    })
  )
  const firstForecast = regionForecasts.find(r => r.top)?.top

  const top3 = [...regionForecasts]
    .filter(r => r.top)
    .sort((a, b) => (b.top?.forecastScore ?? 0) - (a.top?.forecastScore ?? 0))
    .slice(0, 3)

  const latestFishingReports = getLatestReports(3)
  const rawGear = await getTrendingGears('釣り竿', 'nationwide').catch(() => [])
  const topGear = rawGear.filter(isFishingProduct).slice(0, 3)
  const gearCtx: GearRecommendationContext = {
    spotId: 'nationwide', spotName: '全国', regionId: 'nationwide',
    fishTypes: ['アジ', 'シーバス', 'メバル'],
    style: 'general', level: 'beginner', targetPriceTier: 'budget',
  }
  const gearSet = recommendGearSet(rawGear, gearCtx)

  const baseUrl = 'https://fishing-app-omega.vercel.app'

  const faqJsonLd = generateFaqJsonLd([
    {
      question: '今日どこで釣れる？地域別の活性スコアは？',
      answer: regionForecasts
        .filter(r => r.top)
        .map(r => `${r.region.displayName}（活性スコア${r.top!.forecastScore}/100）`)
        .join('、'),
    },
    {
      question: '釣り用品の最安値はどこで買える？',
      answer: '楽天・Yahoo!ショッピングの最安値をAIが毎日比較。このサイトで今日の最安値が確認できます。',
    },
  ])
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: '釣り予報AI', url: baseUrl },
  ])
  const articleJsonLd = generateArticleJsonLd({
    title: '今日どこで釣れる？地域別の釣れそう度を30秒でチェック｜釣り予報AI',
    description: '気象庁データ×AIで全国の釣り場を分析。地域別の活性スコア・おすすめ魚種を毎日更新。',
    url: baseUrl,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <main style={{ maxWidth: 740, margin: '0 auto', padding: '18px 14px 56px' }}>

        {/* ━━━━━━ HERO ━━━━━━ */}
        <section className="hero">
          <div className="hero-eyebrow">🗾 全国釣り予報 · 毎日更新</div>
          <h1>今日どこで釣れる？<br />地域別の釣れそう度を30秒でチェック</h1>
          <p className="hero-sub" style={{ marginTop: 10 }}>
            気象庁データで全国の釣り場を分析。地域ごとの活性スコアで、今日釣れそうな場所がすぐわかります。
          </p>

          {/* TOP3 地域スコア */}
          {top3.length > 0 && (
            <div className="hero-top3">
              {top3.map(({ region, top }, i) => {
                const fish = top ? FISH_META[top.fishId] : null
                const score = top?.forecastScore ?? 0
                return (
                  <a
                    key={region.id}
                    href={`/areas/${region.slug}`}
                    className="hero-top3-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    data-cta="hero-search-region"
                  >
                    <span className="hero-top3-rank">#{i + 1}</span>
                    <span className="hero-top3-info">
                      {region.displayName}
                      {fish ? ` — ${fish.emoji} ${fish.name}` : ''}
                      {top ? ` · ${top.weatherSummary}` : ''}
                    </span>
                    <span
                      className="hero-top3-score"
                      style={{ color: score >= 70 ? '#6ee7b7' : score >= 40 ? '#fcd34d' : '#fca5a5' }}
                    >
                      {score}点
                    </span>
                  </a>
                )
              })}
            </div>
          )}

          <div className="hero-ctas">
            <a href="/areas" className="btn-primary" data-cta="hero-view-areas">🗾 自分の地域を見る</a>
            <a href="/subscribe" className="btn-ghost" data-cta="hero-free-signup">📩 無料で釣り予報を受け取る</a>
          </div>
        </section>

        {/* ━━━━━━ クイック地域検索 ━━━━━━ */}
        <div className="quick-search">
          <div className="quick-search-title">🔍 地域から釣り場を探す</div>
          <input
            className="quick-search-input"
            type="text"
            placeholder="地域名を入力（例：広島、東京）"
            readOnly
            aria-label="地域検索（準備中）"
          />
          <div className="quick-chips">
            {QUICK_CHIPS.map(chip => (
              chip.active && chip.slug ? (
                <a
                  key={chip.label}
                  href={`/areas/${chip.slug}`}
                  className="region-chip"
                  data-cta="hero-search-region"
                >
                  {chip.label}
                </a>
              ) : (
                <span key={chip.label} className="region-chip region-chip-disabled">
                  {chip.label}
                  <span className="badge-coming-soon" style={{ marginLeft: 4, fontSize: '0.6rem', padding: '1px 6px', borderRadius: 99 }}>準備中</span>
                </span>
              )
            ))}
          </div>
        </div>

        {/* ━━━━━━ 地域別予想 ━━━━━━ */}
        <section className="section">
          {firstForecast && (
            <DataSourceBadge
              isMock={firstForecast.isMock}
              generatedAt={firstForecast.generatedAt}
              dataStatus={firstForecast.dataStatus}
            />
          )}
          <div className="section-header">
            <h2 className="section-title">🗾 今日の地域別釣り予想</h2>
            <a href="/forecast" className="section-link">すべて見る →</a>
          </div>
          <div className="grid-forecast">
            {regionForecasts.map(({ region, top }) => {
              const score = top?.forecastScore ?? 0
              const fish  = top ? FISH_META[top.fishId] : null
              const color = scoreColor(score)
              return (
                <a
                  key={region.id}
                  href={`/areas/${region.slug}`}
                  className="card card-hover forecast-card"
                  data-cta="hero-search-region"
                >
                  <div className="forecast-card-head">
                    <div style={{ flex: 1 }}>
                      <div className="forecast-region-name">{region.displayName}</div>
                      <div className="forecast-meta">
                        {top
                          ? `🌡️ ${top.seaTemperature}℃ | ${top.tideSummary} | ${top.weatherSummary}`
                          : 'データ生成中…'}
                      </div>
                      <div className="forecast-badges">
                        {fish && (
                          <>
                            <span className="badge badge-fish">{fish.emoji} {fish.name}</span>
                            <span className="badge badge-time">⏰ {fish.time}</span>
                            <span className={`badge ${fish.difficulty === '初心者OK' ? 'badge-easy' : 'badge-inter'}`}>
                              {fish.difficulty === '初心者OK' ? '🟢 初心者OK' : '🔵 中級者向け'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className="forecast-score"
                      style={{ color, borderColor: color }}
                    >
                      <span>{score || '—'}</span>
                      <span className="score-label">{scoreBadge(score)}</span>
                    </div>
                  </div>
                  {top?.aiSummary && (
                    <p className="forecast-summary">{top.aiSummary}</p>
                  )}
                </a>
              )
            })}
          </div>

          {/* プレミアム機能プレビューカード */}
          <div className="premium-preview-card" style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-blue-800)', marginBottom: 6 }}>
              📊 プレミアムで各スポットのリアルタイム予報が見られます
            </div>
            <p style={{ fontSize: 13, color: 'var(--c-gray-600)', marginBottom: 12, lineHeight: 1.6 }}>
              天気・潮汐・水温を組み合わせた詳細なスポット別予報。毎週メールでお届け。
            </p>
            <a href="/subscribe" className="section-link" data-cta="premium-upgrade">
              プレミアムを詳しく見る →
            </a>
          </div>
        </section>

        {/* ━━━━━━ 釣果レポート ━━━━━━ */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">📋 最近の釣果レポート</h2>
            <a href="/reports" className="section-link">すべて見る →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {latestFishingReports.map((report) => (
              <a key={report.slug} href={`/reports/${report.slug}`} className="card card-hover report-card">
                <div className="report-thumb-wrap">🐟</div>
                <div className="report-body">
                  <div className="report-area">📍 {report.regionName}</div>
                  <div className="report-title">{report.title}</div>
                  <div className="report-tags">
                    {report.fishNames.map(f => (
                      <span key={f} className="badge badge-report">{f}</span>
                    ))}
                  </div>
                  <div className="report-summary">{report.summary.slice(0, 60)}…</div>
                  <div className="report-footer">編集部データ · {report.publishedAt}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ━━━━━━ 全国特集・記事 ━━━━━━ */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">📰 全国特集・記事まとめ</h2>
            <a href="/articles" className="section-link">すべて見る →</a>
          </div>
          <div className="grid-articles">
            {MOCK_ARTICLES.slice(0, 4).map((article) => (
              <a key={article.id} href={`/articles/${article.slug}`} className="card card-hover article-card">
                {article.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="article-img"
                    style={{ borderRadius: '14px 14px 0 0' }}
                  />
                ) : (
                  <div className="article-img-wrap">📰</div>
                )}
                <div className="article-body">
                  <span className="badge badge-cat">{article.category}</span>
                  <div className="article-title">{article.title}</div>
                  <div className="article-summary">{article.summary}</div>
                  <div className="article-date">{article.publishedAt}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ━━━━━━ 激安釣具（補助 · 最大3件） ━━━━━━ */}
        <section>
          <div className="gear-header">
            <span className="gear-header-title">🛒 本日のおすすめ釣具</span>
            <span className="gear-pr-badge">PR</span>
            <a
              href="/deals"
              style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--c-gray-500)', textDecoration: 'none' }}
            >
              もっと見る →
            </a>
          </div>

          {topGear.length === 0 ? (
            <p style={{ color: 'var(--c-gray-400)', fontSize: '0.85rem', padding: '12px 0' }}>
              データ取得中...
            </p>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--c-gray-200)',
              borderRadius: 'var(--r-card)',
              boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
            }}>
              {topGear.map((item, i) => {
                const rakutenPrice = item.platform === 'rakuten' ? item.price : item.competitorPrice
                const yahooPrice   = item.platform === 'yahoo'   ? item.price : item.competitorPrice
                const cheaperPlatform = (rakutenPrice ?? Infinity) <= (yahooPrice ?? Infinity) ? 'rakuten' : 'yahoo'
                const bestPrice = cheaperPlatform === 'rakuten' ? rakutenPrice : yahooPrice
                return (
                  <div
                    key={item.id}
                    className="gear-card"
                    style={i < topGear.length - 1 ? { borderBottom: '1px solid var(--c-gray-200)' } : {}}
                  >
                    <div className="gear-rank">{i + 1}</div>
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="gear-img" width={56} height={56} />
                    )}
                    <div className="gear-info">
                      {item.manufacturer && <div className="gear-maker">{item.manufacturer}</div>}
                      <div className="gear-title">{item.title}</div>
                      <div className="gear-price">
                        ¥{bestPrice?.toLocaleString() ?? '—'}
                        <span className="gear-platform">
                          ({cheaperPlatform === 'rakuten' ? '楽天' : 'Yahoo!'})
                        </span>
                      </div>
                    </div>
                    {isDummyUrl(item.affiliateUrl) ? (
                      <span className="gear-cta gear-cta-demo">参考</span>
                    ) : (
                      <a
                        href={item.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gear-cta"
                      >
                        見る →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ━━━━━━ 釣行セット ━━━━━━ */}
        <section style={{ marginTop: 8 }}>
          <GearSetCard gearSet={gearSet} showDataSource={true} />
        </section>

        {/* ━━━━━━ 免責・注意事項 ━━━━━━ */}
        <div className="disclaimer-box">
          <div>※ 釣れそう度は天気・簡易潮回り・過去傾向をもとにした参考情報です。釣果を保証するものではありません。</div>
          <div>※ 潮回りは簡易推定（月齢ベース）です。実際の満潮・干潮時刻は各地の潮位表を確認してください。</div>
          <div>※ 立入禁止区域・漁業権・安全管理を必ず確認し、ライフジャケット着用を推奨します。</div>
        </div>

      </main>
    </>
  )
}
