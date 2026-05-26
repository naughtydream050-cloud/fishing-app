import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Plus登録完了｜釣り予報AI',
  description: 'Plusプランへの登録が完了しました。',
}

export default function SubscribeSuccessPage() {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--c-blue-950)', marginBottom: 12 }}>
        Plus登録が完了しました
      </h1>
      <p style={{ fontSize: 15, color: 'var(--c-gray-600)', lineHeight: 1.7, marginBottom: 32 }}>
        ありがとうございます。Plusプランのすべての機能がご利用いただけます。<br />
        さっそく今日の釣りスポットランキングを確認してみましょう。
      </p>
      <Link
        href="/spots"
        style={{
          display: 'inline-block',
          background: 'var(--c-blue-600, #2563eb)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          padding: '14px 32px',
          borderRadius: 8,
          textDecoration: 'none',
        }}
      >
        🎣 今日のランキングを見る
      </Link>
      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--c-gray-500)' }}>
        解約はいつでも可能です。設定はStripeカスタマーポータルから行えます。
      </p>
    </main>
  )
}
