import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { REGIONS } from '@/types/region'
import { MOCK_SPOTS } from '@/lib/mockSpots'
import { generateBreadcrumbJsonLd } from '@/lib/jsonld'
import { getTrendingGears } from '@/lib/dataAccess'
import { recommendGearSet } from '@/lib/gearRecommendation'
import GearSetCard from '@/components/GearSetCard'

export const revalidate = 86400

type Props = { params: Promise<{ region: string; spot: string }> }

export async function generateStaticParams() {
  const params: { region: string; spot: string }[] = []
  for (const region of REGIONS) {
    const spots = MOCK_SPOTS[region.id] ?? []
    for (const spot of spots) {
      params.push({ region: region.slug, spot: spot.id })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, spot } = await params
  const regionData = REGIONS.find((r) => r.slug === region)
  if (!regionData) return { title: '地域が見つかりません' }
  const spots = MOCK_SPOTS[regionData.id] ?? []
  const spotData = spots.find((s) => s.id === spot)
  if (!spotData) return { title: 'スポットが見つかりません' }
  return {
    title: `${spotData.name}の釣り場情報｜${regionData.displayName}`,
    description: `${spotData.name}で釣れる魚種・難易度・おすすめタックル情報。${spotData.fishTypes.join('・')}が狙える。`,
    openGraph: {
      title: `${spotData.name}の釣り場情報`,
      description: `${spotData.description}`,
      url: `https://fishing-app-omega.vercel.app/areas/${region}/spots/${spot}`,
    },
  }
}

export default async function SpotDetailPage({ params }: Props) {
  const { region, spot } = await params
  const regionData = REGIONS.find((r) => r.slug === region)
  if (!regionData) notFound()

  const spots = MOCK_SPOTS[regionData.id] ?? []
  const spotData = spots.find((s) => s.id === spot)
  if (!spotData) notFound()

  const baseUrl = 'https://fishing-app-omega.vercel.app'
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: baseUrl },
    { name: '地域から探す', url: `${baseUrl}/areas` },
    { name: regionData.displayName, url: `${baseUrl}/areas/${region}` },
    { name: spotData.name, url: `${baseUrl}/areas/${region}/spots/${spot}` },
  ])

  const difficultyColor =
    spotData.difficulty === '初心者OK' ? 'var(--c-green-600)' :
    spotData.difficulty === '中級者向け' ? 'var(--c-blue-700)' :
    'var(--c-red-600)'

  const rawGear = await getTrendingGears(spotData.fishTypes[0] ?? '釣り竿', regionData.slug).catch(() => [])
  const gearSet = recommendGearSet({
    regionSlug: regionData.slug,
    spotSlug: spot,
    fishName: spotData.fishTypes[0],
    skillLevel: 'beginner',
  }, rawGear)

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
          <a href={`/areas/${region}`} style={{ color: 'var(--c-blue-700)' }}>{regionData.displayName}</a>
          {' › '}
          <span>{spotData.name}</span>
        </nav>

        {/* Header */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-blue-950)', marginBottom: 6 }}>
          📍 {spotData.name}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--c-gray-600)', marginBottom: 20, lineHeight: 1.6 }}>
          {regionData.prefecture} · {regionData.displayName}
        </p>

        {/* 難易度・時間帯バッジ */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <span className={`badge ${spotData.difficulty === '初心者OK' ? 'badge-easy' : 'badge-inter'}`} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
            {spotData.difficulty === '初心者OK' ? '🟢 初心者OK' : spotData.difficulty === '中級者向け' ? '🔵 中級者向け' : '🔴 上級者向け'}
          </span>
          <span className="badge badge-time" style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
            ⏰ {spotData.bestTime}
          </span>
        </div>

        {/* スポット概要 */}
        <div className="card" style={{ padding: '18px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: 'var(--c-gray-700)', lineHeight: 1.7 }}>
            {spotData.description}
          </p>
        </div>

        {/* 釣れる魚 */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 10 }}>
            🐟 釣れる魚種
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {spotData.fishTypes.map((f) => (
              <span key={f} className="badge badge-fish" style={{ fontSize: '0.82rem', padding: '5px 14px' }}>
                {f}
              </span>
            ))}
          </div>
        </section>

        {/* おすすめ時間帯 */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 10 }}>
            ⏰ おすすめ時間帯
          </h2>
          <div style={{
            background: 'var(--c-amber-100)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 14,
            color: 'var(--c-amber-600)',
            fontWeight: 600,
          }}>
            {spotData.bestTime}
          </div>
        </section>

        {/* タックル推奨 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 10 }}>
            🎣 おすすめタックル
          </h2>
          <div style={{
            background: 'var(--c-blue-50)',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 14,
            color: 'var(--c-blue-800)',
            lineHeight: 1.6,
          }}>
            {spotData.tackle}
          </div>
        </section>

        {/* 釣行セット */}
        <GearSetCard gearSet={gearSet} />

        {/* プレミアム機能プレビューカード */}
        <div className="premium-preview-card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-blue-800)', marginBottom: 8 }}>
            📊 プレミアムで{spotData.name}の詳細情報が見られます
          </div>
          <ul style={{ fontSize: 13, color: 'var(--c-gray-700)', lineHeight: 1.8, paddingLeft: 0, listStyle: 'none', marginBottom: 14 }}>
            <li>✅ リアルタイム活性スコア（毎日更新）</li>
            <li>✅ 天気・潮汐連動の釣れやすさ予報</li>
            <li>✅ 釣り師のレポート・釣果写真</li>
          </ul>
          <a href="/subscribe" className="btn-primary" style={{ background: 'var(--c-blue-800)', color: '#fff', fontSize: '0.82rem' }} data-cta="premium-upgrade">
            プレミアムを詳しく見る →
          </a>
        </div>

        {/* 保存 CTA */}
        <div style={{
          background: 'linear-gradient(135deg, var(--c-green-600), var(--c-teal-600))',
          borderRadius: 'var(--r-card)',
          padding: '22px 22px',
          textAlign: 'center' as const,
          color: '#fff',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
            🔖 この釣り場を保存する
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16 }}>
            無料登録でお気に入りスポットを保存。釣れる日を逃さない。
          </div>
          <a href="/signup" className="btn-primary" data-cta="spot-save">
            ✅ この釣り場を保存する（無料）
          </a>
        </div>

        {/* ナビ */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href={`/areas/${region}`} style={{ fontSize: 13, color: 'var(--c-blue-700)', fontWeight: 600 }}>
            ← {regionData.displayName}のスポット一覧
          </a>
          <a href="/areas" style={{ fontSize: 13, color: 'var(--c-gray-500)' }}>
            地域一覧に戻る
          </a>
        </div>

      </main>
    </>
  )
}
