import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プラン比較｜釣り予報AI',
  description: '無料プランとプレミアムプランの機能比較。毎日の釣り予報をメールで受け取るプレミアムプランで釣果をアップ。',
  openGraph: {
    title: 'プラン比較｜釣り予報AI',
    description: '無料とプレミアムで何が変わる？機能を比較してみよう。',
    url: 'https://fishing-app-omega.vercel.app/subscribe',
  },
}

const FREE_FEATURES = [
  { label: '今日の釣りスポットランキング（上位3件）', available: true },
  { label: '地域別活性スコアを毎日閲覧', available: true },
  { label: '釣果レポートを閲覧', available: true },
  { label: '釣り情報記事を読む', available: true },
  { label: '釣具の最安値チェック', available: true },
]

const PLUS_FEATURES = [
  { label: '無料プランのすべての機能', available: true, soon: false },
  { label: '全スポットランキング（4位以降も全件表示）', available: true, soon: true },
  { label: '都道府県別スポットランキング（全件）', available: true, soon: true },
  { label: '魚種別・時間帯別スコア詳細', available: true, soon: true },
  { label: '前日比・先週比の釣れやすさ差分', available: true, soon: true },
  { label: 'お気に入りスポット登録と通知', available: true, soon: true },
  { label: '毎朝メールで今日の釣り予報をお届け', available: true, soon: true },
]

export default function SubscribePage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 56px' }}>

      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-block',
          background: 'var(--c-blue-100)',
          color: 'var(--c-blue-800)',
          fontSize: 12,
          fontWeight: 700,
          padding: '4px 14px',
          borderRadius: 99,
          marginBottom: 12,
        }}>
          🎣 釣り予報AI プラン
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--c-blue-950)', marginBottom: 10 }}>
          今日釣れそうな場所がわかる
        </h1>
        <p style={{ fontSize: 14, color: 'var(--c-gray-600)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
          無料登録で地域の活性スコアをいつでも確認。プレミアムでメール通知・スポット詳細予報が使えます。
        </p>
      </div>

      {/* プラン比較 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 36,
      }}>

        {/* 無料プラン */}
        <div className="card" style={{ padding: '24px 22px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gray-500)', marginBottom: 6 }}>
              無料プラン
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--c-blue-900)', marginBottom: 4 }}>
              ¥0
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-gray-500)' }}>ずっと無料</div>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FREE_FEATURES.map((f) => (
              <li key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-gray-700)' }}>
                <span style={{ color: 'var(--c-green-600)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {f.label}
              </li>
            ))}
          </ul>

          <a
            href="/signup"
            className="btn-primary"
            data-cta="subscribe-free"
            style={{
              background: 'var(--c-blue-800)',
              color: '#fff',
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            まずは無料で始める
          </a>
        </div>

        {/* プレミアムプラン */}
        <div className="card" style={{
          padding: '24px 22px',
          border: '2px solid var(--c-blue-700)',
          position: 'relative',
          overflow: 'visible',
        }}>
          <div style={{
            position: 'absolute',
            top: -13,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--c-blue-800)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 14px',
            borderRadius: 99,
            whiteSpace: 'nowrap',
          }}>
            近日公開予定
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gray-500)', marginBottom: 6 }}>
              Plusプラン
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--c-blue-900)', marginBottom: 4 }}>
              準備中
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-gray-500)' }}>リリース前に通知を受け取る</div>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLUS_FEATURES.map((f) => (
              <li key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: f.soon ? 'var(--c-gray-500)' : 'var(--c-gray-700)' }}>
                <span style={{ color: f.soon ? 'var(--c-gray-400)' : 'var(--c-green-600)', fontWeight: 700, flexShrink: 0 }}>
                  {f.soon ? '◎' : '✓'}
                </span>
                {f.label}
                {f.soon && (
                  <span className="badge-coming-soon" style={{ padding: '1px 7px', borderRadius: 99, fontSize: '0.62rem' }}>
                    準備中
                  </span>
                )}
              </li>
            ))}
          </ul>

          <button
            disabled
            data-cta="subscribe-premium"
            style={{
              width: '100%',
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'var(--c-gray-200)',
              color: 'var(--c-gray-500)',
              border: 'none',
              cursor: 'not-allowed',
              minHeight: 44,
            }}
          >
            通知を受け取る（準備中）
          </button>
        </div>
      </div>

      {/* FAQ */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 16 }}>
          ❓ よくある質問
        </h2>
        {[
          { q: '無料プランでできることは？', a: '毎日更新の釣りスポットランキング上位3件・地域別活性スコア・釣果レポート・記事・釣具最安値をすべて無料で確認できます。' },
          { q: 'Plusプランはいつ開始？', a: '現在準備中です。無料登録しておくと、リリース時に優先してご案内します。全スポットランキングや通知機能がご利用いただけます。' },
          { q: 'クレジットカードは必要？', a: '無料プランの登録にカード情報は不要です。メールアドレスのみで登録できます。' },
        ].map((item) => (
          <div key={item.q} style={{
            background: 'var(--c-gray-50)',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 10,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--c-blue-800)' }}>
              Q: {item.q}
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-gray-700)', lineHeight: 1.6 }}>
              A: {item.a}
            </div>
          </div>
        ))}
      </section>

      {/* 最終 CTA */}
      <div style={{
        background: 'linear-gradient(135deg, var(--c-blue-900), var(--c-teal-800))',
        borderRadius: 'var(--r-card)',
        padding: '26px 22px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
          今すぐ無料で始める
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 18 }}>
          登録30秒。クレジットカード不要。
        </div>
        <a href="/signup" className="btn-primary" data-cta="subscribe-free">
          ✅ 無料で釣り予報を受け取る
        </a>
      </div>

    </main>
  )
}
