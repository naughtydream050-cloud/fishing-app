import type { Metadata } from 'next'
import { MOCK_ARTICLES } from '@/lib/mockArticles'

export const metadata: Metadata = {
  title: '釣り記事・特集まとめ｜釣り予報AI',
  description: '釣り初心者から上級者まで役立つ情報。全国の釣果まとめ・釣り場ガイド・テクニック・入門ガイドを掲載。',
  openGraph: {
    title: '釣り記事・特集まとめ｜釣り予報AI',
    description: '釣果まとめ・釣り場ガイド・テクニック記事を毎日更新。',
  },
}

export default function ArticlesPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 48px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-blue-950)', marginBottom: 6 }}>
        📰 全国特集・記事まとめ
      </h1>
      <p style={{ fontSize: 14, color: 'var(--c-gray-600)', marginBottom: 20 }}>
        釣り初心者から上級者まで役立つ情報をお届けします。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MOCK_ARTICLES.map((article) => (
          <a
            key={article.id}
            href={`/articles/${article.slug}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit',
              background: '#fff',
              border: '1px solid var(--c-gray-200)',
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
            className="card-hover"
          >
            {article.imageUrl && (
              <div style={{
                height: 140,
                backgroundImage: `url(${article.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 10,
                marginBottom: 14,
              }} />
            )}
            <div style={{ fontSize: 12, color: 'var(--c-teal-800)', fontWeight: 600, marginBottom: 6 }}>
              {article.category}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-gray-900)', lineHeight: 1.4, marginBottom: 8 }}>
              {article.title}
            </div>
            <div style={{ fontSize: 14, color: 'var(--c-gray-600)', lineHeight: 1.6, marginBottom: 10 }}>
              {article.summary}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--c-gray-400)' }}>
                {article.publishedAt}
              </div>
              <div style={{ fontSize: 13, color: 'var(--c-blue-700)', fontWeight: 600 }}>
                続きを読む →
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* サブスク CTA バナー */}
      <div style={{
        marginTop: 32,
        background: 'linear-gradient(135deg, var(--c-blue-900), var(--c-teal-800))',
        borderRadius: 'var(--r-card)',
        padding: '22px 22px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
          🔔 地域の釣り予報をメールで受け取る
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16 }}>
          無料登録で気になる地域の最新情報をお届け。釣れる日を見逃さない。
        </div>
        <a href="/subscribe" className="btn-primary" data-cta="article-subscribe">
          無料で釣り予報を受け取る →
        </a>
      </div>
    </main>
  )
}
