import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllReports, getReportBySlug } from '@/lib/fishingReports'
import { generateBreadcrumbJsonLd } from '@/lib/jsonld'

type Props = { params: Promise<{ slug: string }> }

const BASE_URL = 'https://fishing-app-omega.vercel.app'

const DATA_SOURCE_LABELS: Record<string, string> = {
  manual: '編集部データ',
  mock: 'デモデータ',
  api: 'リアルタイム',
  generated: 'AI生成',
}

const DATA_SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  manual: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  mock: { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' },
  api: { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  generated: { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
}

export async function generateStaticParams() {
  return getAllReports().map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const report = getReportBySlug(slug)
  if (!report) return { title: 'レポートが見つかりません' }
  return {
    title: `${report.title} | 釣り予報AI`,
    description: report.description,
    openGraph: {
      title: report.title,
      description: report.description,
      url: `${BASE_URL}/reports/${slug}`,
      type: 'article',
    },
  }
}

export default async function ReportDetailPage({ params }: Props) {
  const { slug } = await params
  const report = getReportBySlug(slug)

  // isGenerated=true && reviewed=false → 非表示
  if (!report) notFound()
  if (report.isGenerated && !report.reviewed) notFound()

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: BASE_URL },
    { name: '釣果レポート', url: `${BASE_URL}/reports` },
    { name: report.title, url: `${BASE_URL}/reports/${slug}` },
  ])

  // Article JSON-LD
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: report.title,
    description: report.description,
    datePublished: report.publishedAt,
    dateModified: report.updatedAt,
    url: `${BASE_URL}/reports/${slug}`,
    author: { '@type': 'Organization', name: '釣り予報AI編集部' },
    publisher: {
      '@type': 'Organization',
      name: '釣り予報AI',
      url: BASE_URL,
    },
    about: report.fishNames.map((f) => ({ '@type': 'Thing', name: f })),
  }

  const sourceStyle = DATA_SOURCE_COLORS[report.dataSource] ?? DATA_SOURCE_COLORS.manual

  // 関連スポットのURLパース（"regionSlug/spotId" 形式）
  const relatedSpotLinks = report.relatedSpotSlugs
    .map((s) => {
      const [region, spot] = s.split('/')
      if (!region || !spot) return null
      return { href: `/areas/${region}/spots/${spot}`, label: `${region}・${spot} の釣り場情報` }
    })
    .filter(Boolean) as { href: string; label: string }[]

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

        {/* 1. パンくずリスト */}
        <nav style={{ fontSize: 13, color: 'var(--c-gray-500)', marginBottom: 16 }}>
          <a href="/" style={{ color: 'var(--c-blue-700)' }}>ホーム</a>
          {' › '}
          <a href="/reports" style={{ color: 'var(--c-blue-700)' }}>釣果レポート</a>
          {' › '}
          <span>{report.title.slice(0, 32)}…</span>
        </nav>

        {/* 4. isMock バナー */}
        {report.isMock && (
          <div style={{
            background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10,
            padding: '10px 16px', fontSize: 13, color: '#f57f17', fontWeight: 600,
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠️ このレポートはデモデータです。実際の釣果情報ではありません。
          </div>
        )}

        {/* 2. タイトル・対象期間・地域・対象魚タグ */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <span style={{
            background: '#e8f4f8', color: '#1a4f8a', fontSize: 12,
            fontWeight: 600, padding: '3px 10px', borderRadius: 20,
          }}>
            📍 {report.regionName}
          </span>
          {report.fishNames.map((f) => (
            <span key={f} style={{
              background: '#f0f8e8', color: '#2c7a3f', fontSize: 12,
              fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            }}>
              {f}
            </span>
          ))}
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-blue-950)', lineHeight: 1.35, marginBottom: 10 }}>
 