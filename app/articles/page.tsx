import { MOCK_ARTICLES } from '@/lib/mockArticles'

export default function ArticlesPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 48px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
        📰 全国特集・記事まとめ
      </h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
        釣り初心者から上級者まで役立つ情報をお届けします。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MOCK_ARTICLES.map((article) => (
          <div
            key={article.id}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
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
            <div style={{ fontSize: 12, color: '#1a4f8a', fontWeight: 600, marginBottom: 6 }}>
              {article.category}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 8 }}>
              {article.title}
            </div>
            <div style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 10 }}>
              {article.summary}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {article.publishedAt}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
