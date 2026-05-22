import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MOCK_ARTICLES } from '@/lib/mockArticles'
import { MOCK_SPOTS } from '@/lib/mockSpots'
import { REGIONS } from '@/types/region'
import { FISH_SPECIES } from '@/types/fish'
import { generateBreadcrumbJsonLd, generateArticleJsonLd } from '@/lib/jsonld'
import DataSourceBadge from '@/components/DataSourceBadge'
import { getLatestReports } from '@/lib/fishingReports'
import GearSetCard from '@/components/GearSetCard'
import { getTrendingGears } from '@/lib/dataAccess'
import { recommendGearSet, type GearRecommendationContext } from '@/lib/gearRecommendation'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

// 各記事に紐づく関連釣り場 (regionId/slug/spotId)
const ARTICLE_SPOT_MAP: Record<string, { regionId: string; regionSlug: string; spotId: string }[]> = {
  'weekly-fish-may-2026': [
    { regionId: 'hiroshima', regionSlug: 'hiroshima', spotId: 'port' },
    { regionId: 'tokyo_23',  regionSlug: 'tokyo_23',  spotId: 'odaiba' },
  ],
  'family-fishing-spots': [
    { regionId: 'hiroshima', regionSlug: 'hiroshima', spotId: 'port' },
    { regionId: 'tokyo_23',  regionSlug: 'tokyo_23',  spotId: 'odaiba' },
    { regionId: 'okayama',   regionSlug: 'okayama',   spotId: 'tamano' },
  ],
  'rainy-day-fishing': [
    { regionId: 'tokyo_23',  regionSlug: 'tokyo_23',  spotId: 'sumida' },
    { regionId: 'hiroshima', regionSlug: 'hiroshima', spotId: 'port' },
  ],
  'ajing-beginners-guide': [
    { regionId: 'hiroshima', regionSlug: 'hiroshima', spotId: 'port' },
    { regionId: 'yamaguchi', regionSlug: 'yamaguchi', spotId: 'shimono' },
  ],
}

export async function generateStaticParams() {
  return MOCK_ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = MOCK_ARTICLES.find((a) => a.slug === slug)
  if (!article) return { title: '記事が見つかりません' }
  return {
    title: `${article.title}｜釣り予報AI`,
    description: article.summary.slice(0, 120),
    openGraph: {
      title: article.title,
      description: article.summary.slice(0, 120),
      url: `https://fishing-app-omega.vercel.app/articles/${slug}`,
      images: article.imageUrl ? [{ url: article.imageUrl }] : [],
    },
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params
  const article = MOCK_ARTICLES.find((a) => a.slug === slug)
  if (!article) notFound()

  const baseUrl = 'https://fishing-app-omega.vercel.app'
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: baseUrl },
    { name: '記事', url: `${baseUrl}/articles` },
    { name: article.title, url: `${baseUrl}/articles/${slug}` },
  ])
  const articleJsonLd = generateArticleJsonLd({
    title: article.title,
    description: article.summary,
    url: `${baseUrl}/articles/${slug}`,
    datePublished: article.publishedAt,
  })

  const rawGear = await getTrendingGears('釣り竿', 'nationwide').catch(() => [])
  const articleGearCtx: GearRecommendationContext = {
    spotId: 'article', spotName: article.title.slice(0, 20), regionId: 'nationwide',
    fishTypes: ['アジ', 'シーバス', 'メバル'],
    style: 'general', level: 'beginner', targetPriceTier: 'budget',
  }
  const gearSet = recommendGearSet(rawGear, articleGearCtx)

  // 関連スポットを解決
  const spotMappings = ARTICLE_SPOT_MAP[slug] ?? []
  const relatedSpots = spotMappings
    .map(m => {
      const spot = (MOCK_SPOTS[m.regionId] ?? []).find(s => s.id === m.spotId)
      return spot ? { spot, regionSlug: m.regionSlug } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 56px' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: 'var(--c-gray-500)', marginBottom: 12 }}>
          <a href="/" style={{ color: 'var(--c-blue-700)' }}>ホーム</a>
          {' › '}
          <a href="/articles" style={{ color: 'var(--c-blue-700)' }}>記事</a>
          {' › '}
          <span>{article.title.slice(0, 30)}…</span>
        </nav>

        {/* データソースバッジ（記事はmockデータ） */}
        <DataSourceBadge
          isMock={true}
          dataStatus={{ source: 'mock', reason: 'no-data', message: 'デモ記事（本番CMSデータ未接続）' }}
        />

        {/* カテゴリ・日付 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span className="badge badge-cat">{article.category}</span>
          <span style={{ fontSize: 12, color: 'var(--c-gray-400)' }}>{article.publishedAt}</span>
        </div>

        {/* タイトル */}
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-blue-950)', lineHeight: 1.35, marginBottom: 16 }}>
          {article.title}
        </h1>

        {/* サムネイル */}
        {article.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageUrl}
            alt={article.title}
            style={{ width: '100%', borderRadius: 'var(--r-card)', marginBottom: 20, display: 'block' }}
          />
        )}

        {/* 本文（mock: summary を拡張表示） */}
        <div style={{ fontSize: 15, color: 'var(--c-gray-700)', lineHeight: 1.8, marginBottom: 28 }}>
          <p style={{ marginBottom: 16 }}>{article.summary}</p>
          <p style={{ marginBottom: 16, color: 'var(--c-gray-600)', fontSize: 14 }}>
            釣り予報AIでは気象庁データとAI分析を組み合わせ、全国各地の釣り場の活性スコアを毎日更新しています。地域別の予報は「地域から探す」からチェックできます。
          </p>
          <p style={{ fontSize: 1