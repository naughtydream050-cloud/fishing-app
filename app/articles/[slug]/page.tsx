import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MOCK_ARTICLES } from '@/lib/mockArticles'
import { REGIONS } from '@/types/region'
import { FISH_SPECIES } from '@/types/fish'
import { generateBreadcrumbJsonLd, generateArticleJsonLd } from '@/lib/jsonld'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

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
        <nav style={{ fontSize: 13, color: 'var(--c-gray-500)', marginBottom: 16 }}>
          <a href="/" style={{ color: 'var(--c-blue-700)' }}>ホーム</a>
          {' › '}
          <a href="/articles" style={{ color: 'var(--c-blue-700)' }}>記事</a>
          {' › '}
          <span>{article.title.slice(0, 30)}…</span>
        </nav>

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
          <p style={{ fontSize: 14, color: 'var(--c-gray-600)', lineHeight: 1.7 }}>
            地域の活性スコアが高い日を事前に確認して、釣果アップを目指しましょう。無料登録で自分の地域の予報をお気に入り登録することもできます。
          </p>
        </div>

        {/* 関連地域チップ */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gray-700)', marginBottom: 10 }}>
            📍 関連地域の釣り場情報
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {REGIONS.map(r => (
              <a key={r.id} href={`/areas/${r.slug}`} className="region-chip" data-cta="article-region-link">
                {r.displayName}
              </a>
            ))}
          </div>
        </section>

        {/* 関連魚種チップ */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gray-700)', marginBottom: 10 }}>
            🐟 関連魚種
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FISH_SPECIES.map(f => (
              <span key={f.id} className="badge badge-fish" style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                {f.displayName}
              </span>
            ))}
          </div>
        </section>

        {/* サブスク CTA */}
        <div style={{
          background: 'linear-gradient(135deg, var(--c-blue-900), var(--c-teal-800))',
          borderRadius: 'var(--r-card)',
          padding: '24px 22px',
          textAlign: 'center',
          color: '#fff',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
            🔔 この地域の予報を毎週受け取る
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16 }}>
            無料登録で気になる地域の釣り予報をメールでお届け。釣れる日を見逃さない。
          </div>
          <a href="/subscribe" className="btn-primary" data-cta="article-subscribe">
            無料で釣り予報を受け取る →
          </a>
        </div>

        {/* ナビ */}
        <a href="/articles" style={{ fontSize: 13, color: 'var(--c-blue-700)', fontWeight: 600 }}>
          ← 記事一覧に戻る
        </a>

      </main>
    </>
  )
}
