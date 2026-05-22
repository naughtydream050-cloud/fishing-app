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
          {report.title}
        </h1>

        <div style={{ fontSize: 13, color: 'var(--c-gray-500)', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>📅 対象期間: {report.weekStart} 〜 {report.weekEnd}</span>
          <span>🗓 公開: {report.publishedAt}</span>
        </div>

        {/* 3. データソースバッジ */}
        <div style={{
          background: sourceStyle.bg,
          border: `1px solid ${sourceStyle.border}`,
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12,
          color: sourceStyle.text,
          fontWeight: 600,
          marginBottom: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {report.dataSource === 'manual' && '✅'}
          {report.dataSource === 'mock' && '🔸'}
          {report.dataSource === 'api' && '📡'}
          {report.dataSource === 'generated' && '🤖'}
          {DATA_SOURCE_LABELS[report.dataSource]}
          {report.reviewed && <span style={{ fontWeight: 400, opacity: 0.8 }}>（編集部確認済み）</span>}
        </div>

        {/* 6. summary（リードコピー） */}
        <div style={{
          background: 'var(--c-blue-50)',
          borderLeft: '4px solid var(--c-blue-600)',
          borderRadius: '0 10px 10px 0',
          padding: '16px 20px',
          fontSize: 15,
          color: 'var(--c-blue-900)',
          lineHeight: 1.8,
          marginBottom: 24,
        }}>
          {report.summary}
        </div>

        {/* 7. highlights（箇条書き） */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 12 }}>
            📌 今週のポイント
          </h2>
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {report.highlights.map((h, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                fontSize: 14, color: 'var(--c-gray-700)', lineHeight: 1.6,
                marginBottom: 8, padding: '8px 12px',
                background: i % 2 === 0 ? 'var(--c-gray-50)' : '#fff',
                borderRadius: 8,
              }}>
                <span style={{ color: 'var(--c-blue-600)', fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}.
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 8. bodySections */}
        <article style={{ marginBottom: 32 }}>
          {report.bodySections.map((section, i) => (
            <section key={i} style={{ marginBottom: 28 }}>
              <h2 style={{
                fontSize: 17, fontWeight: 800, color: 'var(--c-blue-900)',
                marginBottom: 12, paddingBottom: 8,
                borderBottom: '2px solid var(--c-blue-100)',
              }}>
                {section.heading}
              </h2>
              <p style={{
                fontSize: 15, color: 'var(--c-gray-700)', lineHeight: 1.85,
                margin: 0,
              }}>
                {section.body}
              </p>
            </section>
          ))}
        </article>

        {/* 9. 関連釣り場カード */}
        {relatedSpotLinks.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 12 }}>
              📍 関連釣り場
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {relatedSpotLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: '12px 16px', textDecoration: 'none',
                    fontSize: 14, color: 'var(--c-blue-800)', fontWeight: 600,
                  }}
                >
                  <span>{link.label}</span>
                  <span style={{ color: 'var(--c-blue-600)' }}>→</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 10. 関連釣具キーワード */}
        {report.relatedGearKeywords.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 12 }}>
              🎣 関連釣具を探す
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {report.relatedGearKeywords.map((kw) => (
                <a
                  key={kw}
                  href={`/deals?q=${encodeURIComponent(kw)}`}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', background: '#f0f4f8', color: '#1a4f8a',
                    border: '1px solid #d0e4f7',
                  }}
                >
                  🔍 {kw}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 11. 関連記事リンク */}
        {report.relatedArticleSlugs.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 12 }}>
              📰 関連記事
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.relatedArticleSlugs.map((slug) => (
                <a
                  key={slug}
                  href={`/articles/${slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: '12px 16px', textDecoration: 'none',
                    fontSize: 14, color: 'var(--c-gray-700)', fontWeight: 500,
                  }}
                >
                  <span>📰 関連記事を読む</span>
                  <span style={{ color: 'var(--c-blue-600)' }}>→</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 12. 免責文 */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '14px 16px', fontSize: 12, color: '#6b7280', lineHeight: 1.7,
          marginBottom: 24,
        }}>
          ⚠️ このレポートは釣果を保証するものではありません。実際の釣果は天候・潮位・個人の技量により異なります。立入禁止区域・漁業権・安全管理を必ず確認し、ライフジャケット着用を推奨します。
        </div>

        {/* 13. CTA（ctaTypeに応じて切り替え） */}
        {report.ctaType === 'plus-upgrade' ? (
          <div style={{
            background: 'linear-gradient(135deg, #1a237e, #0d47a1)',
            borderRadius: 'var(--r-card)', padding: '24px 22px',
            textAlign: 'center' as const, color: '#fff', marginBottom: 24,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
              ⭐ Plusで毎週のレポートを先行受け取り
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16, lineHeight: 1.6 }}>
              Plusプランでは地域別週次レポートをメールで先行配信。スポットごとの詳細予報も見られます。
            </div>
            <a href="/subscribe" className="btn-primary" data-cta="report-plus-upgrade">
              Plusプランを見る →
            </a>
          </div>
        ) : report.ctaType === 'spot-detail' ? (
          <div style={{
            background: 'linear-gradient(135deg, var(--c-teal-700), var(--c-blue-800))',
            borderRadius: 'var(--r-card)', padding: '24px 22px',
            textAlign: 'center' as const, color: '#fff', marginBottom: 24,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
              📍 このエリアの釣り場をチェック
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16, lineHeight: 1.6 }}>
              ポイント別の詳細情報・難易度・おすすめタックル情報を確認しましょう。
            </div>
            <a href={`/areas/${report.regionSlug}`} className="btn-primary" data-cta="report-spot-detail">
              {report.regionName}の釣り場を見る →
            </a>
          </div>
        ) : report.ctaType === 'gear-set' ? (
          <div style={{
            background: 'linear-gradient(135deg, #1b5e20, #388e3c)',
            borderRadius: 'var(--r-card)', padding: '24px 22px',
            textAlign: 'center' as const, color: '#fff', marginBottom: 24,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
              🎣 この釣りに必要なタックルを揃える
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16, lineHeight: 1.6 }}>
              AI厳選の釣具最安値情報。楽天・Yahoo!の最安値を毎日比較しています。
            </div>
            <a href="/deals" className="btn-primary" data-cta="report-gear-set">
              釣具の最安値を見る →
            </a>
          </div>
        ) : (
          // free-signup (default)
          <div style={{
            background: 'linear-gradient(135deg, var(--c-green-600), var(--c-teal-600))',
            borderRadius: 'var(--r-card)', padding: '24px 22px',
            textAlign: 'center' as const, color: '#fff', marginBottom: 24,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
              🔔 {report.regionName}の釣り情報を毎週受け取る
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16, lineHeight: 1.6 }}>
              無料登録で地域の釣り予報をメールでお届け。釣れる日を見逃さない。
            </div>
            <a href="/signup" className="btn-primary" data-cta="report-free-signup">
              ✅ 無料で釣り予報を受け取る
            </a>
          </div>
        )}

        {/* ナビ */}
        <a href="/reports" style={{ fontSize: 13, color: 'var(--c-blue-700)', fontWeight: 600 }}>
          ← 釣果レポート一覧に戻る
        </a>

      </main>
    </>
  )
}
