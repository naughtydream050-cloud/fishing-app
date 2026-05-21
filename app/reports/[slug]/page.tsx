import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MOCK_FISHING_REPORTS } from '@/lib/mockFishingReports'
import { generateBreadcrumbJsonLd } from '@/lib/jsonld'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return MOCK_FISHING_REPORTS.map((r) => ({ slug: r.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const report = MOCK_FISHING_REPORTS.find((r) => r.id === slug)
  if (!report) return { title: '釣果情報が見つかりません' }
  return {
    title: `${report.title}｜釣り予報AI`,
    description: report.summary.slice(0, 120),
    openGraph: {
      title: report.title,
      description: report.summary.slice(0, 120),
      url: `https://fishing-app-omega.vercel.app/reports/${slug}`,
      images: report.imageUrl ? [{ url: report.imageUrl }] : [],
    },
  }
}

export default async function ReportDetailPage({ params }: Props) {
  const { slug } = await params
  const report = MOCK_FISHING_REPORTS.find((r) => r.id === slug)
  if (!report) notFound()

  const baseUrl = 'https://fishing-app-omega.vercel.app'
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: baseUrl },
    { name: '釣果報告', url: `${baseUrl}/reports` },
    { name: report.title, url: `${baseUrl}/reports/${slug}` },
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
          <a href="/reports" style={{ color: 'var(--c-blue-700)' }}>釣果報告</a>
          {' › '}
          <span>{report.title.slice(0, 30)}…</span>
        </nav>

        {/* エリア・魚種バッジ */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <span style={{
            background: '#e8f4f8', color: '#1a4f8a', fontSize: 12,
            fontWeight: 600, padding: '3px 10px', borderRadius: 20,
          }}>
            📍 {report.area}
          </span>
          {report.fishName.map((f) => (
            <span key={f} style={{
              background: '#f0f8e8', color: '#2c7a3f', fontSize: 12,
              fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            }}>
              {f}
            </span>
          ))}
          <span style={{ fontSize: 12, color: 'var(--c-gray-400)', marginLeft: 4 }}>
            {report.publishedAt}
          </span>
        </div>

        {/* タイトル */}
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-blue-950)', lineHeight: 1.35, marginBottom: 16 }}>
          {report.title}
        </h1>

        {/* サムネイル */}
        {report.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.imageUrl}
            alt={report.title}
            style={{ width: '100%', borderRadius: 'var(--r-card)', marginBottom: 20, display: 'block' }}
          />
        )}

        {/* 本文 */}
        <div style={{ fontSize: 15, color: 'var(--c-gray-700)', lineHeight: 1.8, marginBottom: 28 }}>
          <p style={{ marginBottom: 16 }}>{report.summary}</p>
          <p style={{ fontSize: 14, color: 'var(--c-gray-600)', lineHeight: 1.7 }}>
            釣り予報AIでは地域別の活性スコアを毎日更新しています。この地域の予報は「地域から探す」からチェックできます。
          </p>
        </div>

        {/* 情報元 */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '12px 16px', fontSize: 13, color: '#666', marginBottom: 28,
        }}>
          情報元: {report.sourceName}
        </div>

        {/* サブスク CTA */}
        <div style={{
          background: 'linear-gradient(135deg, var(--c-blue-900), var(--c-teal-800))',
          borderRadius: 'var(--r-card)',
          padding: '24px 22px',
          textAlign: 'center' as const,
          color: '#fff',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
            🔔 この地域の釣果情報を受け取る
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16 }}>
            無料登録で気になる地域の釣り予報をメールでお届け。釣れる日を見逃さない。
          </div>
          <a href="/subscribe" className="btn-primary" data-cta="report-subscribe">
            無料で釣り予報を受け取る →
          </a>
        </div>

        {/* ナビ */}
        <a href="/reports" style={{ fontSize: 13, color: 'var(--c-blue-700)', fontWeight: 600 }}>
          ← 釣果報告一覧に戻る
        </a>

      </main>
    </>
  )
}
